
import React from 'react';
import { Check, Volume2, Camera, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReadyToUsePanelProps {
  cameraActive: boolean;
  voiceEnabled: boolean;
  onToggleCamera: () => void;
  onVoiceEnabledChange: (enabled: boolean) => void;
  analysisProgress?: number;
  referenceLooks?: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    category: string;
  }[];
  onSelectReferenceLook?: (lookId: string) => void;
}

const ReadyToUsePanel: React.FC<ReadyToUsePanelProps> = ({
  cameraActive,
  voiceEnabled,
  onToggleCamera,
  onVoiceEnabledChange,
  analysisProgress = 0,
  referenceLooks = [],
  onSelectReferenceLook
}) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center mb-4">
        <Check className="h-5 w-5 text-green-500 mr-2" />
        <h3 className="text-lg font-medium text-green-700">Your AI Makeup Assistant is Ready!</h3>
      </div>
      
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5 text-gray-500" />
            <Label htmlFor="voice-toggle" className="text-gray-700">Voice Guidance</Label>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Switch 
                    id="voice-toggle" 
                    checked={voiceEnabled}
                    onCheckedChange={onVoiceEnabledChange}
                  />
                  <Info className="h-4 w-4 text-gray-400 ml-1 cursor-help" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Enables real-time voice instructions for makeup application</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {analysisProgress > 0 && (
          <div className="w-full">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Analysis Progress</span>
              <span>{Math.round(analysisProgress)}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        )}
        
        {referenceLooks.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Reference Looks:</h4>
            <div className="grid grid-cols-2 gap-2">
              {referenceLooks.map(look => (
                <div 
                  key={look.id}
                  className="bg-white rounded border border-gray-200 overflow-hidden cursor-pointer hover:border-pink-300 transition-colors"
                  onClick={() => onSelectReferenceLook && onSelectReferenceLook(look.id)}
                >
                  <div className="h-24 overflow-hidden">
                    <img 
                      src={look.imageUrl} 
                      alt={look.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-700">{look.name}</p>
                    <p className="text-xs text-gray-500">{look.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button
          onClick={onToggleCamera}
          className="bg-pink-500 hover:bg-pink-600 text-white"
        >
          {cameraActive ? (
            <>Stop Camera</>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Start Smart Makeup Guidance
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReadyToUsePanel;
