
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { FacialAttributes, MovementData, DetectedAction, MakeupRegion, DetectedObject } from '@/types/facial-analysis';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AdvancedAIAssistantProps {
  facialTraits?: {
    skinTone: string;
    faceShape: string;
    skinType?: string;
    features: string[];
    recommendations: string[];
  } | null;
  currentStep?: string;
  faceDetected: boolean;
  detectedTools?: Array<{ type: string; confidence: number }>;
  movementData?: MovementData;
  facialAttributes?: FacialAttributes;
  detectedActions?: DetectedAction[];
  makeupRegions?: MakeupRegion[];
  onExecuteCommand?: (command: string, params: Record<string, string>) => void;
  onApplyVirtualMakeup?: (makeup: any) => void;
}

const MAKEUP_KNOWLEDGE_BASE: {
  skinTones: Record<string, Record<string, string>>;
  faceShapes: Record<string, Record<string, string>>;
  makeupProducts: Record<string, {
    purpose: string;
    applicationTechniques: string[];
  }>;
} = {
  skinTones: {
    'Fair': {
      foundation: 'Look for foundations with neutral or slightly pink undertones.',
      blush: 'Soft pink and peach blushes work well.',
      lipstick: 'Avoid very dark shades which can appear harsh. Opt for rosy pinks, peachy nudes, or soft reds.',
      eyeshadow: 'Cool-toned shades like taupes, soft grays, and lavenders complement well.'
    },
    'Light': {
      foundation: 'Choose foundations with yellow, neutral, or slightly pink undertones.',
      blush: 'Pink, peach, and coral blushes suit this skin tone.',
      lipstick: 'Pink, coral, berry, and red shades work beautifully.',
      eyeshadow: 'Both warm and cool tones work well, like bronze, copper, navy, and purple.'
    },
    'Medium': {
      foundation: 'Look for foundations with golden or olive undertones.',
      blush: 'Rich pinks, warm corals, and peachy shades complement medium skin.',
      lipstick: 'Coral, berry, cranberry, and warm red shades flatter this skin tone.',
      eyeshadow: 'Earth tones like bronze, copper, warm browns, and olive greens work well.'
    },
    'Olive': {
      foundation: 'Choose foundations with yellow-green or golden undertones.',
      blush: 'Terracotta, warm peach, and bronze blushes are flattering.',
      lipstick: 'Rich berries, terracotta, warm browns, and cranberry shades enhance olive skin.',
      eyeshadow: 'Bronze, gold, copper, and emerald green enhance the natural warmth.'
    },
    'Tan': {
      foundation: 'Look for foundations with golden or warm undertones.',
      blush: 'Rich corals, deep peaches, and bronze blushes work well.',
      lipstick: 'Coral, orange-red, terracotta, and rich berry shades are flattering.',
      eyeshadow: 'Golden bronzes, copper, warm browns, and mossy greens complement tan skin.'
    },
    'Deep': {
      foundation: 'Choose foundations with red, golden, or neutral undertones.',
      blush: 'Rich berries, deep corals, and warm bronzes add beautiful dimension.',
      lipstick: 'Bold berries, plums, rich reds, and warm browns make a statement.',
      eyeshadow: 'Gold, copper, bronze, rich purples, and emerald green create stunning looks.'
    },
    'Rich': {
      foundation: 'Look for foundations with red, blue, or neutral undertones.',
      blush: 'Deep berries, rich plums, and warm bronzes are most flattering.',
      lipstick: 'Deep plums, rich berries, bold reds, and warm browns create gorgeous contrast.',
      eyeshadow: 'Bold jewel tones, gold, bronze, and deep blues and purples create striking looks.'
    }
  },
  
  faceShapes: {
    'Oval': {
      highlight: 'Your face has naturally balanced proportions. Highlight the center of your forehead and chin.',
      contour: 'Light contouring on the sides of your forehead and jawline can enhance your already balanced features.',
      blush: 'Apply blush to the apples of your cheeks and blend upward toward your temples.',
      eyebrows: 'Most brow shapes work well with an oval face. A soft arch complements your proportions.'
    },
    'Round': {
      highlight: 'Highlight the center of your forehead, under your eyes, and the center of your chin.',
      contour: 'Contour the sides of your forehead, below your cheekbones, and along your jawline to create definition.',
      blush: 'Apply blush slightly above the hollows of your cheeks and blend toward your temples.',
      eyebrows: 'Angled or high-arched brows can help elongate your face shape.'
    },
    'Square': {
      highlight: 'Highlight the center of your forehead, under your eyes, and the center of your chin.',
      contour: 'Contour the corners of your forehead and jawline to soften angular features.',
      blush: 'Apply blush to the apples of your cheeks and blend upward for a softer look.',
      eyebrows: 'Softly rounded or slightly angled brows with a less defined arch can soften angular features.'
    },
    'Heart': {
      highlight: 'Highlight the center of your forehead, under your eyes, and the center of your chin.',
      contour: 'Contour the sides of your forehead and temples. Add light contour to the tip of your chin.',
      blush: 'Apply blush below the apples of your cheeks and blend outward to create balance.',
      eyebrows: 'Rounded brows with a soft arch complement heart-shaped faces.'
    },
    'Diamond': {
      highlight: 'Highlight the center of your forehead, high points of your cheekbones, and center of your chin.',
      contour: 'Contour the sides of your forehead and jawline to soften the angles.',
      blush: 'Apply blush horizontally across your cheekbones to add width to the center of your face.',
      eyebrows: 'Softly curved brows with a subtle arch work well with diamond face shapes.'
    },
    'Rectangle': {
      highlight: 'Highlight the center of your forehead, under your eyes, and the center of your chin.',
      contour: 'Contour the top of your forehead, below your cheekbones, and along your jawline.',
      blush: 'Apply blush horizontally across your cheekbones to add width rather than length.',
      eyebrows: 'Straight or softly angled brows with minimal arch help balance the length of your face.'
    }
  },
  
  makeupProducts: {
    foundation: {
      purpose: 'Creates an even base and covers imperfections',
      applicationTechniques: ['Apply from center of face outward', 'Blend with beauty sponge or brush']
    },
    concealer: {
      purpose: 'Conceals blemishes, dark circles and imperfections',
      applicationTechniques: ['Pat gently, don\'t rub', 'Apply after foundation for more coverage']
    },
    blush: {
      purpose: 'Adds color and dimension to the face',
      applicationTechniques: ['Smile to find the apples of your cheeks', 'Blend upward toward temples']
    },
    bronzer: {
      purpose: 'Adds warmth and dimension to the face',
      applicationTechniques: ['Apply where sun naturally hits: forehead, cheekbones, jawline', 'Blend well for natural look']
    },
    highlighter: {
      purpose: 'Brings forward features and adds a glow',
      applicationTechniques: ['Apply to high points of face', 'Can be applied on brow bone, cheekbones, nose bridge']
    },
    eyeshadow: {
      purpose: 'Adds color and dimension to the eyes',
      applicationTechniques: ['Apply lightest shade all over lid', 'Medium shade in crease', 'Darkest shade in outer corner']
    },
    eyeliner: {
      purpose: 'Defines eyes and can change their apparent shape',
      applicationTechniques: ['Draw as close to lash line as possible', 'For winged liner, follow angle from lower lash line']
    },
    mascara: {
      purpose: 'Darkens, lengthens, and thickens eyelashes',
      applicationTechniques: ['Wiggle brush at base of lashes', 'Pull through to the tips']
    },
    lipstick: {
      purpose: 'Adds color and definition to lips',
      applicationTechniques: ['Line lips first for precision', 'Apply from center outward']
    },
    primer: {
      purpose: 'Creates smooth base and helps makeup last longer',
      applicationTechniques: ['Apply small amount all over face', 'Wait 1-2 minutes before applying foundation']
    }
  }
};

const AdvancedAIAssistant: React.FC<AdvancedAIAssistantProps> = ({
  facialTraits,
  currentStep,
  faceDetected,
  detectedTools = [],
  movementData,
  facialAttributes,
  detectedActions = [],
  makeupRegions = [],
  onExecuteCommand,
  onApplyVirtualMakeup
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your advanced AI makeup assistant. I can help with personalized makeup recommendations and application guidance. Let me know what you\'d like help with!',
      timestamp: Date.now()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastDetectedToolRef = useRef<string | null>(null);
  const lastDetectedActionRef = useRef<string | null>(null);
  
  // Setup speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);
        
        // Check for commands in real-time
        const commandPhrases = [
          { regex: /next( step)?/i, command: 'next', params: {} },
          { regex: /previous( step)?|back/i, command: 'previous', params: {} },
          { regex: /analyze( face)?|scan/i, command: 'analyze', params: {} },
          { regex: /use (natural|bold|glam)/i, command: 'selectLook', params: (match: RegExpMatchArray) => ({ lookName: match[1] }) }
        ];
        
        for (const { regex, command, params } of commandPhrases) {
          const match = transcript.match(regex);
          if (match && onExecuteCommand) {
            const parameters = typeof params === 'function' ? params(match) : params;
            onExecuteCommand(command, parameters);
            setInput('');
            recognition.stop();
            break;
          }
        }
      };
      
      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        }
      };
      
      setSpeechRecognition(recognition);
    } else {
      console.log('Speech recognition not supported');
    }
    
    return () => {
      if (speechRecognition) {
        speechRecognition.stop();
      }
    };
  }, [onExecuteCommand, isListening]);
  
  // Toggle speech recognition
  const toggleListening = () => {
    if (!speechRecognition) return;
    
    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      speechRecognition.start();
      setIsListening(true);
      setVoiceEnabled(true);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Detect tools and provide guidance
  useEffect(() => {
    if (detectedTools.length > 0) {
      const currentTool = detectedTools[0].type;
      
      // Only provide guidance if this is a new tool
      if (lastDetectedToolRef.current !== currentTool) {
        lastDetectedToolRef.current = currentTool;
        
        // Find product in knowledge base
        const productType = Object.keys(MAKEUP_KNOWLEDGE_BASE.makeupProducts).find(
          type => currentTool.toLowerCase().includes(type.toLowerCase())
        );
        
        if (productType) {
          const product = MAKEUP_KNOWLEDGE_BASE.makeupProducts[productType];
          
          const newMessage: Message = {
            role: 'assistant',
            content: `I see you're using a ${currentTool}! ${product.purpose}. Tip: ${product.applicationTechniques[0]}`,
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, newMessage]);
        }
      }
    } else {
      lastDetectedToolRef.current = null;
    }
  }, [detectedTools]);
  
  // Respond to user actions
  useEffect(() => {
    if (detectedActions.length > 0) {
      const currentAction = detectedActions[0].action;
      
      // Only provide guidance if this is a new action with high confidence
      if (lastDetectedActionRef.current !== currentAction && detectedActions[0].confidence > 0.7) {
        lastDetectedActionRef.current = currentAction;
        
        // Add specific responses for certain actions
        if (currentAction === "started smiling") {
          const newMessage: Message = {
            role: 'assistant',
            content: "I see you're smiling! Your makeup is looking great so far.",
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, newMessage]);
        } else if (currentAction === "opened mouth" && Math.random() < 0.3) {
          // Only respond sometimes to avoid being annoying
          const newMessage: Message = {
            role: 'assistant',
            content: "Try keeping your mouth relaxed while applying eye makeup for better precision.",
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, newMessage]);
        }
      }
    } else {
      lastDetectedActionRef.current = null;
    }
  }, [detectedActions]);
  
  // Handle message sending
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      // Prepare context for the AI
      const context = {
        facialTraits,
        currentStep,
        faceDetected,
        tools: detectedTools.map(tool => tool.type),
        facialAttributes,
        recentActions: detectedActions.map(action => action.action)
      };
      
      // Send message to edge function
      const { data, error } = await supabase.functions.invoke('ai-makeup-assistant', {
        body: {
          message: input,
          systemPrompt: "You are an advanced makeup assistant AI. Provide personalized, helpful advice based on the user's facial features and makeup context.",
          context
        },
      });
      
      if (error) throw error;
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't process that request.",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Check for special commands in the response
      const applyLipstickMatch = assistantMessage.content.match(/apply ([\w\s]+) lipstick/i);
      const changeBlushMatch = assistantMessage.content.match(/try ([\w\s]+) blush/i);
      
      if (onApplyVirtualMakeup) {
        if (applyLipstickMatch) {
          const lipColor = getLipColorFromDescription(applyLipstickMatch[1]);
          onApplyVirtualMakeup({
            lips: { color: lipColor, intensity: 0.7, glossy: true }
          });
        }
        
        if (changeBlushMatch) {
          const blushColor = getBlushColorFromDescription(changeBlushMatch[1]);
          onApplyVirtualMakeup({
            cheeks: { color: blushColor, intensity: 0.5 }
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Let me try to help with what I know.",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Provide simple offline response based on available context
      if (facialTraits) {
        const offlineHelp: Message = {
          role: 'assistant',
          content: generateOfflineResponse(input, facialTraits),
          timestamp: Date.now() + 100
        };
        
        setMessages(prev => [...prev, offlineHelp]);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Generate a simple offline response based on local knowledge
  const generateOfflineResponse = (query: string, traits: any): string => {
    const queryLower = query.toLowerCase();
    
    // Check for questions about skin tone
    if (queryLower.includes('skin tone') || queryLower.includes('foundation')) {
      const skinTone = traits.skinTone || 'Medium';
      return `Based on your ${skinTone} skin tone, ${MAKEUP_KNOWLEDGE_BASE.skinTones[skinTone]?.foundation || 'I recommend finding foundations with neutral or golden undertones'}.`;
    }
    
    // Check for questions about face shape
    if (queryLower.includes('face shape') || queryLower.includes('contour')) {
      const faceShape = traits.faceShape || 'Oval';
      return `You have a ${faceShape} face shape. ${MAKEUP_KNOWLEDGE_BASE.faceShapes[faceShape]?.contour || 'Apply contour to create definition and structure'}.`;
    }
    
    // Default response
    return "I can provide better assistance when connected to the server, but based on what I can see, focus on enhancing your natural features and applying products in thin layers for the most natural finish.";
  };
  
  // Helper functions for color selection
  const getLipColorFromDescription = (description: string): string => {
    const colorMap: Record<string, string> = {
      'red': '#FF0000',
      'pink': '#FF69B4',
      'nude': '#CC9966',
      'berry': '#990066',
      'coral': '#FF7F50',
      'orange': '#FF4500',
      'plum': '#8E4585',
      'burgundy': '#800020',
      'mauve': '#E0B0FF'
    };
    
    for (const [key, value] of Object.entries(colorMap)) {
      if (description.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    return '#FF5555'; // Default pink-red
  };
  
  const getBlushColorFromDescription = (description: string): string => {
    const colorMap: Record<string, string> = {
      'pink': '#FF9999',
      'peach': '#FFCC99',
      'coral': '#FF7F50',
      'rose': '#E8ADAA',
      'berry': '#990066',
      'plum': '#8E4585',
      'bronze': '#CD7F32',
      'terracotta': '#E2725B'
    };
    
    for (const [key, value] of Object.entries(colorMap)) {
      if (description.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    return '#FFAAAA'; // Default soft pink
  };
  
  // Status indicators
  const renderStatusIndicators = () => (
    <div className="flex flex-wrap gap-1 mb-2">
      <Badge
        variant={faceDetected ? "default" : "outline"}
        className={`${faceDetected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'} text-xs`}
      >
        {faceDetected ? 'Face Detected' : 'No Face Detected'}
      </Badge>
      
      {detectedTools.length > 0 && (
        <Badge className="bg-purple-100 text-purple-800 text-xs">
          {detectedTools[0].type}
        </Badge>
      )}
      
      {currentStep && (
        <Badge className="bg-blue-100 text-blue-800 text-xs">
          {currentStep}
        </Badge>
      )}
      
      {facialAttributes?.expression && (
        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
          {facialAttributes.expression}
        </Badge>
      )}
      
      {makeupRegions.length > 0 && (
        <Badge className="bg-indigo-100 text-indigo-800 text-xs">
          {makeupRegions.length} Makeup Regions
        </Badge>
      )}
    </div>
  );
  
  return (
    <Card className="h-full flex flex-col">
      <div className="p-3 bg-gradient-to-r from-pink-100 to-purple-100 flex justify-between items-center">
        <h3 className="font-medium text-purple-900 flex items-center">
          <Sparkles className="h-4 w-4 mr-1 text-purple-600" />
          AI Makeup Assistant
        </h3>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-purple-700 hover:text-purple-900 hover:bg-purple-200"
          onClick={toggleListening}
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="p-3 flex-grow overflow-hidden flex flex-col">
        {renderStatusIndicators()}
        
        <div className="flex-grow overflow-y-auto space-y-4 pb-2">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`${
                message.role === 'user' 
                  ? 'ml-auto bg-purple-100 text-purple-800' 
                  : 'mr-auto bg-gray-100 text-gray-800'
              } rounded-lg p-3 max-w-[80%]`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="pt-3 border-t mt-2">
          <div className="flex items-center space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about makeup or say 'next' to go to the next step..."
              className="min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button 
              onClick={sendMessage}
              disabled={isProcessing || !input.trim()}
              size="sm"
              className="shrink-0"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {isListening && (
            <p className="text-xs text-center mt-1 text-purple-600 animate-pulse">
              Listening...
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AdvancedAIAssistant;
