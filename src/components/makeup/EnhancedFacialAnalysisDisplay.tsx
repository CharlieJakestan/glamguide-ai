
import React, { useEffect, useState } from 'react';
import { Volume2, Info, Camera, Loader2, Activity, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DetectedObject } from '@/hooks/useMakeupObjectDetection';

interface EnhancedFacialAnalysisDisplayProps {
  detectedFacialTraits: {
    skinTone: string;
    faceShape: string;
    features: string[];
    recommendations: string[];
    skinType?: string;
  } | null;
  voiceEnabled: boolean;
  analysisImage: string | null;
  movementData?: { x: number; y: number; magnitude: number };
  lastActivity?: string | null;
  onReanalyze?: () => void;
  isAnalyzing?: boolean;
  nearbyObjects?: DetectedObject[];
  faceDetectionConfidence?: number;
  detectedMakeupTools?: Array<{type: string, confidence: number}>;
  facialAttributes?: {
    age?: number;
    gender?: string;
    expression?: string;
    skinType?: string;
  };
}

const EnhancedFacialAnalysisDisplay: React.FC<EnhancedFacialAnalysisDisplayProps> = ({
  detectedFacialTraits,
  voiceEnabled,
  analysisImage,
  movementData,
  lastActivity,
  onReanalyze,
  isAnalyzing = false,
  nearbyObjects = [],
  faceDetectionConfidence = 0,
  detectedMakeupTools = [],
  facialAttributes = {}
}) => {
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [latestInsight, setLatestInsight] = useState<string>('');
  const [detectedTools, setDetectedTools] = useState<Set<string>>(new Set());
  
  // Animated progress effect for better UX
  useEffect(() => {
    if (detectedFacialTraits && animatedProgress < 100) {
      const timer = setInterval(() => {
        setAnimatedProgress(prev => Math.min(prev + 5, 100));
      }, 50);
      return () => clearInterval(timer);
    }
  }, [detectedFacialTraits, animatedProgress]);

  // Generate dynamic insights based on detection data
  useEffect(() => {
    if (!detectedFacialTraits) return;
    
    let newInsight = '';
    
    // Generate insights based on latest activity or movement
    if (lastActivity && lastActivity.includes('Detected')) {
      const tool = lastActivity.replace('Detected ', '');
      newInsight = `I see you're using a ${tool.toLowerCase()}. `;
      
      // Add the detected tool to our tracking set
      setDetectedTools(prev => new Set(prev).add(tool.toLowerCase()));
      
      if (tool.toLowerCase().includes('foundation')) {
        newInsight += 'Apply it in circular motions for a smooth finish.';
      } else if (tool.toLowerCase().includes('brush')) {
        newInsight += 'Remember to tap off excess product before applying.';
      } else if (tool.toLowerCase().includes('lipstick')) {
        newInsight += 'Start from the center and work your way outward for even application.';
      } else {
        newInsight += 'Make sure to blend thoroughly for a seamless look.';
      }
    } else if (movementData && movementData.magnitude > 5) {
      newInsight = "I notice you're moving quite a bit. Try to keep still for more precise makeup application.";
    } else if (movementData && movementData.magnitude < 1 && lastActivity?.includes('looking')) {
      newInsight = "Your steady pose is perfect for detailed makeup application. Would you like guidance on your next step?";
    } else if (detectedMakeupTools.length > 0) {
      const mostConfidentTool = detectedMakeupTools.sort((a, b) => b.confidence - a.confidence)[0];
      const toolType = mostConfidentTool.type.toLowerCase();
      
      // Add this tool to our tracking set as well
      setDetectedTools(prev => new Set(prev).add(toolType));
      
      newInsight = `I see you're working with ${toolType}. `;
      
      // Provide more specific guidance based on the tool
      if (toolType.includes('foundation')) {
        newInsight += "Start from the center of your face and blend outward for even coverage.";
      } else if (toolType.includes('eye')) {
        newInsight += "Apply lighter shades to the lid and darker ones to the crease for dimension.";
      } else if (toolType.includes('lip')) {
        newInsight += "Define your lip shape first, then fill in the color.";
      } else if (toolType.includes('blush')) {
        newInsight += "Smile to find the apples of your cheeks and blend upward toward your temples.";
      } else {
        newInsight += "Do you need any specific guidance?";
      }
    } else if (facialAttributes?.expression && facialAttributes.expression !== 'neutral') {
      // Respond to facial expression
      newInsight = `I notice your expression looks ${facialAttributes.expression}. `;
      
      if (facialAttributes.expression === 'happy') {
        newInsight += "That's perfect for applying blush! Smile naturally helps you find the apples of your cheeks.";
      } else if (facialAttributes.expression === 'surprised') {
        newInsight += "That's actually a great expression for applying eyeshadow - it helps you see your mobile lid better.";
      } else if (facialAttributes.expression.includes('sad') || facialAttributes.expression.includes('angry')) {
        newInsight += "For the most accurate makeup application, try to keep a relaxed, neutral expression.";
      }
    } else {
      // Default insight based on facial traits
      newInsight = `Based on your ${detectedFacialTraits.faceShape} face shape and ${detectedFacialTraits.skinTone} skin tone, ` +
        'focus on the techniques mentioned in your personalized recommendations.';
      
      if (facialAttributes?.skinType) {
        newInsight += ` With your ${facialAttributes.skinType} skin type, remember to ${
          facialAttributes.skinType.toLowerCase().includes('dry') 
            ? 'use hydrating, cream-based products'
            : facialAttributes.skinType.toLowerCase().includes('oily')
              ? 'opt for oil-free, mattifying products'
              : 'balance hydration and oil control in different areas'
        }.`;
      }
    }
    
    if (newInsight !== latestInsight) {
      setLatestInsight(newInsight);
      
      // Log insights for debugging
      console.log('Generated new AI insight:', newInsight);
    }
    
    // Auto-show AI insights after a brief delay
    const timer = setTimeout(() => {
      setShowAIInsights(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [detectedFacialTraits, movementData, lastActivity, latestInsight, detectedMakeupTools, facialAttributes]);

  if (!detectedFacialTraits) {
    return isAnalyzing ? (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200 shadow-sm mb-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mr-3" />
          <p className="text-purple-700 font-medium">Analyzing your facial features...</p>
        </div>
        <Progress value={animatedProgress} className="mt-4" />
      </Card>
    ) : null;
  }
  
  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200 shadow-sm mb-6 overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6">
        {analysisImage && (
          <div className="w-full md:w-1/3">
            <div className="relative rounded-lg overflow-hidden bg-white shadow-sm">
              <img 
                src={analysisImage} 
                alt="Analyzed face" 
                className="w-full h-auto object-cover"
              />
              <Badge className="absolute top-2 right-2 bg-purple-100 text-purple-700">
                AI Analysis
              </Badge>
              
              {/* Face detection confidence indicator */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/30 backdrop-blur-sm rounded p-1">
                <div className="flex justify-between items-center text-xs text-white">
                  <span>Face detection</span>
                  <span>{Math.round(faceDetectionConfidence * 100)}%</span>
                </div>
                <Progress 
                  value={faceDetectionConfidence * 100} 
                  className="h-1.5 mt-1"
                />
              </div>
            </div>
            
            {/* Real-time movement analysis */}
            {movementData && movementData.magnitude > 0 && (
              <div className="mt-2 text-xs text-purple-700 bg-purple-50 p-2 rounded-md">
                <div className="font-medium mb-1 flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  Real-time Movement Analysis:
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                  <div>Magnitude: {movementData.magnitude.toFixed(1)}</div>
                  <div>Direction: {Math.abs(movementData.x) > Math.abs(movementData.y) 
                    ? (movementData.x > 0 ? 'Right' : 'Left') 
                    : (movementData.y > 0 ? 'Down' : 'Up')}
                  </div>
                </div>
                <Progress 
                  value={Math.min(movementData.magnitude * 10, 100)} 
                  className="h-1.5 mt-1"
                />
              </div>
            )}
            
            {/* AI detected activity */}
            {lastActivity && (
              <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded-md animate-pulse">
                <div className="font-medium">AI Detected Activity:</div>
                <div className="font-semibold">{lastActivity}</div>
                <div className="text-xs text-gray-500 mt-1">
                  AI is continuously learning from your movements
                </div>
              </div>
            )}
            
            {/* Facial expression */}
            {facialAttributes?.expression && (
              <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 p-2 rounded-md">
                <div className="font-medium">Detected Expression:</div>
                <div className="flex justify-between">
                  <span className="font-semibold capitalize">{facialAttributes.expression}</span>
                  {facialAttributes.age && (
                    <span className="text-indigo-500">Est. Age: {facialAttributes.age}</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Detected makeup tools */}
            {detectedMakeupTools.length > 0 && (
              <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded-md">
                <div className="font-medium">Detected Makeup Tools:</div>
                <ul className="mt-1 space-y-1">
                  {detectedMakeupTools.map((tool, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{tool.type}</span>
                      <span className="text-blue-500">{Math.round(tool.confidence * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Makeup application progress tracker */}
            {detectedTools.size > 0 && (
              <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 p-2 rounded-md">
                <div className="font-medium flex items-center">
                  <Zap className="h-3 w-3 mr-1" />
                  Makeup Application Progress:
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.from(detectedTools).map((tool, idx) => (
                    <Badge key={idx} className="bg-indigo-100 text-indigo-700 flex items-center">
                      <Check className="h-2 w-2 mr-1" />
                      {tool}
                    </Badge>
                  ))}
                </div>
                <Progress 
                  value={Math.min(detectedTools.size * 16.7, 100)} 
                  className="h-1.5 mt-1"
                />
                <div className="text-right text-xs mt-1">
                  {Math.min(Math.round(detectedTools.size * 16.7), 100)}% complete
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="w-full md:w-2/3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-purple-800 flex items-center">
              <Volume2 className={`h-4 w-4 ${voiceEnabled ? 'text-purple-600' : 'text-gray-400'} mr-2`} />
              Advanced Facial Analysis
            </h3>
            
            {onReanalyze && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReanalyze}
                className="text-purple-600 border-purple-200"
              >
                <Camera className="h-3 w-3 mr-1" />
                Re-analyze
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded shadow-sm">
              <h4 className="font-medium text-purple-700 mb-1">Detected Features</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-purple-900 font-medium w-24">Skin Tone:</span>
                  <span className="text-purple-800 font-semibold">{detectedFacialTraits.skinTone}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-purple-900 font-medium w-24">Face Shape:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <span className="text-purple-800 font-semibold">{detectedFacialTraits.faceShape}</span>
                          <Info className="ml-1 h-3 w-3 text-purple-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Face shape affects makeup application techniques</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {facialAttributes?.skinType && (
                  <div className="flex items-center">
                    <span className="text-purple-900 font-medium w-24">Skin Type:</span>
                    <span className="text-purple-800 font-semibold">{facialAttributes.skinType}</span>
                  </div>
                )}
              </div>
              
              <h4 className="font-medium text-purple-700 mt-3 mb-1">Distinctive Features</h4>
              <ul className="list-disc list-inside text-purple-800 text-sm">
                {detectedFacialTraits.features.map((feature, index) => (
                  <li key={index} className="font-medium">{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-3 rounded shadow-sm">
              <h4 className="font-medium text-purple-700 mb-2">Personalized Recommendations</h4>
              <ul className="space-y-2">
                {detectedFacialTraits.recommendations.map((rec, index) => (
                  <li key={index} className="flex">
                    <span className="text-pink-500 mr-2">✦</span>
                    <span className="text-purple-800 text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Enhanced real-time AI insights */}
          {showAIInsights && (
            <div className="mt-4 bg-indigo-50 p-3 rounded-md border border-indigo-200 animate-fade-in">
              <h4 className="text-indigo-700 font-medium mb-2 flex items-center">
                <Info className="h-4 w-4 mr-1" /> 
                Real-time AI Insights
              </h4>
              <p className="text-indigo-800 text-sm">
                {latestInsight}
              </p>
              
              {/* Nearby objects visualization */}
              {nearbyObjects && nearbyObjects.length > 0 && (
                <Alert className="mt-2 bg-indigo-100 border-indigo-200">
                  <div className="text-xs text-indigo-700">
                    <div className="font-medium">Detected nearby:</div>
                    <ul className="mt-1">
                      {nearbyObjects.map((obj, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{obj.type}</span>
                          <span>{Math.round(obj.confidence * 100)}% confident</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Alert>
              )}
            </div>
          )}
          
          <div className="mt-4 text-sm text-purple-600 italic">
            These analysis results update in real-time as you apply makeup and move.
          </div>
        </div>
      </div>
    </Card>
  );
};

const Check = (props: any) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
};

export default EnhancedFacialAnalysisDisplay;
