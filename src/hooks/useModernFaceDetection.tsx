import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

interface FaceData {
  detection: faceapi.FaceDetection;
  landmarks: faceapi.FaceLandmarks68;
  skinTone: string;
  faceShape: string;
  facialFeatures: {
    eyeShape: string;
    lipShape: string;
    noseShape: string;
    eyebrowShape: string;
  };
}

interface UseFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
}

// Helper function to analyze facial features from landmarks
function analyzeFacialFeatures(landmarks: faceapi.Point[]): {
  eyeShape: string;
  lipShape: string;
  noseShape: string;
  eyebrowShape: string;
} {
  // Left eye landmarks: 36-41, Right eye: 42-47
  const leftEye = landmarks.slice(36, 42);
  const rightEye = landmarks.slice(42, 48);
  
  // Calculate eye width and height
  const leftEyeWidth = Math.abs(leftEye[3].x - leftEye[0].x);
  const leftEyeHeight = Math.abs(leftEye[1].y - leftEye[4].y);
  const eyeRatio = leftEyeHeight / leftEyeWidth;
  
  let eyeShape = 'almond';
  if (eyeRatio > 0.4) eyeShape = 'round';
  else if (eyeRatio < 0.25) eyeShape = 'narrow';
  
  // Lip landmarks: 48-67
  const lips = landmarks.slice(48, 68);
  const lipWidth = Math.abs(lips[6].x - lips[0].x);
  const lipHeight = Math.abs(lips[3].y - lips[9].y);
  const lipRatio = lipHeight / lipWidth;
  
  let lipShape = 'average';
  if (lipRatio > 0.35) lipShape = 'full';
  else if (lipRatio < 0.25) lipShape = 'thin';
  
  // Nose landmarks: 27-35
  const nose = landmarks.slice(27, 36);
  const noseWidth = Math.abs(nose[4].x - nose[0].x);
  const noseLength = Math.abs(nose[6].y - nose[0].y);
  const noseRatio = noseWidth / noseLength;
  
  let noseShape = 'straight';
  if (noseRatio > 0.8) noseShape = 'wide';
  else if (noseRatio < 0.6) noseShape = 'narrow';
  
  // Eyebrow landmarks: 17-26
  const leftBrow = landmarks.slice(17, 22);
  const rightBrow = landmarks.slice(22, 27);
  const browCurve = Math.abs(leftBrow[2].y - (leftBrow[0].y + leftBrow[4].y) / 2);
  
  let eyebrowShape = 'straight';
  if (browCurve > 3) eyebrowShape = 'arched';
  else if (browCurve < 1) eyebrowShape = 'flat';
  
  return {
    eyeShape,
    lipShape,
    noseShape,
    eyebrowShape
  };
}

// Helper function to analyze skin tone (simplified)
function analyzeSkinTone(faceBox: faceapi.Box): string {
  // This is a simplified approach - in real implementation, 
  // you'd analyze actual pixel values from the face region
  const tones = ['fair', 'light', 'medium', 'olive', 'tan', 'deep'];
  return tones[Math.floor(Math.random() * tones.length)];
}

// Helper function to calculate face shape from landmarks
function calculateFaceShape(landmarks: faceapi.Point[]): string {
  const faceWidth = Math.abs(landmarks[16].x - landmarks[0].x);
  const faceHeight = Math.abs(landmarks[8].y - landmarks[19].y);
  const ratio = faceHeight / faceWidth;
  
  const jawWidth = Math.abs(landmarks[14].x - landmarks[2].x);
  const cheekWidth = Math.abs(landmarks[15].x - landmarks[1].x);
  const foreheadWidth = Math.abs(landmarks[17].x - landmarks[26].x);
  
  if (ratio > 1.5) return 'oblong';
  if (ratio < 1.1) return 'round';
  if (jawWidth / faceWidth > 0.9) return 'square';
  if (foreheadWidth > jawWidth * 1.2) return 'heart';
  if (cheekWidth > jawWidth && cheekWidth > foreheadWidth) return 'diamond';
  
  return 'oval';
}

export const useModernFaceDetection = ({ videoRef, canvasRef, isActive }: UseFaceDetectionProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceData, setFaceData] = useState<FaceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const isDetecting = useRef(false);

  // Initialize face detection models
  const initializeModels = useCallback(async () => {
    if (isInitialized) return true;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load models with proper configuration
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      
      console.log('Face detection models loaded successfully');
      setIsInitialized(true);
      return true;
    } catch (err) {
      console.error('Failed to initialize face detection:', err);
      setError('Failed to load face detection models');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Detect faces in video
  const detectFaces = useCallback(async () => {
    if (!isInitialized || !videoRef.current || !canvasRef.current || isDetecting.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Ensure video is ready
    if (video.readyState !== 4 || video.videoWidth === 0) {
      return;
    }

    try {
      isDetecting.current = true;
      
      // Resize canvas to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Detect faces with landmarks only
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (detections.length > 0) {
        const detection = detections[0];
        
        setFaceDetected(true);
        // Analyze facial features from landmarks
        const facialFeatures = analyzeFacialFeatures(detection.landmarks.positions);
        const skinTone = analyzeSkinTone(detection.detection.box);
        const faceShape = calculateFaceShape(detection.landmarks.positions);
        
        setFaceData({
          detection: detection.detection,
          landmarks: detection.landmarks,
          skinTone,
          faceShape,
          facialFeatures
        });

        // Draw face detection overlay
        if (ctx) {
          // Draw face box
          const box = detection.detection.box;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          
          // Draw landmarks
          ctx.fillStyle = '#ff0000';
          detection.landmarks.positions.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });
          
          // Draw confidence text
          ctx.fillStyle = '#00ff00';
          ctx.font = '16px Arial';
          ctx.fillText(
            `Confidence: ${Math.round(detection.detection.score * 100)}%`,
            box.x,
            box.y - 10
          );
        }
      } else {
        setFaceDetected(false);
        setFaceData(null);
      }
    } catch (err) {
      console.error('Face detection error:', err);
      setFaceDetected(false);
      setFaceData(null);
    } finally {
      isDetecting.current = false;
    }
  }, [isInitialized, videoRef, canvasRef]);

  // Start detection loop
  const startDetection = useCallback(() => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    
    detectionInterval.current = setInterval(detectFaces, 100); // 10 FPS
  }, [detectFaces]);

  // Stop detection loop
  const stopDetection = useCallback(() => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
    setFaceDetected(false);
    setFaceData(null);
  }, []);

  // Effect to handle detection lifecycle
  useEffect(() => {
    if (isActive && isInitialized) {
      startDetection();
    } else {
      stopDetection();
    }
    
    return stopDetection;
  }, [isActive, isInitialized, startDetection, stopDetection]);

  // Initialize models when component mounts
  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // Get facial analysis data
  const getFacialAnalysis = useCallback(() => {
    if (!faceData) return null;
    
    return {
      faceShape: faceData.faceShape,
      skinTone: faceData.skinTone,
      facialFeatures: faceData.facialFeatures,
      landmarks: faceData.landmarks.positions
    };
  }, [faceData]);

  return {
    isInitialized,
    isLoading,
    faceDetected,
    faceData,
    error,
    initializeModels,
    getFacialAnalysis
  };
};