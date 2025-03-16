
import React from 'react';
import { Sparkles, AlertCircle, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GanOutputProps {
  imageUrl?: string;
  isLoading?: boolean;
  error?: string;
  className?: string;
  onShare?: () => void;
  onDownload?: () => void;
}

const GanOutput: React.FC<GanOutputProps> = ({ 
  imageUrl, 
  isLoading = false,
  error,
  className = "",
  onShare,
  onDownload
}) => {
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
  };
  
  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-100 shadow-md border border-gray-200 group p-0 m-0">
      {/* Main content area with image or placeholder */}
      <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-2"></div>
            <p className="text-sm">Generating your look...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 bg-opacity-40 text-white p-4 z-20">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-center">{error}</p>
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
            <Sparkles className="h-10 w-10 text-pink-300 mb-4" />
            <p className="text-gray-500">Your AI-generated makeup look will appear here</p>
          </div>
        ) : null}
      </div>
      
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
                  <Download className="h-4 w-4 mr-1" />
                  Save
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
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
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
    </div>
  );
};

export default GanOutput;
