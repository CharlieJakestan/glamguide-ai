
import React, { RefObject, useEffect, useState } from 'react';
import { CameraOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoDisplayProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isStreamActive: boolean;
  faceDetected: boolean;
  retryFaceDetection?: () => void;
  guidanceHighlight?: {
    x: number;
    y: number;
    radius: number;
  }
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({
  videoRef,
  canvasRef,
  isStreamActive,
  faceDetected,
  retryFaceDetection,
  guidanceHighlight
}) => {
  const [detectionAttempts, setDetectionAttempts] = useState(0);
  const [highlightCanvas, setHighlightCanvas] = useState<HTMLCanvasElement | null>(null);
  
  // Create highlight canvas
  useEffect(() => {
    if (!highlightCanvas) {
      const canvas = document.createElement('canvas');
      canvas.className = 'absolute inset-0 w-full h-full pointer-events-none';
      setHighlightCanvas(canvas);
    }
  }, [highlightCanvas]);
  
  // Append highlight canvas to DOM
  useEffect(() => {
    if (highlightCanvas && videoRef.current && videoRef.current.parentElement) {
      videoRef.current.parentElement.appendChild(highlightCanvas);
      
      return () => {
        if (highlightCanvas.parentElement) {
          highlightCanvas.parentElement.removeChild(highlightCanvas);
        }
      };
    }
  }, [highlightCanvas, videoRef]);
  
  // Draw guidance highlight
  useEffect(() => {
    if (!highlightCanvas || !guidanceHighlight || !isStreamActive || !videoRef.current) return;
    
    // Match canvas dimensions to video
    highlightCanvas.width = videoRef.current.videoWidth || 640;
    highlightCanvas.height = videoRef.current.videoHeight || 480;
    
    const ctx = highlightCanvas.getContext('2d');
    if (!ctx) return;
    
    // Clear previous highlights
    ctx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    
    // Calculate position based on percentages
    const x = (guidanceHighlight.x / 100) * highlightCanvas.width;
    const y = (guidanceHighlight.y / 100) * highlightCanvas.height;
    const radius = guidanceHighlight.radius;
    
    // Draw highlight circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw pulsing effect
    ctx.beginPath();
    ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(155, 135, 245, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add pulse animation
    let pulseSize = 0;
    let growing = true;
    
    const animatePulse = () => {
      if (!ctx || !isStreamActive) return;
      
      ctx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
      
      // Inner highlight
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Pulsing outer circle
      ctx.beginPath();
      ctx.arc(x, y, radius + pulseSize, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(155, 135, 245, ' + (0.5 - pulseSize/20) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Update pulse size
      if (growing) {
        pulseSize += 0.5;
        if (pulseSize >= 10) growing = false;
      } else {
        pulseSize -= 0.5;
        if (pulseSize <= 0) growing = true;
      }
      
      requestAnimationFrame(animatePulse);
    };
    
    const animationId = requestAnimationFrame(animatePulse);
    
    return () => {
      cancelAnimationFrame(animationId);
      if (ctx) ctx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    };
  }, [highlightCanvas, guidanceHighlight, isStreamActive, videoRef]);
  
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
