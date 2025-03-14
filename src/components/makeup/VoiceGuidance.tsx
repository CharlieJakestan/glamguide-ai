
import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getApiKey, setApiKey } from '@/services/speechService';
import { useToast } from '@/hooks/use-toast';

interface VoiceGuidanceProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  currentInstruction?: string;
  progress?: number; // 0-100
}

const VoiceGuidance: React.FC<VoiceGuidanceProps> = ({
  enabled,
  onEnabledChange,
  currentInstruction,
  progress = 0
}) => {
  const { toast } = useToast();
  const [apiKey, setStateApiKey] = useState(getApiKey() || "");
  
  // Set up default API key if not already set
  useEffect(() => {
    if (!apiKey) {
      const defaultKey = "sk_0dfcb07ba1e4d72443fcb5385899c03e9106d3d27ddaadc2";
      setApiKey(defaultKey);
      setStateApiKey(defaultKey);
      
      toast({
        title: "Voice Guidance Enabled",
        description: "Using default API key for ElevenLabs voice synthesis.",
      });
    }
  }, [apiKey, toast]);
  
  const speakInstruction = () => {
    if (!currentInstruction || !enabled) return;
    
    const utterance = new SpeechSynthesisUtterance(currentInstruction);
    window.speechSynthesis.speak(utterance);
  };
  
  // Speak instruction when it changes
  useEffect(() => {
    if (currentInstruction && enabled) {
      speakInstruction();
    }
  }, [currentInstruction]);
  
  return (
    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {enabled ? (
            <Volume2 className="text-purple-600 mr-2 h-5 w-5" />
          ) : (
            <VolumeX className="text-gray-400 mr-2 h-5 w-5" />
          )}
          <Label htmlFor="voice-toggle" className={enabled ? "text-purple-700" : "text-gray-500"}>
            Voice Guidance
          </Label>
        </div>
        
        <Switch
          id="voice-toggle"
          checked={enabled}
          onCheckedChange={(checked) => {
            onEnabledChange(checked);
          }}
        />
      </div>
      
      {currentInstruction && (
        <div className="mb-3">
          <p className={`${enabled ? "text-purple-800" : "text-gray-600"}`}>
            {currentInstruction}
          </p>
          
          {enabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={speakInstruction}
              className="mt-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100"
            >
              <Volume2 className="mr-1 h-4 w-4" /> Repeat
            </Button>
          )}
        </div>
      )}
      
      {progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div 
            className="bg-purple-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default VoiceGuidance;
