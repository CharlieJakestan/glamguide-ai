
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Mic, MicOff, BrainCircuit, MessageSquareMore, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCosmetologyKnowledge } from '@/services/ganService';

interface AdvancedAIAssistantProps {
  facialTraits?: any;
  currentStep?: string;
  faceDetected?: boolean;
  detectedTools?: Array<{type: string; confidence: number}>;
  movementData?: any;
  facialAttributes?: any;
  detectedActions?: Array<{action: string; confidence: number; timestamp: number}>;
  makeupRegions?: Array<{
    type: string;
    region: {
      points: Array<{x: number, y: number}>;
      center: {x: number, y: number};
    };
  }>;
  onExecuteCommand?: (command: string, params: Record<string, string>) => void;
  onApplyVirtualMakeup?: (makeup: any) => void;
}

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
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Array<{role: string; content: string; timestamp: number}>>([
    {role: 'assistant', content: 'Hello! I\'m your AI makeup assistant. I\'ll help guide you through your makeup application.', timestamp: Date.now()}
  ]);
  const [thinking, setThinking] = useState(false);
  const [knowledge, setKnowledge] = useState<any>(null);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch cosmetology knowledge
  useEffect(() => {
    const fetchKnowledge = async () => {
      setLoadingKnowledge(true);
      try {
        const result = await getCosmetologyKnowledge();
        if (result && result.status === 'ok' && result.knowledge) {
          setKnowledge(result.knowledge);
        }
      } catch (error) {
        console.error('Error fetching cosmetology knowledge:', error);
      } finally {
        setLoadingKnowledge(false);
      }
    };
    
    fetchKnowledge();
  }, []);
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Process changes in detected actions
  useEffect(() => {
    if (detectedActions.length === 0) return;
    
    // Get the most recent action that hasn't been processed yet
    const latestAction = detectedActions[0];
    
    // Skip if it's older than 3 seconds
    if (Date.now() - latestAction.timestamp > 3000) return;
    
    // Process the action
    processUserAction(latestAction.action, latestAction.confidence);
  }, [detectedActions]);
  
  // Process step changes
  useEffect(() => {
    if (!currentStep) return;
    
    // Check if this is a new step we haven't announced yet
    const previousMessage = messages[messages.length - 1];
    if (previousMessage?.content?.includes(currentStep)) return;
    
    // Add the new step instruction
    addAssistantMessage(`Let's move to the next step: ${currentStep}`);
  }, [currentStep]);
  
  // Process detected tools
  useEffect(() => {
    if (detectedTools.length === 0) return;
    
    // Get the most recently detected tool
    const latestTool = detectedTools[0];
    
    // Skip if confidence is too low
    if (latestTool.confidence < 0.7) return;
    
    // Check if we've already mentioned this tool recently
    const recentMessages = messages.slice(-5);
    const alreadyMentioned = recentMessages.some(msg => 
      msg.content.toLowerCase().includes(latestTool.type.toLowerCase())
    );
    
    if (alreadyMentioned) return;
    
    // Add a message about the detected tool
    addAssistantMessage(`I see you're using a ${latestTool.type}. Great choice!`);
    
    // If we have knowledge about this tool, provide tips
    if (knowledge) {
      const toolType = latestTool.type.toLowerCase();
      
      // Check if it's a brush or specific product
      if (toolType.includes('brush')) {
        const brushType = Object.keys(knowledge.products).find(product => 
          toolType.includes(product.toLowerCase())
        );
        
        if (brushType && knowledge.products[brushType]) {
          const productInfo = knowledge.products[brushType];
          const techniques = knowledge.techniques[brushType] || [];
          
          if (techniques.length > 0) {
            // Choose a random technique tip
            const randomTip = techniques[Math.floor(Math.random() * techniques.length)];
            addAssistantMessage(`Tip for ${brushType} application: ${randomTip}`);
          }
        }
      } else {
        // It's a product, not a brush
        const productType = Object.keys(knowledge.products).find(product => 
          toolType.includes(product.toLowerCase())
        );
        
        if (productType && knowledge.products[productType]) {
          const productInfo = knowledge.products[productType];
          addAssistantMessage(`For best ${productType} application: ${productInfo.purpose}`);
        }
      }
    }
  }, [detectedTools, knowledge]);
  
  // Add assistant message
  const addAssistantMessage = (content: string) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content,
      timestamp: Date.now()
    }]);
    
    // Speak the message if voice is enabled
    if (voiceEnabled) {
      speakText(content);
    }
  };
  
  // Add user message
  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content,
      timestamp: Date.now()
    }]);
    
    // Process user message
    processUserMessage(content);
  };
  
  // Process user action
  const processUserAction = (action: string, confidence: number) => {
    // Skip low confidence actions
    if (confidence < 0.7) return;
    
    // Check if this is a significant action that should get a response
    if (
      action.includes('smil') ||
      action.includes('head') ||
      action.includes('expressing')
    ) {
      // React to the action
      switch (true) {
        case action.includes('smil'):
          addAssistantMessage("I see you're smiling! Your makeup looks great!");
          break;
        case action.includes('head turned'):
          addAssistantMessage("I notice you're turning your head to check the angles. Good thinking!");
          break;
        case action.includes('expressing happy'):
          addAssistantMessage("You seem happy with your progress. That's great!");
          break;
        case action.includes('expressing surprised'):
          addAssistantMessage("Did something surprise you? Let me know if you need any help.");
          break;
        default:
          // Don't react to every action to avoid being too chatty
          break;
      }
    }
  };
  
  // Process user message
  const processUserMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Show thinking state
    setThinking(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      // Handle commands
      if (lowerMessage.includes('next step') || lowerMessage.includes('next instruction')) {
        onExecuteCommand?.('next', {});
        addAssistantMessage("Moving to the next step!");
      } else if (lowerMessage.includes('previous step') || lowerMessage.includes('go back')) {
        onExecuteCommand?.('previous', {});
        addAssistantMessage("Going back to the previous step.");
      } else if (lowerMessage.includes('analyze') || lowerMessage.includes('detection')) {
        onExecuteCommand?.('analyze', {});
        addAssistantMessage("I'll analyze your face again now.");
      } else if (lowerMessage.includes('natural look') || lowerMessage.includes('natural makeup')) {
        onExecuteCommand?.('selectLook', { lookName: 'natural' });
        addAssistantMessage("I've selected a natural makeup look for you.");
        
        // Apply natural makeup settings
        onApplyVirtualMakeup?.({
          lips: { color: 'rgba(220, 150, 150, 0.5)', intensity: 0.5, glossy: true },
          eyes: { color: 'rgba(180, 160, 140, 0.4)', intensity: 0.4 },
          cheeks: { color: 'rgba(230, 180, 160, 0.4)', intensity: 0.3 },
          foundation: { color: 'rgba(245, 222, 190, 0.2)', coverage: 0.2 }
        });
      } else if (lowerMessage.includes('glam') || lowerMessage.includes('dramatic')) {
        onExecuteCommand?.('selectLook', { lookName: 'glam' });
        addAssistantMessage("I've selected a glamorous makeup look for you.");
        
        // Apply glam makeup settings
        onApplyVirtualMakeup?.({
          lips: { color: 'rgba(220, 50, 90, 0.8)', intensity: 0.8, glossy: false },
          eyes: { color: 'rgba(60, 60, 80, 0.7)', intensity: 0.7 },
          cheeks: { color: 'rgba(250, 120, 120, 0.6)', intensity: 0.6 },
          foundation: { color: 'rgba(245, 222, 179, 0.4)', coverage: 0.4 }
        });
      } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        addAssistantMessage(
          "I can help you with your makeup application! You can ask me to:\n\n" +
          "- Move to the next or previous step\n" +
          "- Switch to a different makeup look (natural, glam, etc.)\n" +
          "- Provide tips for specific products\n" +
          "- Analyze your face\n" +
          "- Get recommendations based on your skin tone and face shape"
        );
      } else if (lowerMessage.includes('face shape') && facialAttributes?.faceShape) {
        // Provide face shape tips
        if (knowledge?.faceShapes && facialAttributes.faceShape) {
          const shape = facialAttributes.faceShape.toLowerCase();
          const shapeInfo = knowledge.faceShapes[shape];
          
          if (shapeInfo) {
            addAssistantMessage(
              `Your face shape is ${facialAttributes.faceShape}. Here are some tips:\n\n` +
              shapeInfo.makeupTips.join('\n\n')
            );
          } else {
            addAssistantMessage(`Your face shape is ${facialAttributes.faceShape}, which works well with most makeup styles!`);
          }
        } else {
          addAssistantMessage(`Your face shape is ${facialAttributes.faceShape}. This shape works well with most makeup styles!`);
        }
      } else if (lowerMessage.includes('skin tone') && facialAttributes?.skinTone) {
        // Provide skin tone tips
        if (knowledge?.skinTones && facialAttributes.skinTone) {
          const tone = facialAttributes.skinTone.toLowerCase();
          const toneInfo = knowledge.skinTones[tone];
          
          if (toneInfo) {
            addAssistantMessage(
              `Your skin tone is ${facialAttributes.skinTone}. Here are some tips:\n\n` +
              toneInfo.makeupTips.join('\n\n')
            );
          } else {
            addAssistantMessage(`Your skin tone is ${facialAttributes.skinTone}. It's beautiful!`);
          }
        } else {
          addAssistantMessage(`Your skin tone is ${facialAttributes.skinTone}. It's beautiful!`);
        }
      } else {
        // Generic response for other queries
        addAssistantMessage(getGenericResponse(message));
      }
      
      setThinking(false);
    }, 1000);
  };
  
  // Get generic response
  const getGenericResponse = (message: string) => {
    const lowerMessage = message.toLowerCase();
    const responses = [
      "I'm here to help with your makeup application! What would you like to know?",
      "That's a great question! Let me think about that...",
      "I'm focusing on helping you with makeup right now. Is there something specific about your makeup look you'd like help with?",
      "I understand what you're asking. Let me try to help you with that."
    ];
    
    // Check for product-specific questions
    if (knowledge?.products) {
      for (const [product, info] of Object.entries(knowledge.products)) {
        if (lowerMessage.includes(product.toLowerCase())) {
          return `About ${product}: ${info.purpose}. It's best applied with ${info.applicationTechniques.join(' or ')}.`;
        }
      }
    }
    
    // Check for technique questions
    if (lowerMessage.includes('how to') || lowerMessage.includes('technique')) {
      const techniques = [
        "Start by applying products from the center of your face outward for the most natural look.",
        "For precise application, use a small brush and build up gradually.",
        "Always blend thoroughly to avoid harsh lines.",
        "Use gentle patting motions rather than wiping for better product application."
      ];
      
      return techniques[Math.floor(Math.random() * techniques.length)];
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  };
  
  // Text-to-speech function
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // Use a female voice if available
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Google'));
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    // Speak
    window.speechSynthesis.speak(utterance);
  };
  
  // Toggle voice
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    
    if (!voiceEnabled) {
      speakText("Voice guidance activated. I'll help you through your makeup routine.");
    }
  };
  
  // Handle voice command
  const handleVoiceCommand = () => {
    // In a real implementation, this would use the Web Speech API
    // For now, we'll simulate it
    setIsListening(true);
    
    // Simulate listening for 3 seconds
    setTimeout(() => {
      setIsListening(false);
      
      // Simulate a random voice command
      const commands = [
        "Next step please",
        "Give me tips for this foundation",
        "How does my blush look?",
        "Show me a natural look"
      ];
      
      const randomCommand = commands[Math.floor(Math.random() * commands.length)];
      addUserMessage(randomCommand);
    }, 3000);
  };
  
  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-100 to-pink-100">
        <div className="flex items-center">
          <BrainCircuit className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="font-medium text-purple-800">AI Makeup Assistant</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVoice}
            className={voiceEnabled ? "text-purple-600" : "text-gray-400"}
            title={voiceEnabled ? "Disable voice" : "Enable voice"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceCommand}
            className={isListening ? "text-purple-600 animate-pulse" : "text-gray-400"}
            disabled={isListening}
            title="Voice command"
          >
            {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="chat" className="flex items-center">
            <MessageSquareMore className="h-4 w-4 mr-2" /> Chat
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center">
            Tools {detectedTools.length > 0 && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">{detectedTools.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center">
            Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'assistant'
                        ? 'bg-purple-100 text-purple-900'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {thinking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-purple-100 text-purple-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t mt-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const message = formData.get('message') as string;
                if (message.trim()) {
                  addUserMessage(message);
                  e.currentTarget.reset();
                }
              }}
              className="flex space-x-2"
            >
              <input
                type="text"
                name="message"
                placeholder="Ask me for makeup help..."
                className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="tools" className="space-y-4 p-4 h-full">
          <div>
            <h3 className="font-medium mb-2">Detected Makeup Tools</h3>
            {detectedTools.length > 0 ? (
              <ul className="space-y-2">
                {detectedTools.map((tool, idx) => (
                  <li key={idx} className="bg-purple-50 p-2 rounded-lg flex justify-between items-center">
                    <span>{tool.type}</span>
                    <Badge variant="secondary">
                      {Math.round(tool.confidence * 100)}%
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No makeup tools detected. Hold up brushes or products so I can see them.</p>
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Makeup Knowledge Base</h3>
            {loadingKnowledge ? (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span>Loading makeup knowledge...</span>
              </div>
            ) : knowledge ? (
              <div className="space-y-2">
                <p className="text-sm">Products in knowledge base: {Object.keys(knowledge.products).length}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(knowledge.products).slice(0, 6).map(product => (
                    <Badge key={product} variant="outline">{product}</Badge>
                  ))}
                  {Object.keys(knowledge.products).length > 6 && (
                    <Badge variant="outline">+{Object.keys(knowledge.products).length - 6} more</Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Cosmetology knowledge base not available.</p>
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Current Step</h3>
            {currentStep ? (
              <p className="bg-purple-50 p-3 rounded text-sm">{currentStep}</p>
            ) : (
              <p className="text-sm text-gray-500">No current step selected.</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-4 p-4 h-full">
          <div>
            <h3 className="font-medium mb-2">Face Detection</h3>
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${faceDetected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{faceDetected ? 'Face Detected' : 'No Face Detected'}</span>
            </div>
            {faceDetected && (
              <Progress value={detectionConfidence * 100} className="mt-2" />
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Facial Attributes</h3>
            {facialAttributes && (
              <div className="space-y-2 text-sm">
                {facialAttributes.skinTone && (
                  <div className="flex justify-between">
                    <span>Skin Tone:</span>
                    <Badge variant="outline">{facialAttributes.skinTone}</Badge>
                  </div>
                )}
                {facialAttributes.faceShape && (
                  <div className="flex justify-between">
                    <span>Face Shape:</span>
                    <Badge variant="outline">{facialAttributes.faceShape}</Badge>
                  </div>
                )}
                {facialAttributes.features && facialAttributes.features.length > 0 && (
                  <div>
                    <span className="block mb-1">Features:</span>
                    <div className="flex flex-wrap gap-2">
                      {facialAttributes.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Recent Actions</h3>
            {detectedActions.length > 0 ? (
              <ul className="space-y-2">
                {detectedActions.slice(0, 4).map((action, idx) => (
                  <li key={idx} className="bg-gray-50 p-2 rounded-lg text-sm flex justify-between">
                    <span>{action.action}</span>
                    <span className="text-gray-400 text-xs">
                      {Math.round((Date.now() - action.timestamp) / 1000)}s ago
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No recent actions detected.</p>
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Makeup Regions</h3>
            {makeupRegions.length > 0 ? (
              <ul className="text-sm space-y-1">
                {Array.from(new Set(makeupRegions.map(r => r.type))).map((type) => (
                  <li key={type} className="flex items-center">
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ 
                        backgroundColor: makeupRegions.find(r => r.type === type)?.color || '#888' 
                      }}
                    ></div>
                    {type}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No makeup regions detected.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AdvancedAIAssistant;
