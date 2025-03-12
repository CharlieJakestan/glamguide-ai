
import React from 'react';
import { Camera, CameraOff, Sliders, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraControlsProps {
  isStreamActive: boolean;
  showSettings: boolean;
  modelsLoaded: boolean;
  startCamera: () => void;
  stopCamera: () => void;
  toggleSettings: () => void;
  retryFaceDetection?: () => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  isStreamActive,
  showSettings,
  modelsLoaded,
  startCamera,
  stopCamera,
  toggleSettings,
  retryFaceDetection,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-6">
      {!isStreamActive ? (
        <Button
          onClick={startCamera}
          className="bg-purple-600 hover:bg-purple-700"
          disabled={!modelsLoaded}
        >
          <Camera className="mr-2 h-4 w-4" />
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
          
          {retryFaceDetection && (
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
      
      {!modelsLoaded && (
        <div className="w-full mt-2 text-center text-yellow-600 text-sm">
          Face detection models are still loading. Please wait...
        </div>
      )}
    </div>
  );
};

export default CameraControls;
