
import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getApiKey } from '@/services/speechService';
import { useToast } from '@/hooks/use-toast';

interface VoiceGuidanceProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  currentInstruction?: string;
  progress?: number; // 0-100
  onGenerateMockData?: () => void;
}

const VoiceGuidance: React.FC<VoiceGuidanceProps> = ({
  enabled,
  onEnabledChange,
  currentInstruction,
  progress = 0,
  onGenerateMockData
}) => {
  const { toast } = useToast();
  
  // Ensure API key is set properly
  useEffect(() => {
    const apiKey = getApiKey();
    
    if (apiKey && !enabled) {
      // If we have an API key but voice is disabled, enable it
      onEnabledChange(true);
      
      toast({
        title: "Voice Guidance Activated",
        description: "Voice guidance is now ready to use.",
      });
    }
  }, [enabled, onEnabledChange, toast]);
  
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
  }, [currentInstruction, enabled]);
  
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
        <div className="w-full">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {onGenerateMockData && (
        <Button
          variant="outline" 
          size="sm"
          onClick={onGenerateMockData}
          className="mt-4 w-full text-purple-600 border-purple-200 hover:bg-purple-100"
        >
          Generate Demo Data
        </Button>
      )}
    </div>
  );
};

export default VoiceGuidance;
