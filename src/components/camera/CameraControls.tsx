
import React from 'react';
import { Camera, CameraOff, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraControlsProps {
  isStreamActive: boolean;
  showSettings: boolean;
  startCamera: () => void;
  stopCamera: () => void;
  toggleSettings: () => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  isStreamActive,
  showSettings,
  startCamera,
  stopCamera,
  toggleSettings,
}) => {
  return (
    <div className="flex justify-center gap-4 mb-6">
      {!isStreamActive ? (
        <Button
          onClick={startCamera}
          className="bg-purple-600 hover:bg-purple-700"
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
        <Button
          variant="outline"
          onClick={toggleSettings}
        >
          <Sliders className="mr-2 h-4 w-4" />
          {showSettings ? 'Hide Adjustments' : 'Show Adjustments'}
        </Button>
      )}
    </div>
  );
};

export default CameraControls;
