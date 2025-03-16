
import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, Download, Share2, Loader2, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GanOutputProps {
  imageUrl?: string;
  isLoading?: boolean;
  error?: string;
  className?: string;
  onShare?: () => void;
  onDownload?: () => void;
  detectedFacialTraits?: {
    skinTone: string;
    faceShape: string;
  } | null;
}

const GanOutput: React.FC<GanOutputProps> = ({ 
  imageUrl, 
  isLoading = false,
  error,
  className = "",
  onShare,
  onDownload,
  detectedFacialTraits
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  
  useEffect(() => {
    // Generate AI insights based on facial traits
    if (detectedFacialTraits && imageUrl) {
      let insight = "";
      
      switch (detectedFacialTraits.skinTone.toLowerCase()) {
        case 'fair':
        case 'light':
          insight = "The AI has enhanced your light skin tone with soft, neutral colors that complement your complexion.";
          break;
        case 'medium':
        case 'olive':
          insight = "The AI has adapted warm tones to enhance your medium/olive skin tone, bringing out your natural warmth.";
          break;
        case 'tan':
        case 'deep':
          insight = "The AI has selected rich, vibrant colors that beautifully complement your deeper skin tone.";
          break;
        default:
          insight = "The AI has customized this look based on your unique skin tone and facial features.";
      }
      
      // Add face shape insights
      if (detectedFacialTraits.faceShape) {
        switch (detectedFacialTraits.faceShape.toLowerCase()) {
          case 'oval':
            insight += " Your oval face shape works with virtually any makeup style.";
            break;
          case 'round':
            insight += " The AI has added contour to enhance your round face shape.";
            break;
          case 'square':
            insight += " The AI has softened angles to complement your square face shape.";
            break;
          case 'heart':
            insight += " The AI has balanced your heart-shaped face with appropriate highlighting.";
            break;
          default:
            insight += " The look is tailored to your unique face shape.";
        }
      }
      
      setAiInsights(insight);
    }
  }, [detectedFacialTraits, imageUrl]);

  const handleDownload = () => {
    if (!imageUrl) return;
    
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'makeup-look.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Show success indicator
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };
  
  const handleShare = () => {
    if (!imageUrl) return;
    
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      // Web Share API if available
      navigator.share({
        title: 'My AI Makeup Look',
        text: 'Check out this makeup look created just for me with AI!',
        url: imageUrl
      }).catch(err => console.error('Error sharing:', err));
    }
    
    // Show success indicator
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };
  
  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-100 shadow-md border border-gray-200 group p-0 m-0">
      {/* Main content area with image or placeholder */}
      <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-2"></div>
            <p className="text-sm">Generating your personalized look...</p>
            <p className="text-xs mt-2 max-w-xs text-center text-gray-300">
              AI is analyzing your facial features and creating a custom makeup look
            </p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 bg-opacity-40 text-white p-4 z-20">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-center">{error}</p>
            <Button 
              variant="outline"
              size="sm"
              className="mt-4 bg-white/20 text-white hover:bg-white/30 border-white/30"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}
        
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt="AI Generated Makeup Look" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        ) : !isLoading && !error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Sparkles className="h-10 w-10 text-pink-300 mb-4 animate-pulse" />
            <p className="text-gray-500">Your AI-generated makeup look will appear here</p>
            <p className="text-xs text-gray-400 mt-2">
              The AI will analyze your face and create a personalized makeup look
            </p>
          </div>
        ) : null}
      </div>
      
      {/* AI insights panel */}
      {imageUrl && aiInsights && !error && !isLoading && (
        <div className="px-4 py-3 bg-indigo-50 border-t border-indigo-100">
          <div className="flex items-start">
            <Info className="h-4 w-4 text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-indigo-700">{aiInsights}</p>
          </div>
        </div>
      )}
      
      {/* Overlay actions on hover */}
      {imageUrl && !error && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/90 hover:bg-white text-gray-800 border-none"
                  onClick={handleDownload}
                >
                  {downloadSuccess ? (
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  {downloadSuccess ? "Saved" : "Save"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download this look</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {navigator.share && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/90 hover:bg-white text-gray-800 border-none"
                    onClick={handleShare}
                  >
                    {shareSuccess ? (
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-1" />
                    )}
                    {shareSuccess ? "Shared" : "Share"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share this look</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      
      {/* AI generated badge */}
      {imageUrl && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Generated
        </div>
      )}
      
      {/* Processing indicator */}
      {imageUrl && !error && !isLoading && (
        <div className="absolute top-2 left-2 bg-green-700/80 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <Check className="h-3 w-3 mr-1" />
          Personalized
        </div>
      )}
    </div>
  );
};

export default GanOutput;
