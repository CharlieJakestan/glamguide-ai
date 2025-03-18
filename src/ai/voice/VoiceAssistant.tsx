
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  speakInstruction, 
  initSpeechRecognition, 
  startListening, 
  stopListening, 
  processVoiceCommand 
} from '@/services/speechService';
import { generateDynamicGuidance } from '@/services/voiceGuidanceService';

interface VoiceAssistantProps {
  enabled: boolean;
  onToggle: () => void;
  faceDetected: boolean;
  currentStep: string;
  onExecuteCommand?: (command: string, params: Record<string, string>) => void;
  detectedTools?: Array<{ type: string; confidence: number }>;
  movementData?: { x: number; y: number; magnitude: number };
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  enabled,
  onToggle,
  faceDetected,
  currentStep,
  onExecuteCommand,
  detectedTools = [],
  movementData = { x: 0, y: 0, magnitude: 0 }
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  
  const recognitionActive = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    if (enabled) {
      const onResult = (text: string) => {
        setTranscript(text);
        handleVoiceInput(text);
      };
      
      const onError = (error: any) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
        recognitionActive.current = false;
      };
      
      const success = initSpeechRecognition(onResult, onError);
      if (!success) {
        console.warn('Speech recognition not supported or failed to initialize');
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      stopListening();
    };
  }, [enabled]);
  
  // Handle user voice input
  const handleVoiceInput = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    
    // Add user message to conversation history
    addToConversation('user', text);
    
    // Process the voice command
    const { command, params } = processVoiceCommand(text);
    
    // Execute command if handler is provided
    if (onExecuteCommand) {
      onExecuteCommand(command, params);
    }
    
    // Generate AI response
    let response = '';
    
    try {
      // For now, use the voiceGuidanceService to generate a response
      // Later, this could be connected to a more advanced LLM
      response = await generateDynamicGuidance(
        faceDetected,
        detectedTools.map(tool => tool.type),
        movementData.magnitude,
        currentStep
      );
      
      // Add AI response to conversation history
      addToConversation('assistant', response);
      setAssistantResponse(response);
      
      // Speak the response
      if (enabled) {
        await speakInstruction(response);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      response = "I'm having trouble processing that. Let me try again.";
      addToConversation('assistant', response);
      if (enabled) {
        await speakInstruction(response);
      }
    }
    
    setIsProcessing(false);
    setTranscript('');
    
    // Restart listening after a short delay
    if (isListening) {
      timeoutRef.current = window.setTimeout(() => {
        if (recognitionActive.current) return;
        startListeningForCommands();
      }, 1000);
    }
  };
  
  // Add message to conversation history
  const addToConversation = (role: 'user' | 'assistant', content: string) => {
    setConversationHistory(prev => [...prev, { role, content }]);
  };
  
  // Start listening for voice commands
  const startListeningForCommands = () => {
    if (recognitionActive.current) return;
    
    recognitionActive.current = true;
    setIsListening(true);
    
    const success = startListening();
    if (!success) {
      console.warn('Failed to start listening');
      setIsListening(false);
      recognitionActive.current = false;
    }
  };
  
  // Stop listening for voice commands
  const stopListeningForCommands = () => {
    recognitionActive.current = false;
    setIsListening(false);
    
    stopListening();
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      stopListeningForCommands();
    } else {
      startListeningForCommands();
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant={enabled ? "default" : "outline"} 
            size="sm" 
            onClick={onToggle}
            className={enabled ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            {enabled ? (
              <Volume2 className="h-4 w-4 mr-2" />
            ) : (
              <VolumeX className="h-4 w-4 mr-2" />
            )}
            {enabled ? "Voice Enabled" : "Voice Disabled"}
          </Button>
          
          {enabled && (
            <Button
              variant={isListening ? "destructive" : "outline"}
              size="sm"
              onClick={toggleListening}
              disabled={isProcessing}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 mr-2" />
              ) : (
                <Mic className="h-4 w-4 mr-2" />
              )}
              {isListening ? "Stop Listening" : "Start Listening"}
            </Button>
          )}
        </div>
        
        {isListening && (
          <Badge variant="outline" className="animate-pulse">
            Listening...
          </Badge>
        )}
        
        {isProcessing && (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Processing...
          </Badge>
        )}
      </div>
      
      {/* Transcript display */}
      {transcript && (
        <div className="p-3 bg-gray-100 rounded-md">
          <p className="text-sm text-gray-700">
            <span className="font-medium">You said:</span> {transcript}
          </p>
        </div>
      )}
      
      {/* AI response display */}
      {assistantResponse && (
        <Card className="p-3 bg-purple-50 border-purple-200">
          <p className="text-sm">
            <span className="font-medium text-purple-700">AI:</span> {assistantResponse}
          </p>
        </Card>
      )}
      
      {/* Conversation history */}
      {conversationHistory.length > 0 && (
        <div className="mt-4 border rounded-md p-2 max-h-48 overflow-y-auto">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Conversation History</h4>
          {conversationHistory.slice(-5).map((message, index) => (
            <div key={index} className={`text-xs mb-2 ${message.role === 'user' ? 'text-right' : ''}`}>
              <span className={`inline-block rounded-lg px-3 py-1 ${
                message.role === 'user' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {message.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
