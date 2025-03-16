
import React, { useState, useEffect } from 'react';
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
}

const GanOutput: React.FC<GanOutputProps> = ({
  imageUrl,
  isLoading,
  error,
  className = '',
  facialAnalysis,
  onRegenerate,
  progressPercentage = 0,
  faceDetected = false
}) => {
  const [loaded, setLoaded] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  // Reset state when a new image is loading
  useEffect(() => {
    if (isLoading) {
      setLoaded(false);
      setFadeIn(false);
      setAnimatedProgress(0);
    }
  }, [isLoading]);
  
  // Animate progress bar for better UX
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
  
  // Trigger fade-in animation once image loads
  useEffect(() => {
    if (loaded && !fadeIn) {
      const timer = setTimeout(() => {
        setFadeIn(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loaded, fadeIn]);
  
  // Use actual progress if provided, otherwise use animated progress
  const displayProgress = progressPercentage > 0 ? progressPercentage : animatedProgress;
  
  const handleImageLoad = () => {
    setLoaded(true);
  };
  
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
      {/* Progress bar overlay */}
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
      
      {/* Image container */}
      {imageUrl && (
        <div 
          className={`w-full h-full transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        >
          <img
            src={imageUrl}
            alt="GAN output"
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
          />
          
          {/* Face detection indicator */}
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
                
                {/* Regenerate button */}
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
          
          {/* Display facial analysis if available */}
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
      
      {/* Empty state */}
      {!imageUrl && !isLoading && (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500">No image generated yet</p>
        </div>
      )}
    </div>
  );
};

export default GanOutput;
