
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Mic, MicOff, Volume2, Brain, Zap, MoreHorizontal, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { speakInstruction } from '@/services/speechService';
import { generateAdvancedResponse } from '@/services/enhancedAIService';

interface AdvancedAIAssistantProps {
  facialTraits?: {
    skinTone?: string;
    faceShape?: string;
    features?: string[];
    skinType?: string;
  };
  currentStep?: string;
  faceDetected: boolean;
  detectedTools?: Array<{ type: string; confidence: number }>;
  movementData?: { x: number; y: number; magnitude: number };
  facialAttributes?: {
    age?: number;
    gender?: string;
    expression?: string;
    skinType?: string;
  };
  detectedActions?: Array<{ action: string; confidence: number; timestamp: number }>;
  makeupRegions?: any;
  onExecuteCommand?: (command: string, params: Record<string, string>) => void;
  onApplyVirtualMakeup?: (makeup: any) => void;
}

const AdvancedAIAssistant: React.FC<AdvancedAIAssistantProps> = ({
  facialTraits,
  currentStep = '',
  faceDetected,
  detectedTools = [],
  movementData = { x: 0, y: 0, magnitude: 0 },
  facialAttributes = {},
  detectedActions = [],
  makeupRegions,
  onExecuteCommand,
  onApplyVirtualMakeup
}) => {
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'ai'; content: string; timestamp: number }>>([
    { role: 'ai', content: 'Hello! I\'m your advanced makeup AI assistant. I can recognize your facial features and help you create the perfect look. How would you like me to assist you today?', timestamp: Date.now() }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [assistantMode, setAssistantMode] = useState<'jarvis' | 'friday' | 'expert'>('friday');
  const [voiceType, setVoiceType] = useState<'female' | 'male' | 'neutral'>('female');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserActivityRef = useRef<number>(Date.now());
  const awaitingResponseRef = useRef<boolean>(false);
  
  // AI personality traits
  const personalityTraits = {
    jarvis: {
      greeting: "At your service. How may I assist with your makeup today?",
      style: "formal, precise, and slightly witty",
      prompt: "You are J.A.R.V.I.S., an advanced AI makeup assistant. Respond in a formal, precise, and slightly witty manner. You prioritize efficiency and results. Use technical terminology when appropriate and offer detailed explanations. Speak like an AI butler with sophistication."
    },
    friday: {
      greeting: "Hey there! Ready to create some amazing makeup looks together?",
      style: "friendly, supportive, and enthusiastic",
      prompt: "You are F.R.I.D.A.Y., an advanced AI makeup assistant. Be friendly, supportive, and enthusiastic. Use casual language, emoji occasionally, and be encouraging. Your personality is warm and approachable, like a helpful friend who's excited about makeup."
    },
    expert: {
      greeting: "Welcome to your professional makeup consultation. Let's assess your features and create the perfect look.",
      style: "professional, authoritative, and detailed",
      prompt: "You are a professional makeup artist with decades of experience. Speak with authority and expertise. Use industry terminology, mention professional techniques, and explain the reasoning behind your recommendations. Your tone is sophisticated and educational."
    }
  };
  
  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        recognitionRef.current = new SpeechRecognitionConstructor();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          
          setUserInput(transcript);
          lastUserActivityRef.current = Date.now();
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event);
          setIsListening(false);
        };
      }
      
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
  
  // Monitor for inactivity and proactively engage
  useEffect(() => {
    if (!faceDetected) return;
    
    const INACTIVITY_TIMEOUT = 30000; // 30 seconds
    
    const checkActivity = () => {
      const now = Date.now();
      const elapsed = now - lastUserActivityRef.current;
      
      if (elapsed > INACTIVITY_TIMEOUT && !isThinking && !awaitingResponseRef.current && conversation.length > 1) {
        // User has been inactive, send a proactive message
        const proactiveMessages = [
          "I notice you're thinking... Need any suggestions for your makeup look?",
          "Would you like me to recommend a technique for your face shape?",
          "I'm detecting your facial features. Would you like me to suggest a matching look?",
          "Need any help with your current step? I can guide you through it."
        ];
        
        const randomMessage = proactiveMessages[Math.floor(Math.random() * proactiveMessages.length)];
        
        setConversation(prev => [
          ...prev, 
          { role: 'ai', content: randomMessage, timestamp: Date.now() }
        ]);
        
        if (voiceType !== 'neutral') {
          setIsSpeaking(true);
          speakInstruction(randomMessage).then(() => setIsSpeaking(false));
        }
        
        lastUserActivityRef.current = now;
      }
    };
    
    const intervalId = setInterval(checkActivity, 10000);
    
    return () => clearInterval(intervalId);
  }, [faceDetected, isThinking, conversation, voiceType]);
  
  // Respond to detected actions
  useEffect(() => {
    if (detectedActions.length === 0 || isThinking || awaitingResponseRef.current) return;
    
    // Get the most recent action
    const latestAction = detectedActions[0];
    
    // If it's a new action (within the last 2 seconds)
    if (Date.now() - latestAction.timestamp < 2000 && latestAction.confidence > 0.8) {
      const actionResponses: Record<string, string[]> = {
        'Head turning left': [
          "I notice you're looking to the left. Would you like me to suggest makeup for that side?",
          "Looking at your left profile? Let me analyze that angle for you.",
        ],
        'Head turning right': [
          "I see you're checking your right profile. Need help with that angle?",
          "Your right side is looking good! Need any tips for that area?",
        ],
        'Head moving up': [
          "Looking up? Your under-eye area looks good.",
          "I see you're checking your brow bone area. Need any eyeshadow tips?",
        ],
        'Head moving down': [
          "Looking down? That's perfect for applying eyeshadow.",
          "When you look down like that, it's easier to apply eyeliner.",
        ]
      };
      
      // Find responses for this action type
      const actionType = Object.keys(actionResponses).find(type => 
        latestAction.action.includes(type)
      );
      
      if (actionType && Math.random() < 0.3) { // Only respond 30% of the time to avoid being annoying
        const responses = actionResponses[actionType];
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        setConversation(prev => [
          ...prev, 
          { role: 'ai', content: response, timestamp: Date.now() }
        ]);
        
        if (voiceType !== 'neutral') {
          setIsSpeaking(true);
          speakInstruction(response).then(() => setIsSpeaking(false));
        }
      }
    }
  }, [detectedActions, isThinking, voiceType]);
  
  // Toggle listening
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      
      // Update last activity timestamp
      lastUserActivityRef.current = Date.now();
    }
  };
  
  // Generate personalized AI prompt based on current state
  const generateAIPrompt = useCallback(() => {
    const personality = personalityTraits[assistantMode];
    
    let prompt = personality.prompt + "\n\n";
    
    // Add contextual information
    prompt += "Current context:\n";
    
    if (facialTraits) {
      prompt += `- User has ${facialTraits.skinTone || 'unknown'} skin tone and ${facialTraits.faceShape || 'unknown'} face shape.\n`;
      if (facialTraits.features && facialTraits.features.length > 0) {
        prompt += `- Notable facial features: ${facialTraits.features.join(', ')}.\n`;
      }
    }
    
    if (facialAttributes) {
      if (facialAttributes.expression) {
        prompt += `- User's current expression: ${facialAttributes.expression}.\n`;
      }
      if (facialAttributes.skinType) {
        prompt += `- User's skin type: ${facialAttributes.skinType}.\n`;
      }
    }
    
    if (currentStep) {
      prompt += `- Current makeup step: ${currentStep}.\n`;
    }
    
    if (detectedTools.length > 0) {
      prompt += `- Tools detected in user's hand: ${detectedTools.map(t => t.type).join(', ')}.\n`;
    }
    
    // Add makeup expertise
    prompt += "\nYou are an expert in makeup application, with deep knowledge of:";
    prompt += "\n- Color theory and matching makeup to skin tones";
    prompt += "\n- Techniques for different face shapes";
    prompt += "\n- Product recommendations and application methods";
    prompt += "\n- Step-by-step guidance for complete looks";
    
    // Add instructions for responses
    prompt += "\n\nWhen responding:";
    prompt += "\n1. Be conversational and natural, like a makeup artist friend";
    prompt += "\n2. If you detect a question about makeup, provide detailed advice";
    prompt += "\n3. If the user seems confused, offer simple step-by-step guidance";
    prompt += "\n4. Be supportive and encouraging throughout the makeup process";
    prompt += "\n5. Keep responses concise but informative";
    
    return prompt;
  }, [assistantMode, facialTraits, facialAttributes, currentStep, detectedTools]);
  
  // Send message
  const sendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Add user message to conversation
    const userMessage = userInput.trim();
    setConversation(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
    setUserInput('');
    setIsThinking(true);
    awaitingResponseRef.current = true;
    
    // Extract detected tool types
    const toolTypes = detectedTools.map(tool => tool.type);
    
    try {
      // Generate AI response with advanced context
      const aiPrompt = generateAIPrompt();
      
      const response = await generateAdvancedResponse(
        userMessage,
        aiPrompt,
        {
          facialTraits,
          tools: toolTypes,
          currentStep,
          faceDetected,
          facialAttributes,
          recentActions: detectedActions.slice(0, 3).map(a => a.action)
        }
      );
      
      // Add AI response to conversation
      setConversation(prev => [...prev, { role: 'ai', content: response, timestamp: Date.now() }]);
      
      // Check for commands to execute
      const commandPatterns = [
        { regex: /next( step)?/i, command: 'next' },
        { regex: /previous( step)?/i, command: 'previous' },
        { regex: /analyze( face)?/i, command: 'analyze' },
        { regex: /look( for)? (\w+)/i, command: 'selectLook', paramName: 'lookName' },
        { regex: /apply ([\w\s]+) (lip|eye|cheek|blush|foundation)/i, command: 'applyMakeup', paramGroup: 1, typeGroup: 2 }
      ];
      
      for (const pattern of commandPatterns) {
        const match = userMessage.match(pattern.regex);
        if (match) {
          const params: Record<string, string> = {};
          
          if (pattern.paramName && match[2]) {
            params[pattern.paramName] = match[2];
          }
          
          if (pattern.paramGroup && pattern.typeGroup && match[pattern.paramGroup] && match[pattern.typeGroup]) {
            const color = match[pattern.paramGroup].trim();
            const type = match[pattern.typeGroup].trim();
            
            // Handle makeup application
            if (pattern.command === 'applyMakeup' && onApplyVirtualMakeup) {
              const makeupToApply: any = {};
              
              if (type.includes('lip')) {
                makeupToApply.lips = { color: color, intensity: 0.7, glossy: color.includes('gloss') };
              } else if (type.includes('eye')) {
                makeupToApply.eyes = { color: color, intensity: 0.6 };
              } else if (type.includes('cheek') || type.includes('blush')) {
                makeupToApply.cheeks = { color: color, intensity: 0.5 };
              } else if (type.includes('foundation')) {
                makeupToApply.foundation = { color: color, coverage: 0.6 };
              }
              
              onApplyVirtualMakeup(makeupToApply);
            }
          }
          
          if (onExecuteCommand) {
            onExecuteCommand(pattern.command, params);
          }
          break;
        }
      }
      
      // Speak the response if voice is enabled
      if (voiceType !== 'neutral') {
        setIsSpeaking(true);
        await speakInstruction(response);
        setIsSpeaking(false);
      }
      
      // Update last activity timestamp
      lastUserActivityRef.current = Date.now();
    } catch (error) {
      console.error('Error generating response', error);
      setConversation(prev => [...prev, { 
        role: 'ai', 
        content: 'I apologize, but I encountered an issue while processing your request. Could you try again?', 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsThinking(false);
      awaitingResponseRef.current = false;
    }
  };
  
  // Handle key press for sending message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Change AI assistant mode
  const changeAssistantMode = (mode: 'jarvis' | 'friday' | 'expert') => {
    setAssistantMode(mode);
    const greeting = personalityTraits[mode].greeting;
    
    setConversation(prev => [
      ...prev, 
      { role: 'ai', content: `Switching to ${mode.toUpperCase()} mode. ${greeting}`, timestamp: Date.now() }
    ]);
    
    setVoiceType(mode === 'jarvis' ? 'male' : mode === 'friday' ? 'female' : 'neutral');
    
    if (voiceType !== 'neutral') {
      setIsSpeaking(true);
      speakInstruction(`Switching to ${mode} mode. ${greeting}`).then(() => setIsSpeaking(false));
    }
  };
  
  // Return the formatted time for messages
  const getFormattedTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card className="flex flex-col h-full bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100 shadow-md">
      <div className="p-3 bg-gradient-to-r from-violet-200 to-indigo-200 flex justify-between items-center rounded-t-lg">
        <div className="flex items-center">
          {assistantMode === 'jarvis' ? (
            <Zap className="h-5 w-5 text-blue-700 mr-2" />
          ) : assistantMode === 'friday' ? (
            <Sparkles className="h-5 w-5 text-pink-600 mr-2" />
          ) : (
            <Wand2 className="h-5 w-5 text-purple-700 mr-2" />
          )}
          <h3 className="font-medium text-gray-800">
            {assistantMode === 'jarvis' ? 'J.A.R.V.I.S.' : assistantMode === 'friday' ? 'F.R.I.D.A.Y.' : 'Makeup Expert'} AI
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-1 h-auto"
                    >
                      <Brain className="h-4 w-4 text-indigo-600" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">AI Assistant Mode</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          variant={assistantMode === 'jarvis' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => changeAssistantMode('jarvis')}
                          className={assistantMode === 'jarvis' ? "bg-blue-600" : ""}
                        >
                          J.A.R.V.I.S.
                        </Button>
                        <Button 
                          variant={assistantMode === 'friday' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => changeAssistantMode('friday')}
                          className={assistantMode === 'friday' ? "bg-pink-600" : ""}
                        >
                          F.R.I.D.A.Y.
                        </Button>
                        <Button 
                          variant={assistantMode === 'expert' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => changeAssistantMode('expert')}
                          className={assistantMode === 'expert' ? "bg-purple-600" : ""}
                        >
                          Expert
                        </Button>
                      </div>
                      <div className="pt-2 border-t">
                        <h4 className="font-medium mb-1">Voice Type</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <Button 
                            variant={voiceType === 'female' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setVoiceType('female')}
                          >
                            Female
                          </Button>
                          <Button 
                            variant={voiceType === 'male' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setVoiceType('male')}
                          >
                            Male
                          </Button>
                          <Button 
                            variant={voiceType === 'neutral' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setVoiceType('neutral')}
                          >
                            Mute
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change AI Assistant Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            size="sm" 
            variant={isListening ? "default" : "outline"} 
            className={`p-1 h-auto ${isListening ? "bg-red-500 hover:bg-red-600" : ""}`}
            onClick={toggleListening}
          >
            {isListening ? (
              <MicOff className="h-4 w-4 text-white" />
            ) : (
              <Mic className="h-4 w-4 text-indigo-600" />
            )}
          </Button>
          
          {isSpeaking && (
            <Badge variant="outline" className="bg-indigo-100 text-indigo-700 animate-pulse flex items-center">
              <Volume2 className="h-3 w-3 mr-1" />
              <span>Speaking</span>
            </Badge>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 mb-0 grid grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[350px] min-h-[200px]">
            {conversation.map((message, index) => (
              <div 
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-indigo-100 text-indigo-800' 
                      : assistantMode === 'jarvis'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : assistantMode === 'friday'
                          ? 'bg-pink-100 text-pink-800 border border-pink-200'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}
                >
                  <div className="text-sm mb-1">
                    {message.content}
                  </div>
                  <div className="text-xs opacity-60 text-right">
                    {getFormattedTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div 
                  className={`bg-gray-100 text-gray-800 max-w-[85%] rounded-lg p-3 ${
                    assistantMode === 'jarvis'
                      ? 'border border-blue-200'
                      : assistantMode === 'friday'
                        ? 'border border-pink-200'
                        : 'border border-purple-200'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t border-indigo-100">
            <div className="flex gap-2">
              <Input
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  lastUserActivityRef.current = Date.now();
                }}
                onKeyPress={handleKeyPress}
                placeholder={`Ask ${assistantMode.toUpperCase()} about makeup...`}
                className="flex-1 border-indigo-200"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!userInput.trim() || isThinking}
                className={
                  assistantMode === 'jarvis'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : assistantMode === 'friday'
                      ? 'bg-pink-600 hover:bg-pink-700' 
                      : 'bg-purple-600 hover:bg-purple-700'
                }
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
            {isListening && (
              <div className={`text-xs mt-1 animate-pulse ${
                assistantMode === 'jarvis'
                  ? 'text-blue-600'
                  : assistantMode === 'friday'
                    ? 'text-pink-600' 
                    : 'text-purple-600'
              }`}>
                Listening... Say something or click the mic button to stop.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="insights" className="flex-1 overflow-y-auto p-3">
          <div className="space-y-4">
            {/* Facial Analysis */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-100">
              <h4 className="font-medium text-gray-800 mb-2">Facial Analysis</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {facialTraits?.skinTone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skin Tone:</span>
                    <span className="font-medium">{facialTraits.skinTone}</span>
                  </div>
                )}
                {facialTraits?.faceShape && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Face Shape:</span>
                    <span className="font-medium">{facialTraits.faceShape}</span>
                  </div>
                )}
                {facialAttributes?.skinType && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skin Type:</span>
                    <span className="font-medium">{facialAttributes.skinType}</span>
                  </div>
                )}
                {facialAttributes?.expression && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expression:</span>
                    <span className="font-medium">{facialAttributes.expression}</span>
                  </div>
                )}
                {facialAttributes?.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Age:</span>
                    <span className="font-medium">{facialAttributes.age}</span>
                  </div>
                )}
              </div>
              
              {facialTraits?.features && facialTraits.features.length > 0 && (
                <div className="mt-2">
                  <h5 className="text-sm text-gray-600 mb-1">Features:</h5>
                  <div className="flex flex-wrap gap-1">
                    {facialTraits.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="bg-indigo-50">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Detected Tools */}
            {detectedTools.length > 0 && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-100">
                <h4 className="font-medium text-gray-800 mb-2">Detected Tools</h4>
                <div className="space-y-1">
                  {detectedTools.map((tool, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{tool.type}</span>
                      <span className="text-indigo-600">{Math.round(tool.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recent Actions */}
            {detectedActions.length > 0 && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-100">
                <h4 className="font-medium text-gray-800 mb-2">Recent Activity</h4>
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {detectedActions.map((action, idx) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span>{action.action}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Current Step */}
            {currentStep && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-100">
                <h4 className="font-medium text-gray-800 mb-1">Current Makeup Step</h4>
                <p className="text-sm">{currentStep}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AdvancedAIAssistant;
