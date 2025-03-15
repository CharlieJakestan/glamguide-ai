
import React, { useRef, useEffect, useState } from 'react';
import { Loader2, Volume2, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GanOutput from './GanOutput';
import { Progress } from '@/components/ui/progress';
import LookProgressTracker from './LookProgressTracker';
import LookDetailsPanel from './LookDetailsPanel';
import { detectFacialLandmarks } from '@/lib/faceDetection';

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
  const faceDetectionIntervalRef = useRef<number | null>(null);
  
  // Run face detection on an interval when camera is active
  useEffect(() => {
    if (!cameraActive || !videoRef.current) {
      setFaceDetected(false);
      if (faceDetectionIntervalRef.current) {
        window.clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
      return;
    }
    
    // Set up interval for face detection
    faceDetectionIntervalRef.current = window.setInterval(async () => {
      if (videoRef.current) {
        const detection = await detectFacialLandmarks(videoRef.current);
        setFaceDetected(!!detection);
      }
    }, 1000);
    
    return () => {
      if (faceDetectionIntervalRef.current) {
        window.clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
    };
  }, [cameraActive, videoRef]);
  
  // Get current step instruction
  const currentInstruction = lookGuidance.getCurrentInstruction();
  
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
              className="hidden" // Hide the canvas, it's just for processing
            />
            
            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Analyzing your face...</p>
                </div>
              </div>
            )}
            
            {!faceDetected && cameraActive && !isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center bg-red-900/70 p-4 rounded-lg max-w-xs">
                  <p>No face detected. Please position your face in the frame.</p>
                </div>
              </div>
            )}
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2">
              <Progress 
                value={progressPercentage}
                className="rounded-none"
              />
            </div>
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
      
      {/* Current step guidance */}
      {currentInstruction && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-start">
            <Volume2 className={`h-5 w-5 ${voiceEnabled ? 'text-purple-600' : 'text-gray-400'} mr-2 mt-0.5`} />
            <div className="flex-1">
              <p className="text-purple-800 font-medium">{currentInstruction.instruction}</p>
              {currentInstruction.customization && (
                <p className="text-purple-600 text-sm mt-1 italic">{currentInstruction.customization}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Analysis Results Display */}
      {detectedFacialTraits && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-800 mb-3">Your Facial Analysis</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-purple-700"><strong>Skin Tone:</strong> {detectedFacialTraits.skinTone}</p>
              <p className="text-purple-700"><strong>Face Shape:</strong> {detectedFacialTraits.faceShape}</p>
            </div>
            <div>
              <p className="text-purple-700"><strong>Features:</strong></p>
              <ul className="list-disc list-inside text-purple-600 text-sm">
                {detectedFacialTraits.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
          
          {detectedFacialTraits.recommendations.length > 0 && (
            <div className="mt-3">
              <p className="text-purple-800 font-medium">Personalized Recommendations:</p>
              <ul className="list-disc list-inside text-purple-600 text-sm mt-1">
                {detectedFacialTraits.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
      {analysisImage && (
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
