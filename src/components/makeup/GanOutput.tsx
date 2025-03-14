
import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface GanOutputProps {
  imageUrl?: string;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

const GanOutput: React.FC<GanOutputProps> = ({ 
  imageUrl, 
  isLoading = false,
  error,
  className = ""
}) => {
  return (
    <div className={`relative rounded-lg overflow-hidden bg-gray-100 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-2"></div>
          <p className="text-sm">Generating your look...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 bg-opacity-40 text-white p-4">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-center">{error}</p>
        </div>
      )}
      
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="AI Generated Makeup Look" 
          className="w-full h-full object-cover"
        />
      ) : !isLoading && !error ? (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <Sparkles className="h-10 w-10 text-pink-300 mb-4" />
          <p className="text-gray-500">Your AI-generated makeup look will appear here</p>
        </div>
      ) : null}
    </div>
  );
};

export default GanOutput;
