
import React, { useState } from 'react';
import { Camera, CameraOff, Sliders, RefreshCw, Loader2, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  permissionDenied?: boolean;
  deviceNotFound?: boolean;
  checkDevices?: () => Promise<boolean>;
  availableDevices?: MediaDeviceInfo[];
  selectedDeviceId?: string | null;
  selectCamera?: (deviceId: string) => void;
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
  permissionDenied = false,
  deviceNotFound = false,
  checkDevices,
  availableDevices = [],
  selectedDeviceId,
  selectCamera
}) => {
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [attemptingRecovery, setAttemptingRecovery] = useState(false);

  const handleStartCamera = async () => {
    setAttemptingRecovery(true);
    
    if (checkDevices) {
      const hasDevices = await checkDevices();
      if (!hasDevices) {
        setTimeout(() => {
          // Double-check devices again after a delay
          checkDevices().then(foundDevices => {
            if (foundDevices) {
              startCamera();
            }
            setAttemptingRecovery(false);
          });
        }, 1000);
        return;
      }
    }
    
    startCamera();
    setAttemptingRecovery(false);
  };

  const handleDeviceChange = (deviceId: string) => {
    if (selectCamera) {
      selectCamera(deviceId);
    }
  };

  const handleRetryDeviceDetection = async () => {
    setAttemptingRecovery(true);
    
    if (checkDevices) {
      const result = await checkDevices();
      if (result && availableDevices.length > 0) {
        startCamera();
      }
    }
    
    setAttemptingRecovery(false);
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-wrap justify-center gap-4">
        {!isStreamActive ? (
          <Button
            onClick={handleStartCamera}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={isLoadingModels || attemptingRecovery || (!modelsLoaded && !reloadModels)}
          >
            {isLoadingModels || attemptingRecovery ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {attemptingRecovery ? "Checking Camera..." : "Start Camera"}
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
            
            {availableDevices && availableDevices.length > 1 && (
              <Button
                variant="outline"
                onClick={() => setShowDeviceSelector(!showDeviceSelector)}
              >
                <Settings className="mr-2 h-4 w-4" />
                {showDeviceSelector ? 'Hide Camera Options' : 'Camera Options'}
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
        
        {deviceNotFound && !isStreamActive && (
          <Button
            variant="outline"
            onClick={handleRetryDeviceDetection}
            disabled={attemptingRecovery}
            className="border-orange-500 text-orange-700 hover:bg-orange-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {attemptingRecovery ? "Searching..." : "Retry Camera Detection"}
          </Button>
        )}
      </div>
      
      {showDeviceSelector && availableDevices && availableDevices.length > 0 && (
        <div className="w-full max-w-md mx-auto mt-2">
          <Select
            value={selectedDeviceId || undefined}
            onValueChange={handleDeviceChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {availableDevices.map(device => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.substring(0, 5)}...`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {permissionDenied && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Camera Permission Denied</AlertTitle>
          <AlertDescription>
            <p>You've blocked camera access in your browser settings. To fix this:</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Click the camera/lock icon in your browser's address bar</li>
              <li>Select "Allow" for camera access</li>
              <li>Refresh the page and try again</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}
      
      {deviceNotFound && (
        <Alert variant="destructive" className="mt-2 border-yellow-500 text-yellow-800 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-800" />
          <AlertTitle>Camera Not Detected</AlertTitle>
          <AlertDescription>
            <p>Your browser couldn't find a camera device. Please check:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Is your camera connected properly?</li>
              <li>Is another application using your camera? (Try closing other apps)</li>
              <li>Try unplugging and reconnecting your camera</li>
              <li>If using a laptop with built-in camera, try restarting your device</li>
              <li>Check if camera drivers are installed correctly</li>
              <li>If using a virtual camera, make sure it's activated</li>
            </ul>
            <div className="mt-2">
              <strong>Browser Troubleshooting:</strong>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Check browser settings to ensure camera access is allowed</li>
                <li>Try using a different browser (Chrome, Firefox, Edge)</li>
                <li>Clear browser cache and cookies, then reload</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
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
