
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, RotateCcw, AlertCircle, Activity, Camera } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getApiKey } from '@/services/speechService';
import { useToast } from '@/hooks/use-toast';
import { DetectedObject } from '@/hooks/useMakeupObjectDetection';

interface VoiceGuidanceProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  currentInstruction?: string;
  progress?: number; // 0-100
  onGenerateMockData?: () => void;
  faceDetected?: boolean;
  lastActivity?: string | null;
  currentMakeupStep?: string;
  detectedObjects?: DetectedObject[];
  movementData?: { x: number; y: number; magnitude: number };
  detectedMakeupTools?: Array<{type: string, confidence: number}>;
}

const VoiceGuidance: React.FC<VoiceGuidanceProps> = ({
  enabled,
  onEnabledChange,
  currentInstruction,
  progress = 0,
  onGenerateMockData,
  faceDetected = false,
  lastActivity = null,
  currentMakeupStep = "",
  detectedObjects = [],
  movementData = { x: 0, y: 0, magnitude: 0 },
  detectedMakeupTools = []
}) => {
  const { toast } = useToast();
  const [dynamicInstruction, setDynamicInstruction] = useState<string | undefined>(currentInstruction);
  const [isThinking, setIsThinking] = useState(false);
  const [spokenPhrases, setSpokenPhrases] = useState<Set<string>>(new Set());
  const lastActivityRef = useRef<string | null>(null);
  const instructionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speakQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);
  const lastInstructionTimeRef = useRef<number>(Date.now());
  const moveDetectionTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Check if we've been still for too long
  useEffect(() => {
    if (!enabled || !faceDetected) return;
    
    // Clear any existing timeout
    if (moveDetectionTimeout.current) {
      clearTimeout(moveDetectionTimeout.current);
    }
    
    if (movementData.magnitude < 1) {
      // If we're very still, set a timeout to check in after a while
      moveDetectionTimeout.current = setTimeout(() => {
        const timeSinceLastInstruction = Date.now() - lastInstructionTimeRef.current;
        
        // If it's been more than 15 seconds since the last instruction
        if (timeSinceLastInstruction > 15000) {
          const checkInPhrase = "I notice you've been still for a while. Do you need help with the next step?";
          
          // Only say this if we haven't said it recently
          if (!spokenPhrases.has(checkInPhrase)) {
            queueSpeech(checkInPhrase);
            setSpokenPhrases(prev => new Set(prev).add(checkInPhrase));
            
            // Reset after 30 seconds so we can say it again if needed
            setTimeout(() => {
              setSpokenPhrases(prev => {
                const updated = new Set(prev);
                updated.delete(checkInPhrase);
                return updated;
              });
            }, 30000);
          }
        }
      }, 10000); // Check after 10 seconds of stillness
    }
    
    return () => {
      if (moveDetectionTimeout.current) {
        clearTimeout(moveDetectionTimeout.current);
      }
    };
  }, [enabled, faceDetected, movementData, spokenPhrases]);
  
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
  
  // Manage speech queue to avoid interruptions
  const queueSpeech = (text: string) => {
    speakQueueRef.current.push(text);
    processQueue();
  };
  
  const processQueue = () => {
    if (isSpeakingRef.current || speakQueueRef.current.length === 0) return;
    
    const nextText = speakQueueRef.current.shift();
    if (nextText) {
      isSpeakingRef.current = true;
      lastInstructionTimeRef.current = Date.now();
      
      const utterance = new SpeechSynthesisUtterance(nextText);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      
      utterance.onend = () => {
        isSpeakingRef.current = false;
        setTimeout(() => processQueue(), 300); // Small pause between phrases
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Dynamic instruction generation based on face detection and activity
  useEffect(() => {
    if (!enabled) return;
    
    // Factors that trigger new instructions:
    // 1. New activity detected
    // 2. Face detection status changed
    // 3. New makeup objects detected
    const shouldUpdateInstruction = 
      lastActivity !== lastActivityRef.current || 
      detectedObjects.length > 0 || 
      detectedMakeupTools.length > 0;
    
    if (shouldUpdateInstruction) {
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
          newInstruction = "I don't see your face clearly. Please position yourself in the camera view.";
        } 
        // If we detected a makeup tool through object detection
        else if (detectedObjects.length > 0) {
          const object = detectedObjects[0];
          const tool = object.type.toLowerCase();
          
          if (tool.includes("foundation")) {
            newInstruction = "I see you're using foundation. Apply it in circular motions, starting from the center of your face and blending outward.";
          } else if (tool.includes("lipstick")) {
            newInstruction = "I notice you're applying lipstick. Start by defining your cupid's bow and then fill in your lips. Blot with tissue for a more natural look.";
          } else if (tool.includes("eyeshadow")) {
            newInstruction = "I see you're working with eyeshadow. Apply lighter shades to your lid and darker shades to your crease. Don't forget to blend thoroughly!";
          } else if (tool.includes("brush")) {
            if (currentMakeupStep.toLowerCase().includes("blush")) {
              newInstruction = "Perfect! I can see you're using your brush for blush. Smile and apply to the apples of your cheeks, blending upward toward your temples.";
            } else {
              newInstruction = `I see you're using a ${tool}. Make sure to tap off excess product before applying to avoid fallout.`;
            }
          } else if (tool.includes("sponge")) {
            newInstruction = "I notice you're using a makeup sponge. Make sure it's slightly damp for better foundation application, and use dabbing motions for a seamless finish.";
          } else if (tool.includes("mascara")) {
            newInstruction = "I see you're applying mascara. Wiggle the wand from the base of your lashes to the tips for maximum volume.";
          } else if (tool.includes("eyeliner")) {
            newInstruction = "I notice you're using eyeliner. For more control, try resting your elbow on a flat surface and drawing small, connected strokes.";
          } else {
            newInstruction = `I see you're using ${tool}. Take your time and apply with precision for the best results.`;
          }
        }
        // If we detected makeup tools through the specialized hook
        else if (detectedMakeupTools.length > 0) {
          const mostConfidentTool = detectedMakeupTools.sort((a, b) => b.confidence - a.confidence)[0];
          const tool = mostConfidentTool.type.toLowerCase();
          
          if (tool.includes("foundation")) {
            newInstruction = "I see you've picked up your foundation. For the most natural look, start with a small amount and build coverage as needed.";
          } else if (tool.includes("lipstick")) {
            newInstruction = "I notice you're ready to apply lipstick. For precision, consider using a lip liner first to define your lip shape.";
          } else if (tool.includes("eyeshadow")) {
            newInstruction = "I see you're about to apply eyeshadow. Remember to use a primer first for longer-lasting color and less creasing.";
          } else {
            newInstruction = `I notice you're using ${tool}. Let me know if you need specific guidance on application techniques.`;
          }
        }
        // If we detected significant head movement
        else if (lastActivity && lastActivity.includes("movement")) {
          newInstruction = "I notice you're moving quite a bit. Try to keep still for more precise makeup application.";
        }
        // If we detected direction changes
        else if (lastActivity && lastActivity.includes("Looking")) {
          newInstruction = "I see you're checking different angles. That's good practice to ensure even application.";
        }
        // Default to the current instruction if we have one
        else if (currentInstruction) {
          newInstruction = currentInstruction;
        }
        // Generic fallback that asks for engagement
        else {
          newInstruction = "I'm analyzing your movements and makeup application. What would you like me to help you with next?";
        }
        
        setDynamicInstruction(newInstruction);
        setIsThinking(false);
        lastActivityRef.current = lastActivity;
        
        // Only speak instructions that we haven't said recently
        if (!spokenPhrases.has(newInstruction)) {
          queueSpeech(newInstruction);
          
          // Add to spoken phrases
          setSpokenPhrases(prev => new Set(prev).add(newInstruction));
          
          // Remove from spoken phrases after 30 seconds so we can say it again if needed
          setTimeout(() => {
            setSpokenPhrases(prev => {
              const updated = new Set(prev);
              updated.delete(newInstruction);
              return updated;
            });
          }, 30000);
        }
      }, 1000);
    }
    
    return () => {
      if (instructionTimeoutRef.current) {
        clearTimeout(instructionTimeoutRef.current);
      }
    };
  }, [enabled, lastActivity, faceDetected, currentInstruction, currentMakeupStep, detectedObjects, detectedMakeupTools, spokenPhrases]);
  
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
          
          {/* Activity feedback */}
          {lastActivity && (
            <Alert className="mt-2 bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700 text-sm">
                {lastActivity.includes("Detected") 
                  ? `AI detected: ${lastActivity.replace("Detected", "You're using a")}`
                  : `AI noticed: ${lastActivity}`
                }
              </AlertDescription>
            </Alert>
          )}
          
          {/* Real-time movement feedback */}
          {movementData && movementData.magnitude > 3 && (
            <div className="mt-2 bg-blue-50 p-2 rounded border border-blue-100">
              <div className="flex items-center text-sm text-blue-700">
                <Activity className="h-4 w-4 mr-1" />
                <span>Movement detected: {
                  movementData.magnitude > 8 
                    ? "Significant movement" 
                    : Math.abs(movementData.x) > Math.abs(movementData.y)
                      ? `Looking ${movementData.x > 0 ? 'right' : 'left'}`
                      : `Looking ${movementData.y > 0 ? 'down' : 'up'}`
                }</span>
              </div>
              <Progress 
                value={Math.min(movementData.magnitude * 10, 100)} 
                className="h-1.5 mt-1"
              />
            </div>
          )}
          
          {/* Detected makeup tools */}
          {detectedMakeupTools.length > 0 && (
            <div className="mt-2 bg-green-50 p-2 rounded border border-green-100">
              <div className="flex items-center text-sm text-green-700 mb-1">
                <Camera className="h-4 w-4 mr-1" />
                <span>Detected makeup tools:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {detectedMakeupTools.map((tool, idx) => (
                  <Badge key={idx} variant="outline" className="bg-green-100 text-green-700">
                    {tool.type} ({Math.round(tool.confidence * 100)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {enabled && (
            <div className="flex mt-2 space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => queueSpeech(dynamicInstruction)}
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
            AI can't see your face clearly. Please position yourself in the camera view.
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
