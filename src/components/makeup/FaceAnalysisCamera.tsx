
import React, { useRef, useEffect, useState } from 'react';
import { Loader2, Volume2, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GanOutput from './GanOutput';
import { Progress } from '@/components/ui/progress';
import LookProgressTracker from './LookProgressTracker';
import LookDetailsPanel from './LookDetailsPanel';
import { detectFacialLandmarks, getMovementTrends } from '@/lib/faceDetection';
import FacialAnalysisDisplay from './FacialAnalysisDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FaceAnalysisProps {
  cameraActive: boolean;
  isAnalyzing: boolean;
  progressPercentage: number;
  currentGuidance: string;
  detectedFacialTraits: {
    skinTone: string;
    faceShape: string;
    features: string[];
    recommendations: string[];
  } | null;
  analysisImage: string | null;
  analysisError: string | null;
  voiceEnabled: boolean;
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
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const FaceAnalysisCamera: React.FC<FaceAnalysisProps> = ({
  cameraActive,
  isAnalyzing,
  progressPercentage,
  currentGuidance,
  detectedFacialTraits,
  analysisImage,
  analysisError,
  voiceEnabled,
  availableLooks,
  selectedLookId,
  onSelectLook,
  lookGuidance,
  onCaptureAndAnalyze,
  onToggleCamera,
  videoRef,
  canvasRef
}) => {
  const [faceDetected, setFaceDetected] = useState(false);
  const [movementData, setMovementData] = useState({ x: 0, y: 0, magnitude: 0 });
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const faceDetectionIntervalRef = useRef<number | null>(null);
  const movementAnalysisIntervalRef = useRef<number | null>(null);
  
  // Draw guide overlay on canvas for real-time feedback
  const drawOverlay = (landmarks: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!landmarks) return;
    
    // Draw facial feature guides
    try {
      // Draw jawline
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(200, 100, 255, 0.6)';
      ctx.lineWidth = 3;
      
      // Draw points on jawline
      const jawline = landmarks.getJawOutline();
      ctx.moveTo(jawline[0].x, jawline[0].y);
      jawline.forEach((point: {x: number, y: number}) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      
      // Draw eyes
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 100, 200, 0.6)';
      ctx.moveTo(leftEye[0].x, leftEye[0].y);
      leftEye.forEach((point: {x: number, y: number}) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(rightEye[0].x, rightEye[0].y);
      rightEye.forEach((point: {x: number, y: number}) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
      
      // Draw lips
      const mouth = landmarks.getMouth();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
      ctx.moveTo(mouth[0].x, mouth[0].y);
      mouth.forEach((point: {x: number, y: number}) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
      
      // Draw guidance text
      if (lookGuidance.currentStep >= 0) {
        const instruction = lookGuidance.getCurrentInstruction();
        if (instruction) {
          ctx.font = '16px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(10, canvas.height - 60, canvas.width - 20, 50);
          ctx.fillStyle = 'rgba(100, 50, 200, 1)';
          ctx.fillText(instruction.instruction, 20, canvas.height - 35);
        }
      }
    } catch (error) {
      console.error('Error drawing facial landmarks:', error);
    }
  };
  
  // Run face detection on an interval when camera is active
  useEffect(() => {
    if (!cameraActive || !videoRef.current) {
      setFaceDetected(false);
      if (faceDetectionIntervalRef.current) {
        window.clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
      if (movementAnalysisIntervalRef.current) {
        window.clearInterval(movementAnalysisIntervalRef.current);
        movementAnalysisIntervalRef.current = null;
      }
      return;
    }
    
    // Set up interval for face detection
    faceDetectionIntervalRef.current = window.setInterval(async () => {
      if (videoRef.current) {
        try {
          const detection = await detectFacialLandmarks(videoRef.current);
          const wasDetected = !!detection;
          setFaceDetected(wasDetected);
          
          // Draw guide overlay if face is detected
          if (wasDetected && detection) {
            drawOverlay(detection.landmarks);
            
            // Detect makeup activities
            detectMakeupActivities(detection);
          } else if (canvasRef.current) {
            // Clear canvas if no face detected
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }
        } catch (error) {
          console.error('Face detection error:', error);
        }
      }
    }, 200);
    
    // Set up interval for movement analysis
    movementAnalysisIntervalRef.current = window.setInterval(() => {
      const trends = getMovementTrends();
      setMovementData(trends);
      
      // Log significant movements for AI learning
      if (trends.magnitude > 5) {
        console.log('Significant movement detected:', trends);
        
        // Detect activities based on movement
        if (Math.abs(trends.x) > Math.abs(trends.y)) {
          setLastActivity(trends.x > 0 ? "Looking right" : "Looking left");
        } else {
          setLastActivity(trends.y > 0 ? "Looking down" : "Looking up");
        }
      }
    }, 1000);
    
    return () => {
      if (faceDetectionIntervalRef.current) {
        window.clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
      if (movementAnalysisIntervalRef.current) {
        window.clearInterval(movementAnalysisIntervalRef.current);
        movementAnalysisIntervalRef.current = null;
      }
    };
  }, [cameraActive, videoRef, canvasRef, lookGuidance]);
  
  // Simulate detecting makeup activities (would be replaced with real AI object detection)
  const detectMakeupActivities = (detection: any) => {
    // This is a simulation - in a real system, we'd use AI to detect actual makeup activities
    const currentStep = lookGuidance.currentStep;
    const stepName = lookGuidance.stepNames[currentStep] || '';
    
    // Random chance to detect an activity related to current step
    if (Math.random() < 0.05) {
      const activities = [
        "Applying foundation",
        "Blending concealer",
        "Using eyeshadow brush",
        "Applying lipstick",
        "Blending blush",
        "Curling eyelashes",
        "Adding highlighter"
      ];
      
      let detectedActivity = activities[Math.floor(Math.random() * activities.length)];
      
      // Try to match with current step
      if (stepName.toLowerCase().includes('foundation') && detectedActivity.includes('foundation')) {
        detectedActivity += " correctly";
      } else if (stepName.toLowerCase().includes('lip') && detectedActivity.includes('lipstick')) {
        detectedActivity += " correctly";
      } else if (stepName.toLowerCase().includes('eye') && 
                (detectedActivity.includes('eyeshadow') || detectedActivity.includes('eyelash'))) {
        detectedActivity += " correctly";
      } else if (stepName.toLowerCase().includes('blush') && detectedActivity.includes('blush')) {
        detectedActivity += " correctly";
      }
      
      setLastActivity(detectedActivity);
      
      // Clear after a few seconds
      setTimeout(() => {
        setLastActivity(null);
      }, 3000);
    }
  };
  
  // Get current step instruction
  const currentInstruction = lookGuidance.getCurrentInstruction();
  
  // Make canvas visible for real-time overlay
  useEffect(() => {
    if (canvasRef.current && videoRef.current && cameraActive) {
      canvasRef.current.style.display = 'block';
      canvasRef.current.style.position = 'absolute';
      canvasRef.current.style.top = '0';
      canvasRef.current.style.left = '0';
      canvasRef.current.width = videoRef.current.videoWidth || 640;
      canvasRef.current.height = videoRef.current.videoHeight || 480;
    }
  }, [canvasRef, videoRef, cameraActive]);
  
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-3/5">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              className="w-full h-64 object-cover"
            />
            <canvas 
              ref={canvasRef} 
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" 
            />
            
            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                <div className="text-white text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Analyzing your face...</p>
                </div>
              </div>
            )}
            
            {!faceDetected && cameraActive && !isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                <div className="text-white text-center bg-red-900/70 p-4 rounded-lg max-w-xs">
                  <p>No face detected. Please position your face in the frame.</p>
                </div>
              </div>
            )}
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 z-20">
              <Progress 
                value={progressPercentage}
                className="rounded-none"
              />
            </div>
            
            {/* Activity feedback overlay */}
            {lastActivity && faceDetected && (
              <div className="absolute top-2 left-2 right-2 bg-purple-900/70 text-white text-sm p-2 rounded z-20">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-300" />
                  <span>AI detected: {lastActivity}</span>
                </div>
              </div>
            )}
            
            {/* Movement debugging overlay */}
            {faceDetected && movementData.magnitude > 0 && (
              <div className="absolute top-12 right-2 bg-black/50 text-white text-xs p-1 rounded z-20">
                Movement: {movementData.magnitude.toFixed(1)}
              </div>
            )}
          </div>
          
          {/* Step navigation controls */}
          {cameraActive && selectedLookId && (
            <div className="mt-4 flex justify-between items-center">
              <Button 
                onClick={lookGuidance.goToPreviousStep}
                variant="ghost"
                size="sm"
                disabled={lookGuidance.currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <Button
                onClick={lookGuidance.markCompleted}
                variant="outline"
                size="sm"
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
              
              <Button 
                onClick={lookGuidance.goToNextStep}
                variant="ghost"
                size="sm"
                disabled={lookGuidance.currentStep === lookGuidance.totalSteps - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
          
          {/* Capture button */}
          {!detectedFacialTraits && (
            <div className="flex justify-center mt-4">
              <Button 
                onClick={onCaptureAndAnalyze}
                disabled={isAnalyzing || !faceDetected}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isAnalyzing ? "Analyzing..." : "Analyze Facial Features"}
              </Button>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-2/5">
          {selectedLookId && availableLooks.length > 0 && (
            <div className="h-full">
              {/* Step progress tracker */}
              <LookProgressTracker 
                currentStep={lookGuidance.currentStep}
                totalSteps={lookGuidance.totalSteps}
                completedSteps={lookGuidance.completedSteps}
                stepNames={lookGuidance.stepNames}
                onSelectStep={lookGuidance.selectStep}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Current step guidance with AI feedback */}
      {currentInstruction && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-start">
            <Volume2 className={`h-5 w-5 ${voiceEnabled ? 'text-purple-600' : 'text-gray-400'} mr-2 mt-0.5`} />
            <div className="flex-1">
              <p className="text-purple-800 font-medium">{currentInstruction.instruction}</p>
              {currentInstruction.customization && (
                <p className="text-purple-600 text-sm mt-1 italic">{currentInstruction.customization}</p>
              )}
              
              {/* AI dynamic feedback based on detected actions */}
              {lastActivity && (
                <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-700 text-sm">
                    I noticed you're {lastActivity.toLowerCase()}. 
                    {lastActivity.includes("correctly") 
                      ? " Great job! Continue with this technique." 
                      : ` Make sure to follow the current step: ${currentInstruction.instruction}`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Facial Analysis Display */}
      {detectedFacialTraits && (
        <FacialAnalysisDisplay
          detectedFacialTraits={detectedFacialTraits}
          voiceEnabled={voiceEnabled}
          analysisImage={analysisImage}
          movementData={movementData}
          lastActivity={lastActivity || undefined}
        />
      )}
      
      {/* Look details */}
      {selectedLookId && availableLooks.length > 0 && (
        <div className="mt-4">
          <LookDetailsPanel 
            look={availableLooks.find(look => look.id === selectedLookId)!}
            personalizedRecommendations={detectedFacialTraits?.recommendations}
          />
        </div>
      )}
      
      {/* Generated Look Display */}
      {analysisImage && !detectedFacialTraits && (
        <GanOutput
          imageUrl={analysisImage}
          isLoading={isAnalyzing}
          error={analysisError || undefined}
          className="w-full h-64"
        />
      )}
    </div>
  );
};

export default FaceAnalysisCamera;
