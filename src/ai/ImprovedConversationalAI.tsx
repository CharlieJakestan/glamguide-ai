
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Mic, MicOff, Volume2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { speakInstruction } from '@/services/speechService';
import { generateContextualResponse } from '@/services/enhancedSpeechService';

interface ImprovedConversationalAIProps {
  facialTraits?: {
    skinTone?: string;
    faceShape?: string;
    features?: string[];
  };
  currentStep?: string;
  faceDetected: boolean;
  detectedTools?: Array<{ type: string; confidence: number }>;
  movementData?: { x: number; y: number; magnitude: number };
  onExecuteCommand?: (command: string, params: Record<string, string>) => void;
}

const ImprovedConversationalAI: React.FC<ImprovedConversationalAIProps> = ({
  facialTraits,
  currentStep = '',
  faceDetected,
  detectedTools = [],
  movementData = { x: 0, y: 0, magnitude: 0 },
  onExecuteCommand
}) => {
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([
    { role: 'ai', content: 'Hi there! I\'m your makeup assistant. How can I help you today?' }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const personalityTypes = ['helpful', 'friendly', 'expert', 'coach', 'cheerleader'];
  const [personality, setPersonality] = useState('friendly');
  
  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setUserInput(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event);
        setIsListening(false);
      };
      
      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }, []);
  
  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);
  
  // Toggle listening
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  
  // Handle sending messages
  const sendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Add user message to conversation
    const userMessage = userInput.trim();
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);
    setUserInput('');
    setIsThinking(true);
    
    // Extract detected tool types
    const toolTypes = detectedTools.map(tool => tool.type);
    
    try {
      // Generate AI response
      const response = await generateContextualResponse(
        userMessage,
        facialTraits,
        toolTypes,
        currentStep,
        faceDetected
      );
      
      // Add AI response to conversation
      setConversation(prev => [...prev, { role: 'ai', content: response }]);
      
      // Check for commands to execute
      const commandPatterns = [
        { regex: /next( step)?/i, command: 'next' },
        { regex: /previous( step)?/i, command: 'previous' },
        { regex: /analyze( face)?/i, command: 'analyze' },
        { regex: /look( for)? (\w+)/i, command: 'selectLook', paramName: 'lookName' }
      ];
      
      for (const pattern of commandPatterns) {
        const match = userMessage.match(pattern.regex);
        if (match) {
          const params: Record<string, string> = {};
          if (pattern.paramName && match[2]) {
            params[pattern.paramName] = match[2];
          }
          
          if (onExecuteCommand) {
            onExecuteCommand(pattern.command, params);
          }
          break;
        }
      }
      
      // Speak the response
      setIsSpeaking(true);
      await speakInstruction(response);
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error generating response', error);
      setConversation(prev => [...prev, { 
        role: 'ai', 
        content: 'Sorry, I had trouble processing that. Could you try again?' 
      }]);
    } finally {
      setIsThinking(false);
    }
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  return (
    <Card className="flex flex-col h-full bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
      <div className="p-3 bg-purple-100 flex justify-between items-center rounded-t-lg">
        <div className="flex items-center">
          <Brain className="h-5 w-5 text-purple-700 mr-2" />
          <h3 className="font-medium text-purple-800">Makeup AI Assistant</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            className="text-xs bg-white border border-purple-200 rounded px-2 py-1"
          >
            {personalityTypes.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="p-1 h-auto" 
            onClick={toggleListening}
          >
            {isListening ? (
              <MicOff className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4 text-purple-600" />
            )}
          </Button>
          
          {isSpeaking && (
            <Badge variant="outline" className="bg-purple-100 animate-pulse">
              <Volume2 className="h-3 w-3 mr-1" />
              Speaking
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[300px]">
        {conversation.map((message, index) => (
          <div 
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-purple-100 text-purple-800 max-w-[80%] rounded-lg p-3">
              <span className="inline-flex">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-purple-100">
        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your makeup..."
            className="flex-1 border-purple-200"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!userInput.trim() || isThinking}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
        {isListening && (
          <div className="text-xs text-purple-600 mt-1 animate-pulse">
            Listening... Say something or click the mic button to stop.
          </div>
        )}
      </div>
    </Card>
  );
};

export default ImprovedConversationalAI;
