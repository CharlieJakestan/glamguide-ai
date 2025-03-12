
import React, { RefObject, useEffect, useState } from 'react';
import { CameraOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoDisplayProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isStreamActive: boolean;
  faceDetected: boolean;
  retryFaceDetection?: () => void;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({
  videoRef,
  canvasRef,
  isStreamActive,
  faceDetected,
  retryFaceDetection,
}) => {
  const [detectionAttempts, setDetectionAttempts] = useState(0);
  
  // Reset detection attempts when stream changes
  useEffect(() => {
    if (isStreamActive) {
      setDetectionAttempts(0);
    }
  }, [isStreamActive]);
  
  // Increment attempts when face is not detected for a period
  useEffect(() => {
    let timer: number;
    
    if (isStreamActive && !faceDetected) {
      timer = window.setTimeout(() => {
        setDetectionAttempts(prev => prev + 1);
      }, 3000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isStreamActive, faceDetected]);
  
  const handleRetry = () => {
    setDetectionAttempts(0);
    if (retryFaceDetection) retryFaceDetection();
  };
  
  return (
    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-6">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      {!isStreamActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <CameraOff className="w-16 h-16 text-gray-400" />
        </div>
      )}
      
      {isStreamActive && !faceDetected && (
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">
            {detectionAttempts > 2 
              ? "Face detection struggling. Try better lighting or adjust your position."
              : "No face detected. Please position your face in the frame."}
          </div>
          
          {detectionAttempts > 1 && retryFaceDetection && (
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white/80" 
              onClick={handleRetry}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Face Detection
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoDisplay;
