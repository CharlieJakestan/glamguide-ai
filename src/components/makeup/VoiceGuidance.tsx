
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, RotateCcw, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getApiKey } from '@/services/speechService';
import { useToast } from '@/hooks/use-toast';

interface VoiceGuidanceProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  currentInstruction?: string;
  progress?: number; // 0-100
  onGenerateMockData?: () => void;
  faceDetected?: boolean;
  lastActivity?: string | null;
  currentMakeupStep?: string;
}

const VoiceGuidance: React.FC<VoiceGuidanceProps> = ({
  enabled,
  onEnabledChange,
  currentInstruction,
  progress = 0,
  onGenerateMockData,
  faceDetected = false,
  lastActivity = null,
  currentMakeupStep = ""
}) => {
  const { toast } = useToast();
  const [dynamicInstruction, setDynamicInstruction] = useState<string | undefined>(currentInstruction);
  const [isThinking, setIsThinking] = useState(false);
  const lastActivityRef = useRef<string | null>(null);
  const instructionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Dynamic instruction generation based on face detection and activity
  useEffect(() => {
    if (!enabled) return;
    
    // Only update if we have a new activity or lost face detection
    if ((lastActivity !== lastActivityRef.current) || !faceDetected) {
      setIsThinking(true);
      
      // Clear any existing timeout
      if (instructionTimeoutRef.current) {
        clearTimeout(instructionTimeoutRef.current);
      }
      
      // Generate contextual instruction with small delay to simulate AI thinking
      instructionTimeoutRef.current = setTimeout(() => {
        let newInstruction = currentInstruction;
        
        // If face is not detected, prioritize that message
        if (!faceDetected) {
          newInstruction = "I don't see your face. Please position yourself in the camera view.";
        } 
        // If we detected a makeup tool, give specific guidance
        else if (lastActivity && lastActivity.includes("Detected")) {
          const tool = lastActivity.replace("Detected ", "").toLowerCase();
          
          if (tool.includes("foundation")) {
            newInstruction = "I see you're using foundation. Apply it in circular motions, starting from the center of your face and blending outward.";
          } else if (tool.includes("lipstick")) {
            newInstruction = "I see you're using lipstick. Start by defining your cupid's bow and then fill in your lips. Blot with tissue for a more natural look.";
          } else if (tool.includes("eyeshadow")) {
            newInstruction = "I see you're using eyeshadow. Apply lighter shades to your lid and darker shades to your crease. Don't forget to blend well!";
          } else if (tool.includes("brush")) {
            if (currentMakeupStep.toLowerCase().includes("blush")) {
              newInstruction = "Perfect! I see you've picked up your brush for blush. Smile and apply to the apples of your cheeks, blending upward toward your temples.";
            } else {
              newInstruction = `I see you're using a ${tool}. Make sure to tap off excess product before applying.`;
            }
          } else if (tool.includes("sponge")) {
            newInstruction = "I see you're using a makeup sponge. Dampen it slightly for better foundation application and use dabbing motions for a seamless finish.";
          } else {
            newInstruction = `I notice you're using ${tool}. Take your time and apply with precision.`;
          }
        }
        // If we detected significant head movement
        else if (lastActivity && lastActivity.includes("movement")) {
          newInstruction = "I notice you're moving your head quite a bit. Try to keep still for more precise makeup application.";
        }
        // If we detected direction changes
        else if (lastActivity && lastActivity.includes("Looking")) {
          newInstruction = "I see you're checking different angles. That's good practice to ensure even application.";
        }
        // Default to the current instruction if we have one
        else if (currentInstruction) {
          newInstruction = currentInstruction;
        }
        // Generic fallback
        else {
          newInstruction = "I'm analyzing your face and movements to provide personalized makeup guidance.";
        }
        
        setDynamicInstruction(newInstruction);
        setIsThinking(false);
        lastActivityRef.current = lastActivity;
        
        // Speak the dynamic instruction
        speakInstruction(newInstruction);
      }, 1000);
    }
    
    return () => {
      if (instructionTimeoutRef.current) {
        clearTimeout(instructionTimeoutRef.current);
      }
    };
  }, [enabled, lastActivity, faceDetected, currentInstruction, currentMakeupStep]);
  
  const speakInstruction = (instruction?: string) => {
    if (!instruction || !enabled) return;
    
    const utterance = new SpeechSynthesisUtterance(instruction);
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1.1; // Slightly higher pitch for more pleasant voice
    window.speechSynthesis.speak(utterance);
  };
  
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
            AI Voice Guidance
          </Label>
          {enabled && isThinking && (
            <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-700 animate-pulse">
              AI thinking...
            </Badge>
          )}
        </div>
        
        <Switch
          id="voice-toggle"
          checked={enabled}
          onCheckedChange={(checked) => {
            onEnabledChange(checked);
          }}
        />
      </div>
      
      {dynamicInstruction && (
        <div className="mb-3 relative">
          <div className={`${isThinking ? "opacity-50" : "opacity-100"} transition-opacity duration-300`}>
            <p className={`${enabled ? "text-purple-800" : "text-gray-600"} bg-white p-3 rounded-lg border border-purple-100`}>
              {dynamicInstruction}
            </p>
          </div>
          
          {lastActivity && lastActivity.includes("Detected") && (
            <Alert className="mt-2 bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700 text-sm">
                AI detected: {lastActivity.replace("Detected", "You're using a")}
              </AlertDescription>
            </Alert>
          )}
          
          {enabled && (
            <div className="flex mt-2 space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speakInstruction(dynamicInstruction)}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
              >
                <Volume2 className="mr-1 h-4 w-4" /> Repeat
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (onGenerateMockData) onGenerateMockData();
                }}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
              >
                <RotateCcw className="mr-1 h-4 w-4" /> New Guidance
              </Button>
            </div>
          )}
        </div>
      )}
      
      {progress > 0 && (
        <div className="w-full">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Makeup Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-purple-600 mt-1">
            AI is continuously analyzing your makeup application
          </p>
        </div>
      )}
      
      {!faceDetected && enabled && (
        <Alert className="mt-3 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 text-sm">
            AI can't see your face. Please position yourself in the camera view.
          </AlertDescription>
        </Alert>
      )}
      
      {onGenerateMockData && (
        <Button
          variant="outline" 
          size="sm"
          onClick={onGenerateMockData}
          className="mt-4 w-full text-purple-600 border-purple-200 hover:bg-purple-100"
        >
          Generate Dynamic AI Response
        </Button>
      )}
    </div>
  );
};

export default VoiceGuidance;
