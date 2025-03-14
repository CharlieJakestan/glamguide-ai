
import React, { useRef } from 'react';
import { Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GanOutput from './GanOutput';
import { Progress } from '@/components/ui/progress';

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
  onCaptureAndAnalyze,
  onToggleCamera,
  videoRef,
  canvasRef
}) => {
  return (
    <div className="space-y-4 mb-6">
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
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2">
          <Progress 
            value={progressPercentage}
            className="rounded-none"
          />
        </div>
      </div>
      
      {/* Capture button */}
      <div className="flex justify-center">
        <Button 
          onClick={onCaptureAndAnalyze}
          disabled={isAnalyzing}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {isAnalyzing ? "Analyzing..." : "Analyze Facial Features"}
        </Button>
      </div>
      
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
      
      {/* Current guidance */}
      {currentGuidance && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-start">
            <Volume2 className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
            <p className="text-purple-800 flex-1">{currentGuidance}</p>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-sm text-purple-700 mb-1">
              <span>Application Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
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
