import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { speakInstruction } from '@/services/speechService';
import { autoStartVoiceInteraction, stopListening, isVoiceListening } from '@/services/voiceInteractionService';

interface AIWelcomeVoiceProps {
  onVoiceCommand?: (command: string, params: Record<string, string>) => void;
}

const AIWelcomeVoice: React.FC<AIWelcomeVoiceProps> = ({ onVoiceCommand }) => {
  const [isWelcomePlayed, setIsWelcomePlayed] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const welcomeMessage = "Welcome to SmyraAI! I'm your intelligent makeup assistant. I can help you try on different makeup looks, analyze your facial features, and guide you through makeup application with voice commands. You can browse makeup looks, use our AI generator, or start trying on makeup with your camera. What would you like to do today?";

  useEffect(() => {
    // Don't auto-play on mount to avoid permission issues in external browsers
    // User needs to explicitly interact first
  }, []);

  const playWelcomeMessage = async () => {
    try {
      await speakInstruction(welcomeMessage);
      setIsWelcomePlayed(true);
      
      // Only start voice interaction if user explicitly wants it
      // Don't auto-start to avoid permission issues
    } catch (error) {
      console.error('Error playing welcome message:', error);
      setIsWelcomePlayed(true); // Mark as played even if failed
    }
  };

  const startVoiceInteraction = () => {
    if (onVoiceCommand) {
      try {
        const success = autoStartVoiceInteraction(onVoiceCommand, '');
        if (success) {
          setIsListening(true);
        } else {
          console.warn('Failed to start voice interaction - may need user permission');
          setIsListening(false);
        }
      } catch (error) {
        console.error('Error starting voice interaction:', error);
        setIsListening(false);
      }
    }
  };

  const stopVoiceInteraction = () => {
    const success = stopListening();
    if (success) {
      setIsListening(false);
    }
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (isVoiceEnabled && isListening) {
      stopVoiceInteraction();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopVoiceInteraction();
    } else {
      startVoiceInteraction();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* Voice Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-purple-200">
        <div className="flex items-center gap-2">
          <Button
            variant={isVoiceEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleVoice}
            className="flex items-center gap-1"
          >
            {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {isVoiceEnabled ? 'Voice On' : 'Voice Off'}
          </Button>
          
          {isVoiceEnabled && (
            <Button
              variant={isListening ? "destructive" : "outline"}
              size="sm"
              onClick={toggleListening}
              className="flex items-center gap-1"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? 'Stop' : 'Listen'}
            </Button>
          )}
        </div>
        
        {isListening && (
          <div className="mt-2 text-xs text-gray-600 text-center">
            🎤 Listening for voice commands...
          </div>
        )}
      </div>

      {/* Welcome Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={playWelcomeMessage}
        className="bg-white/90 backdrop-blur-sm border-purple-200"
        disabled={!isVoiceEnabled}
      >
        {isWelcomePlayed ? '🔊 Replay Welcome' : '🎤 Start AI Assistant'}
      </Button>
    </div>
  );
};

export default AIWelcomeVoice;