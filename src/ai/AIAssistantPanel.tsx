
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, ArrowRight, ThumbsUp, ThumbsDown, BrainCircuit } from 'lucide-react';
import AI3DAvatar from './avatar/AI3DAvatar';
import VoiceAssistant from './voice/VoiceAssistant';
import { generateAndSpeakResponse } from '@/services/enhancedSpeechService';

interface AIAssistantPanelProps {
  faceDetected: boolean;
  currentStep: string;
  facialTraits?: {
    skinTone?: string;
    faceShape?: string;
    features?: string[];
  };
  detectedTools?: Array<{ type: string; confidence: number }>;
  movementData?: { x: number; y: number; magnitude: number };
  onExecuteCommand?: (command: string, params: Record<string, string>) => void;
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  faceDetected,
  currentStep,
  facialTraits,
  detectedTools = [],
  movementData = { x: 0, y: 0, magnitude: 0 },
  onExecuteCommand
}) => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState('assistant');
  const [avatarMood, setAvatarMood] = useState<'neutral' | 'happy' | 'thinking' | 'concerned'>('neutral');
  const [assistantMessages, setAssistantMessages] = useState<Array<{ text: string; timestamp: number }>>([]);
  
  // Set avatar mood based on face detection and current state
  useEffect(() => {
    if (!faceDetected) {
      setAvatarMood('concerned');
    } else if (isSpeaking) {
      setAvatarMood('happy');
    } else if (detectedTools.length > 0) {
      setAvatarMood('thinking');
    } else {
      setAvatarMood('neutral');
    }
  }, [faceDetected, isSpeaking, detectedTools]);
  
  // Toggle voice guidance
  const toggleVoiceGuidance = () => {
    setVoiceEnabled(prev => !prev);
  };
  
  // Handle command execution
  const handleCommandExecution = async (command: string, params: Record<string, string>) => {
    console.log('Executing command:', command, params);
    
    // Add response to messages
    let response = '';
    
    switch (command) {
      case 'next':
        response = 'Moving to the next step.';
        break;
      case 'previous':
        response = 'Going back to the previous step.';
        break;
      case 'repeat':
        response = `Let me repeat that. ${currentStep}`;
        break;
      case 'help':
        response = 'I can guide you through your makeup application. Try asking about specific products or techniques.';
        break;
      case 'product':
        if (params.product) {
          response = await generateAndSpeakResponse(
            `Tell me about ${params.product}`,
            facialTraits,
            detectedTools.map(t => t.type),
            currentStep,
            faceDetected
          );
        } else {
          response = 'What product would you like to know about?';
        }
        break;
      case 'query':
        if (params.text) {
          response = await generateAndSpeakResponse(
            params.text,
            facialTraits,
            detectedTools.map(t => t.type),
            currentStep,
            faceDetected
          );
        } else {
          response = 'I didn\'t catch that. Could you please repeat?';
        }
        break;
      default:
        response = 'I\'m not sure how to help with that. Try asking about makeup techniques or products.';
    }
    
    // Add response to messages
    addAssistantMessage(response);
    
    // Execute the command if handler is provided
    if (onExecuteCommand) {
      onExecuteCommand(command, params);
    }
    
    // Speak the response
    if (voiceEnabled) {
      setIsSpeaking(true);
      await new Promise(resolve => setTimeout(resolve, response.length * 50));
      setIsSpeaking(false);
    }
  };
  
  // Add assistant message to history
  const addAssistantMessage = (text: string) => {
    setAssistantMessages(prev => [
      ...prev,
      { text, timestamp: Date.now() }
    ].slice(-5)); // Keep only the last 5 messages
  };
  
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-purple-800 flex items-center">
            <BrainCircuit className="h-5 w-5 mr-2 text-purple-600" />
            AI Makeup Assistant
          </CardTitle>
          <Badge 
            variant={faceDetected ? "success" : "destructive"}
            className={`${faceDetected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {faceDetected ? 'Face Detected' : 'No Face Detected'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex justify-center">
          <AI3DAvatar
            isSpeaking={isSpeaking}
            mood={avatarMood}
            size="medium"
            colorTheme="purple"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="assistant">Voice Assistant</TabsTrigger>
            <TabsTrigger value="analysis">Analysis & Tips</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assistant" className="space-y-4">
            <VoiceAssistant
              enabled={voiceEnabled}
              onToggle={toggleVoiceGuidance}
              faceDetected={faceDetected}
              currentStep={currentStep}
              onExecuteCommand={handleCommandExecution}
              detectedTools={detectedTools}
              movementData={movementData}
            />
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <h4 className="text-sm font-medium text-purple-700 mb-2">Face Analysis</h4>
              <div className="space-y-1.5">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Skin Tone:</span> {facialTraits?.skinTone || 'Not detected'}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Face Shape:</span> {facialTraits?.faceShape || 'Not detected'}
                </p>
                {facialTraits?.features && facialTraits.features.length > 0 && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Features:</span>{' '}
                    {facialTraits.features.join(', ')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <h4 className="text-sm font-medium text-purple-700 mb-2">Makeup Progress</h4>
              <p className="text-xs text-gray-600 mb-2">
                <span className="font-medium">Current Step:</span> {currentStep || 'Not started'}
              </p>
              {detectedTools.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">Detected Tools:</p>
                  <div className="flex flex-wrap gap-1">
                    {detectedTools.map((tool, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tool.type} ({Math.round(tool.confidence * 100)}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button size="sm" variant="outline" className="text-xs">
                <ThumbsDown className="h-3 w-3 mr-1" />
                Incorrect
              </Button>
              <Button size="sm" variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                <ThumbsUp className="h-3 w-3 mr-1" />
                Helpful
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {assistantMessages.length > 0 && (
          <div className="mt-4 bg-white p-3 rounded-lg shadow-sm max-h-40 overflow-y-auto">
            <h4 className="text-xs font-medium text-gray-500 mb-2">Recent Responses</h4>
            <div className="space-y-2">
              {assistantMessages.map((msg, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                  <ArrowRight className="h-3 w-3 text-purple-400 mt-1 flex-shrink-0" />
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAssistantPanel;
