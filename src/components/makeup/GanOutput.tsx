import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, Check, Info, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface GanOutputProps {
  imageUrl: string | null;
  isLoading: boolean;
  error?: string;
  className?: string;
  facialAnalysis?: {
    skinTone?: string;
    faceShape?: string;
    features?: string[];
  };
  onRegenerate?: () => void;
  progressPercentage?: number;
  faceDetected?: boolean;
  facePosition?: { x: number; y: number; width: number; height: number } | null;
  enableARPreview?: boolean;
}

const GanOutput: React.FC<GanOutputProps> = ({
  imageUrl,
  isLoading,
  error,
  className = '',
  facialAnalysis,
  onRegenerate,
  progressPercentage = 0,
  faceDetected = false,
  facePosition = null,
  enableARPreview = false
}) => {
  const [loaded, setLoaded] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [arPreviewActive, setArPreviewActive] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setLoaded(false);
      setFadeIn(false);
      setAnimatedProgress(0);
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading && animatedProgress < 95) {
      const timer = setTimeout(() => {
        setAnimatedProgress(prev => Math.min(prev + 5, 95));
      }, 200);
      return () => clearTimeout(timer);
    } else if (!isLoading && animatedProgress < 100) {
      setAnimatedProgress(100);
    }
  }, [isLoading, animatedProgress]);

  useEffect(() => {
    if (loaded && !fadeIn) {
      const timer = setTimeout(() => {
        setFadeIn(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loaded, fadeIn]);

  const handleImageLoad = () => {
    setLoaded(true);
  };

  useEffect(() => {
    if (enableARPreview && loaded && faceDetected && imageUrl) {
      setArPreviewActive(true);
    } else {
      setArPreviewActive(false);
    }
  }, [enableARPreview, loaded, faceDetected, imageUrl]);

  const displayProgress = progressPercentage > 0 ? progressPercentage : animatedProgress;

  useEffect(() => {
    if (loaded && faceDetected && facePosition && canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / 100;
      const scaleY = canvas.height / 100;

      const x = facePosition.x * scaleX;
      const y = facePosition.y * scaleY;
      const width = facePosition.width * scaleX;
      const height = facePosition.height * scaleY;
      
      const pulseAmount = 0.05;
      const pulseSpeed = 0.003;
      const pulseScale = 1 + Math.sin(Date.now() * pulseSpeed) * pulseAmount;
      
      ctx.beginPath();
      ctx.ellipse(
        x + width/2, 
        y + height/2,
        (width/2) * pulseScale,
        (height/2) * pulseScale,
        0, 0, 2 * Math.PI
      );
      ctx.strokeStyle = 'rgba(120, 90, 220, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      const centerX = x + width/2;
      const centerY = y + height/2;
      const crosshairSize = width * 0.1;
      
      ctx.beginPath();
      ctx.moveTo(centerX - crosshairSize, centerY);
      ctx.lineTo(centerX + crosshairSize, centerY);
      ctx.moveTo(centerX, centerY - crosshairSize);
      ctx.lineTo(centerX, centerY + crosshairSize);
      ctx.strokeStyle = 'rgba(120, 90, 220, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [loaded, faceDetected, facePosition]);

  if (error) {
    return (
      <div className={`bg-red-50 rounded-lg p-4 border border-red-200 ${className}`}>
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">Analysis Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            
            {onRegenerate && (
              <button 
                onClick={onRegenerate} 
                className="mt-3 text-xs bg-white text-red-600 hover:bg-red-50 rounded px-3 py-1 border border-red-200 flex items-center"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {(isLoading || !loaded) && (
        <div className="absolute inset-0 bg-gray-200/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <Loader2 className="h-8 w-8 text-purple-600 animate-spin mb-2" />
          <p className="text-sm text-purple-700 font-medium">
            {isLoading ? 'Analyzing your face...' : 'Loading results...'}
          </p>
          <div className="w-3/4 mt-3">
            <Progress value={displayProgress} className="h-2" />
            <p className="text-xs text-gray-600 text-center mt-1">
              {Math.round(displayProgress)}%
            </p>
          </div>
        </div>
      )}
      
      {imageUrl && (
        <div 
          className={`w-full h-full transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="GAN output"
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
          />
          
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          
          {arPreviewActive && (
            <div className="absolute top-2 left-2 bg-purple-600/80 backdrop-blur-sm text-white text-xs rounded-full px-3 py-1 flex items-center">
              <span className="animate-pulse mr-1">●</span>
              AR Preview Active
            </div>
          )}
          
          {!isLoading && loaded && (
            <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm text-white text-xs rounded px-2 py-1 flex items-center justify-between">
                <div className="flex items-center">
                  {faceDetected ? (
                    <Check className="h-3 w-3 text-green-400 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-yellow-400 mr-1" />
                  )}
                  <span>Face {faceDetected ? 'detected' : 'not detected'}</span>
                </div>
                
                {onRegenerate && (
                  <button 
                    onClick={onRegenerate}
                    className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1 ml-2 pointer-events-auto"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {facialAnalysis && loaded && !isLoading && (
            <div className="absolute top-2 right-2 left-2 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm rounded p-2 flex flex-wrap gap-1">
                {facialAnalysis.skinTone && (
                  <Badge className="bg-purple-500/80 text-white">
                    {facialAnalysis.skinTone}
                  </Badge>
                )}
                {facialAnalysis.faceShape && (
                  <Badge className="bg-pink-500/80 text-white">
                    {facialAnalysis.faceShape}
                  </Badge>
                )}
                {facialAnalysis.features && facialAnalysis.features.slice(0, 2).map((feature, idx) => (
                  <Badge key={idx} className="bg-indigo-500/80 text-white">
                    {feature}
                  </Badge>
                ))}
                {(facialAnalysis.features?.length || 0) > 2 && (
                  <Badge className="bg-blue-500/80 text-white flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    {(facialAnalysis.features?.length || 0) - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {!imageUrl && !isLoading && (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500">No image generated yet</p>
        </div>
      )}
    </div>
  );
};

export default GanOutput;
