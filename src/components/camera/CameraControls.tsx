
import React from 'react';
import { Camera, CameraOff, Sliders, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraControlsProps {
  isStreamActive: boolean;
  showSettings: boolean;
  modelsLoaded: boolean;
  startCamera: () => void;
  stopCamera: () => void;
  toggleSettings: () => void;
  retryFaceDetection?: () => void;
  isLoadingModels?: boolean;
  reloadModels?: () => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  isStreamActive,
  showSettings,
  modelsLoaded,
  startCamera,
  stopCamera,
  toggleSettings,
  retryFaceDetection,
  isLoadingModels = false,
  reloadModels,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-6">
      {!isStreamActive ? (
        <Button
          onClick={startCamera}
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isLoadingModels || (!modelsLoaded && !reloadModels)}
        >
          {isLoadingModels ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          Start Camera
        </Button>
      ) : (
        <Button
          onClick={stopCamera}
          variant="destructive"
        >
          <CameraOff className="mr-2 h-4 w-4" />
          Stop Camera
        </Button>
      )}
      
      {isStreamActive && (
        <>
          <Button
            variant="outline"
            onClick={toggleSettings}
          >
            <Sliders className="mr-2 h-4 w-4" />
            {showSettings ? 'Hide Adjustments' : 'Show Adjustments'}
          </Button>
          
          {retryFaceDetection && modelsLoaded && (
            <Button
              variant="outline"
              onClick={retryFaceDetection}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Detection
            </Button>
          )}
        </>
      )}
      
      {!modelsLoaded && reloadModels && (
        <Button
          variant="outline"
          onClick={reloadModels}
          disabled={isLoadingModels}
          className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
        >
          {isLoadingModels ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Reload Models
        </Button>
      )}
      
      {isLoadingModels && (
        <div className="w-full mt-2 text-center text-yellow-600 text-sm">
          Face detection models are loading... Please wait...
        </div>
      )}
      
      {!modelsLoaded && !isLoadingModels && (
        <div className="w-full mt-2 text-center text-yellow-600 text-sm">
          Face detection models failed to load. Try reloading or check your internet connection.
        </div>
      )}
    </div>
  );
};

export default CameraControls;
