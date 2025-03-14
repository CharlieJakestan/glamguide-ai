
import React from 'react';
import { Check, Volume2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ReadyToUsePanelProps {
  cameraActive: boolean;
  voiceEnabled: boolean;
  onToggleCamera: () => void;
  onVoiceEnabledChange: (enabled: boolean) => void;
}

const ReadyToUsePanel: React.FC<ReadyToUsePanelProps> = ({
  cameraActive,
  voiceEnabled,
  onToggleCamera,
  onVoiceEnabledChange
}) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center mb-4">
        <Check className="h-5 w-5 text-green-500 mr-2" />
        <h3 className="text-lg font-medium text-green-700">Your GAN is Ready to Use!</h3>
      </div>
      
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5 text-gray-500" />
            <Label htmlFor="voice-toggle" className="text-gray-700">Voice Guidance</Label>
          </div>
          <Switch 
            id="voice-toggle" 
            checked={voiceEnabled}
            onCheckedChange={onVoiceEnabledChange}
          />
        </div>
        
        <Button
          onClick={onToggleCamera}
          className="bg-pink-500 hover:bg-pink-600 text-white"
        >
          {cameraActive ? (
            <>Stop Camera</>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Start Camera for Makeup Guidance
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReadyToUsePanel;
