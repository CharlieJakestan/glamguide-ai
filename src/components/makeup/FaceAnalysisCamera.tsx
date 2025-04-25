import React, { useRef, useEffect, useState, useCallback } from 'react';
import GanOutput from './GanOutput';
import LookProgressTracker from './LookProgressTracker';
import LookDetailsPanel from './LookDetailsPanel';
import FacialAnalysisDisplay from './FacialAnalysisDisplay';
import VoiceGuidance from './VoiceGuidance';
import { ReferenceLook, getReferenceLookById } from '@/services/lookReferenceService';
import { Loader2 } from 'lucide-react';

let Camera: any = null;
let FaceMesh: any = null;
let drawConnectors: any = null;
let FACEMESH_TESSELATION: any = null;

try {
  const mediapipe = require('@mediapipe/face_mesh');
  const cameraUtils = require('@mediapipe/camera_utils');
  const drawingUtils = require('@mediapipe/drawing_utils');
  
  FaceMesh = mediapipe.FaceMesh;
  FACEMESH_TESSELATION = mediapipe.FACEMESH_TESSELATION;
  Camera = cameraUtils.Camera;
  drawConnectors = drawingUtils.drawConnectors;
} catch (error) {
  console.warn('MediaPipe libraries not available:', error);
}

interface FaceAnalysisCameraProps {
  cameraActive: boolean;
  isAnalyzing: boolean;
  progressPercentage: number;
  currentGuidance: string | null;
  detectedFacialTraits: {
    skinTone: string;
    faceShape: string;
    skinType?: string;
    features: string[];
    recommendations: string[];
  } | null;
  analysisImage: string | null;
  analysisError: string | null;
  voiceEnabled: boolean;
  onVoiceEnabledChange: (enabled: boolean) => void;
  availableLooks: any[];
  selectedLookId: string | null;
  onSelectLook: (lookId: string) => void;
  lookGuidance: {
    currentStep: number;
    completedSteps: number[];
    totalSteps: number;
    stepNames: string[];
    getCurrentInstruction: () => { instruction: string; customization?: string } | null;
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    markCompleted: () => void;
    selectStep: (index: number) => void;
  };
  onCaptureAndAnalyze: () => void;
  onToggleCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  faceDetected?: boolean;
  onFaceDetectionChange?: (detected: boolean) => void;
  movementData?: { x: number; y: number; magnitude: number };
  lastActivity?: string | null;
  nearbyObjects?: Array<{ type: string; position: { x: number; y: number } }>;
  detectedMakeupTools?: Array<{ type: string; confidence: number }>;
}

const FaceAnalysisCamera: React.FC<FaceAnalysisCameraProps> = ({
  cameraActive,
  isAnalyzing,
  progressPercentage,
  currentGuidance,
  detectedFacialTraits,
  analysisImage,
  analysisError,
  voiceEnabled,
  onVoiceEnabledChange,
  availableLooks,
  selectedLookId,
  onSelectLook,
  lookGuidance,
  onCaptureAndAnalyze,
  onToggleCamera,
  videoRef,
  canvasRef,
  faceDetected = false,
  onFaceDetectionChange,
  movementData = { x: 0, y: 0, magnitude: 0 },
  lastActivity = null,
  nearbyObjects = [],
  detectedMakeupTools = [],
}) => {
  const [showGuidance, setShowGuidance] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [highlightedRegion, setHighlightedRegion] = useState<string | null>(null);
  const [localFaceDetected, setLocalFaceDetected] = useState(false);
  const [localDetectedTraits, setLocalDetectedTraits] = useState<{
    skinTone: string;
    faceShape: string;
    skinType: string;
    features: string[];
    recommendations: string[];
  } | null>(null);
  const [mediapipeAvailable, setMediapipeAvailable] = useState(!!FaceMesh);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const landmarkHistoryRef = useRef<Array<Array<{ x: number; y: number; z: number }>>>([]);

  const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  };

  const smoothLandmarks = (landmarks: Array<{ x: number; y: number; z: number }>) => {
    if (landmarkHistoryRef.current.length === 0) {
      landmarkHistoryRef.current.push(landmarks);
      return landmarks;
    }

    const history = landmarkHistoryRef.current;
    history.push(landmarks);
    if (history.length > 5) history.shift(); // Keep last 5 frames

    const smoothed = landmarks.map((_, index) => {
      const avg = history.reduce(
        (acc, frame) => ({
          x: acc.x + frame[index].x,
          y: acc.y + frame[index].y,
          z: acc.z + frame[index].z,
        }),
        { x: 0, y: 0, z: 0 }
      );
      return {
        x: avg.x / history.length,
        y: avg.y / history.length,
        z: avg.z / history.length,
      };
    });

    return smoothed;
  };

  const analyzeFaceShape = (landmarks: Array<{ x: number; y: number; z: number }>, width: number, height: number) => {
    const landmarksPixel = landmarks.map(l => ({ x: l.x * width, y: l.y * height }));
    const jawPoints = landmarksPixel.slice(0, 17); // Jawline
    const foreheadPoint = landmarksPixel[151]; // Forehead center
    const cheekLeft = landmarksPixel[37]; // Left cheek
    const cheekRight = landmarksPixel[46]; // Right cheek
    const chinPoint = landmarksPixel[152]; // Chin bottom
    const foreheadLeft = landmarksPixel[10]; // Left forehead
    const foreheadRight = landmarksPixel[155]; // Right forehead

    const jawWidth = calculateDistance(jawPoints[0], jawPoints[16]);
    const faceHeight = calculateDistance(jawPoints[8], foreheadPoint);
    const cheekWidth = calculateDistance(cheekLeft, cheekRight);
    const jawToChin = calculateDistance(jawPoints[8], chinPoint);
    const foreheadWidth = calculateDistance(foreheadLeft, foreheadRight);

    const widthHeightRatio = jawWidth / faceHeight;
    const cheekJawRatio = cheekWidth / jawWidth;
    const jawForeheadRatio = jawWidth / foreheadWidth;
    const jawChinRatio = jawToChin / faceHeight;

    if (widthHeightRatio >= 1.0 && cheekJawRatio >= 1.0 && jawForeheadRatio >= 0.95 && jawForeheadRatio <= 1.05) {
      return 'Round';
    } else if (widthHeightRatio >= 1.3 && widthHeightRatio <= 1.5 && cheekJawRatio < 0.95 && jawForeheadRatio > 1.05 && jawChinRatio < 0.2) {
      return 'Square';
    } else if (widthHeightRatio <= 1.2 && cheekJawRatio >= 0.85 && cheekJawRatio <= 0.95 && jawForeheadRatio < 0.95 && jawChinRatio > 0.2) {
      return 'Oval';
    } else if (widthHeightRatio > 1.2 && cheekJawRatio > 1.0 && jawForeheadRatio > 1.1 && jawChinRatio > 0.25) {
      return 'Heart';
    } else if (widthHeightRatio < 1.0 && jawForeheadRatio < 0.8) {
      return 'Oblong';
    } else {
      return 'Diamond';
    }
  };

  const analyzeSkinTone = (ctx: CanvasRenderingContext2D, landmarks: Array<{ x: number; y: number; z: number }>, width: number, height: number) => {
    const noseTip = landmarks[168]; // Nose tip as center of ROI
    const roiSize = Math.min(width, height) * 0.1;
    const x = Math.max(0, noseTip.x * width - roiSize / 2);
    const y = Math.max(0, noseTip.y * height - roiSize / 2);
    const roiWidth = Math.min(roiSize, width - x);
    const roiHeight = Math.min(roiSize, height - y);

    const imageData = ctx.getImageData(x, y, roiWidth, roiHeight);
    const data = imageData.data;

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
      count++;
    }

    const rMean = rSum / count;
    const gMean = gSum / count;
    const bMean = bSum / count;

    const r = rMean / 255;
    const g = gMean / 255;
    const b = bMean / 255;
    const cmax = Math.max(r, g, b);
    const cmin = Math.min(r, g, b);
    const delta = cmax - cmin;
    let h = 0;
    if (delta !== 0) {
      if (cmax === r) h = 60 * (((g - b) / delta) % 6);
      else if (cmax === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
    }
    const s = cmax === 0 ? 0 : delta / cmax;
    const v = cmax;

    const [l, a, bLab] = rgbToLab(rMean, gMean, bMean);

    if (l < 60 && v < 0.47 && a > 125 && bLab > 125) return 'Dark';
    if (l >= 60 && l <= 75 && v >= 0.47 && v <= 0.63 && a >= 115 && a <= 130 && bLab >= 115 && bLab <= 130) return 'Medium';
    if (l > 75 && v > 0.63 && a <= 115 && bLab <= 115) return 'Fair';
    if (l >= 65 && l <= 80 && v >= 0.55 && v <= 0.67 && a >= 110 && a <= 120 && bLab >= 110 && bLab <= 120) return 'Light Medium';
    return 'Tan';
  };

  const rgbToLab = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    r *= 100;
    g *= 100;
    b *= 100;

    let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    let z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    x /= 95.047;
    y /= 100;
    z /= 108.883;

    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16/116);
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16/116);
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16/116);

    const l = (116 * y) - 16;
    const a = 500 * (x - y);
    const bLab = 200 * (y - z);

    return [l, a, bLab];
  };

  const analyzeSkinType = (ctx: CanvasRenderingContext2D, landmarks: Array<{ x: number; y: number; z: number }>, width: number, height: number) => {
    const noseTip = landmarks[168];
    const roiSize = Math.min(width, height) * 0.1;
    const x = Math.max(0, noseTip.x * width - roiSize / 2);
    const y = Math.max(0, noseTip.y * height - roiSize / 2);
    const roiWidth = Math.min(roiSize, width - x);
    const roiHeight = Math.min(roiSize, height - y);

    const imageData = ctx.getImageData(x, y, roiWidth, roiHeight);
    const data = imageData.data;

    const grayValues: number[] = [];
    let brightnessSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
      grayValues.push(gray);
      brightnessSum += gray;
    }

    const meanBrightness = brightnessSum / grayValues.length;
    const variance = grayValues.reduce((sum, val) => sum + (val - meanBrightness) ** 2, 0) / grayValues.length;
    const stdDev = Math.sqrt(variance);

    let edgeCount = 0;
    for (let i = 1; i < roiHeight - 1; i++) {
      for (let j = 1; j < roiWidth - 1; j++) {
        const idx = (i * roiWidth + j) * 4;
        const idxLeft = (i * roiWidth + (j - 1)) * 4;
        const idxRight = (i * roiWidth + (j + 1)) * 4;
        const idxTop = ((i - 1) * roiWidth + j) * 4;
        const idxBottom = ((i + 1) * roiWidth + j) * 4;

        const gray = 0.2989 * data[idx] + 0.5870 * data[idx + 1] + 0.1140 * data[idx + 2];
        const grayLeft = 0.2989 * data[idxLeft] + 0.5870 * data[idxLeft + 1] + 0.1140 * data[idxLeft + 2];
        const grayRight = 0.2989 * data[idxRight] + 0.5870 * data[idxRight + 1] + 0.1140 * data[idxRight + 2];
        const grayTop = 0.2989 * data[idxTop] + 0.5870 * data[idxTop + 1] + 0.1140 * data[idxTop + 2];
        const grayBottom = 0.2989 * data[idxBottom] + 0.5870 * data[idxBottom + 1] + 0.1140 * data[idxBottom + 2];

        const gx = (grayRight - grayLeft);
        const gy = (grayBottom - grayTop);
        const gradient = Math.sqrt(gx * gx + gy * gy);
        if (gradient > 20) edgeCount++;
      }
    }

    const edgeDensity = edgeCount / (roiWidth * roiHeight);
    const gradientMean = edgeCount > 0 ? edgeCount / (roiWidth * roiHeight) : 0;

    if (stdDev > 30 && meanBrightness > 125 && edgeDensity > 0.04 && gradientMean > 0.02) return 'Oily';
    if (stdDev < 20 && meanBrightness < 100 && edgeDensity < 0.02 && gradientMean < 0.015) return 'Dry';
    if (stdDev >= 20 && stdDev <= 30 && meanBrightness >= 100 && meanBrightness <= 125 && edgeDensity >= 0.02 && edgeDensity <= 0.04) return 'Mixed';
    return 'Combination';
  };

  const onResults = useCallback((results: any) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const newFaceDetected = !!results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
    setLocalFaceDetected(newFaceDetected);
    if (onFaceDetectionChange) onFaceDetectionChange(newFaceDetected);

    if (newFaceDetected && drawConnectors && FACEMESH_TESSELATION) {
      const landmarks = results.multiFaceLandmarks[0].map((l: any) => ({ x: l.x, y: l.y, z: l.z }));
      const smoothedLandmarks = smoothLandmarks(landmarks);

      try {
        drawConnectors(ctx, smoothedLandmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
      } catch (error) {
        console.warn('Failed to draw face mesh:', error);
      }

      if (isAnalyzing) {
        try {
          const faceShape = analyzeFaceShape(smoothedLandmarks, canvas.width, canvas.height);
          const skinTone = analyzeSkinTone(ctx, smoothedLandmarks, canvas.width, canvas.height);
          const skinType = analyzeSkinType(ctx, smoothedLandmarks, canvas.width, canvas.height);

          setLocalDetectedTraits({
            faceShape,
            skinTone,
            skinType,
            features: [],
            recommendations: [],
          });
        } catch (error) {
          console.warn('Failed to analyze facial traits:', error);
        }
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.2;
      const pulseScale = 1 + Math.sin(Date.now() * 0.003) * 0.05;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * pulseScale, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(120, 90, 220, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (localDetectedTraits) {
        ctx.font = '16px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(`Face Shape: ${localDetectedTraits.faceShape}`, 10, 30);
        ctx.fillText(`Skin Tone: ${localDetectedTraits.skinTone}`, 10, 50);
        ctx.fillText(`Skin Type: ${localDetectedTraits.skinType}`, 10, 70);
      }
    }

    ctx.restore();
  }, [canvasRef, videoRef, isAnalyzing, onFaceDetectionChange]);

  useEffect(() => {
    if (!mediapipeAvailable || !FaceMesh) {
      console.warn('MediaPipe FaceMesh is not available. Face detection will not work.');
      return;
    }
    
    try {
      const faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;
    } catch (error) {
      console.error('Failed to initialize FaceMesh:', error);
      setMediapipeAvailable(false);
    }

    return () => {
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch (error) {
          console.warn('Error closing FaceMesh:', error);
        }
      }
    };
  }, [onResults]);

  useEffect(() => {
    if (!videoRef.current || !cameraActive || !mediapipeAvailable || !Camera) return;

    try {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && faceMeshRef.current) {
            try {
              await faceMeshRef.current.send({ image: videoRef.current });
            } catch (error) {
              console.warn('Error sending frame to FaceMesh:', error);
            }
          }
        },
        width: 640,
        height: 480,
      });

      camera.start();
      cameraRef.current = camera;
    } catch (error) {
      console.error('Failed to initialize Camera:', error);
    }

    return () => {
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (error) {
          console.warn('Error stopping camera:', error);
        }
      }
    };
  }, [cameraActive, mediapipeAvailable]);

  const getCurrentMakeupStep = (): string => {
    const instruction = lookGuidance.getCurrentInstruction();
    return instruction ? (typeof instruction === 'string' ? instruction : instruction.instruction) : '';
  };

  const getSelectedLook = (): ReferenceLook | null => {
    if (!selectedLookId || !availableLooks || availableLooks.length === 0) return null;
    const selectedLook = availableLooks.find(look => look.id === selectedLookId);
    return selectedLook || null;
  };

  const selectedLook = getSelectedLook();

  return (
    <div className="space-y-4 mb-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div ref={cameraContainerRef} className="relative aspect-video bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${!localFaceDetected ? 'opacity-60' : ''}`}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
          {!mediapipeAvailable && cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/80 text-white p-4 rounded-lg max-w-md text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-lg font-semibold">Face detection is unavailable</p>
                <p className="text-sm mt-2">
                  MediaPipe libraries couldn't be loaded. Facial analysis features won't work, 
                  but you can still capture images and use basic functionality.
                </p>
              </div>
            </div>
          )}
          {showGuidance && localFaceDetected && currentGuidance && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg text-white">
              <div className="flex items-start space-x-2">
                <div>
                  <p className="text-sm font-medium">{currentGuidance}</p>
                  <div className="flex items-center mt-2 space-x-1 text-xs">
                    <span className="bg-purple-500 text-white px-2 py-1 rounded">
                      {lookGuidance.currentStep + 1}/{lookGuidance.totalSteps}
                    </span>
                    <span>{lookGuidance.stepNames[lookGuidance.currentStep]}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 h-1 bg-gray-300">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
          <div
            className={`absolute top-4 right-4 px-2 py-1 rounded transition-colors ${
              localFaceDetected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            <div className="flex items-center text-xs">
              {localFaceDetected ? (
                <span>Face Detected</span>
              ) : (
                <span>No Face Detected</span>
              )}
            </div>
          </div>
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <button
              className="bg-black/30 border-gray-400 text-white hover:bg-black/50 hover:text-white px-2 py-1 rounded"
              onClick={onToggleCamera}
            >
              {cameraActive ? 'Stop Camera' : 'Start Camera'}
            </button>
            <button
              className="bg-black/30 border-gray-400 text-white hover:bg-black/50 hover:text-white px-2 py-1 rounded"
              onClick={() => setOverlayVisible(!overlayVisible)}
            >
              {overlayVisible ? 'Hide Overlay' : 'Show Overlay'}
            </button>
          </div>
          {isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="bg-white p-4 rounded-lg flex flex-col items-center">
                <p className="text-purple-800 font-medium">Analyzing your face...</p>
                <div className="w-40 mt-2 h-1 bg-gray-300">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {lookGuidance.currentStep > 0 && (
                <button
                  className="border px-2 py-1 rounded"
                  onClick={lookGuidance.goToPreviousStep}
                >
                  Previous Step
                </button>
              )}
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded"
                onClick={onCaptureAndAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Capture & Analyze'}
              </button>
              {lookGuidance.currentStep < lookGuidance.totalSteps - 1 && (
                <button
                  className="border px-2 py-1 rounded"
                  onClick={lookGuidance.goToNextStep}
                >
                  Next Step
                </button>
              )}
            </div>
            <button
              className={
                lookGuidance.completedSteps.includes(lookGuidance.currentStep)
                  ? 'bg-green-50 text-green-600 px-2 py-1 rounded'
                  : 'border px-2 py-1 rounded'
              }
              onClick={lookGuidance.markCompleted}
            >
              {lookGuidance.completedSteps.includes(lookGuidance.currentStep)
                ? 'Completed'
                : 'Mark as Complete'}
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {selectedLook && (
            <LookDetailsPanel
              look={selectedLook}
              personalizedRecommendations={localDetectedTraits?.recommendations}
            />
          )}
          <FacialAnalysisDisplay 
            detectedFacialTraits={localDetectedTraits} 
            voiceEnabled={voiceEnabled}
            analysisImage={analysisImage}
            movementData={movementData}
            lastActivity={lastActivity}
            nearbyObjects={nearbyObjects?.map(obj => ({
              type: obj.type,
              position: obj.position,
              confidence: 0.8  // Add default confidence for type compatibility
            }))}
            detectedMakeupTools={detectedMakeupTools}
          />
        </div>
        <div>
          <VoiceGuidance
            enabled={voiceEnabled}
            onEnabledChange={onVoiceEnabledChange}
            currentInstruction={currentGuidance || undefined}
            progress={progressPercentage}
            onGenerateMockData={onCaptureAndAnalyze}
            faceDetected={localFaceDetected}
            lastActivity={lastActivity}
            currentMakeupStep={getCurrentMakeupStep()}
            detectedObjects={nearbyObjects?.map(obj => ({
              type: obj.type,
              position: obj.position,
              confidence: 0.8  // Add default confidence for type compatibility
            }))}
            movementData={movementData}
            detectedMakeupTools={detectedMakeupTools}
          />
          <div className="mt-4">
            <LookProgressTracker
              currentStep={lookGuidance.currentStep}
              completedSteps={lookGuidance.completedSteps}
              totalSteps={lookGuidance.totalSteps}
              stepNames={lookGuidance.stepNames}
              onSelectStep={lookGuidance.selectStep}
            />
          </div>
          {analysisError && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              <p>{analysisError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceAnalysisCamera;
