
import React, { useEffect, useState } from 'react';
import { Volume2, Info, Camera, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FacialAnalysisDisplayProps {
  detectedFacialTraits: {
    skinTone: string;
    faceShape: string;
    features: string[];
    recommendations: string[];
  } | null;
  voiceEnabled: boolean;
  analysisImage: string | null;
  movementData?: { x: number; y: number; magnitude: number };
  lastActivity?: string;
  onReanalyze?: () => void;
  isAnalyzing?: boolean;
}

const FacialAnalysisDisplay: React.FC<FacialAnalysisDisplayProps> = ({
  detectedFacialTraits,
  voiceEnabled,
  analysisImage,
  movementData,
  lastActivity,
  onReanalyze,
  isAnalyzing = false
}) => {
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  // Animated progress effect for better UX
  useEffect(() => {
    if (detectedFacialTraits && animatedProgress < 100) {
      const timer = setInterval(() => {
        setAnimatedProgress(prev => Math.min(prev + 5, 100));
      }, 50);
      return () => clearInterval(timer);
    }
  }, [detectedFacialTraits, animatedProgress]);

  useEffect(() => {
    // Log active analysis to confirm component is receiving data
    if (detectedFacialTraits) {
      console.log('Facial analysis data received:', detectedFacialTraits);
    }
    
    if (movementData) {
      console.log('Movement data received:', movementData);
    }
    
    if (lastActivity) {
      console.log('Activity detected:', lastActivity);
    }
    
    // Auto-show AI insights after a brief delay
    const timer = setTimeout(() => {
      setShowAIInsights(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [detectedFacialTraits, movementData, lastActivity]);

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
            </div>
            
            {movementData && movementData.magnitude > 0 && (
              <div className="mt-2 text-xs text-purple-700 bg-purple-50 p-2 rounded-md animate-pulse">
                <div className="font-medium mb-1">Real-time Movement Analysis:</div>
                <div>Magnitude: {movementData.magnitude.toFixed(1)}</div>
                <div>Direction: {Math.abs(movementData.x) > Math.abs(movementData.y) 
                  ? (movementData.x > 0 ? 'Right' : 'Left') 
                  : (movementData.y > 0 ? 'Down' : 'Up')}
                </div>
              </div>
            )}
            
            {lastActivity && (
              <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded-md">
                <div className="font-medium">AI Detected Activity:</div>
                <div className="font-semibold">{lastActivity}</div>
                <div className="text-xs text-gray-500 mt-1">
                  AI is continuously learning from your movements
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="w-full md:w-2/3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-purple-800 flex items-center">
              <Volume2 className={`h-4 w-4 ${voiceEnabled ? 'text-purple-600' : 'text-gray-400'} mr-2`} />
              Your Facial Analysis Results
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
          
          {showAIInsights && (
            <div className="mt-4 bg-indigo-50 p-3 rounded-md border border-indigo-200 animate-fade-in">
              <h4 className="text-indigo-700 font-medium mb-2 flex items-center">
                <Info className="h-4 w-4 mr-1" /> 
                Real-time AI Insights
              </h4>
              <p className="text-indigo-800 text-sm">
                Based on your movements and facial features, AI suggests: 
                {movementData && movementData.magnitude > 5 ? (
                  " Try to keep your head more steady for precise makeup application."
                ) : movementData && movementData.magnitude < 1 ? (
                  " Your steady pose is perfect for detailed makeup application."
                ) : (
                  " Your current position is good for makeup application."
                )}
                {lastActivity && lastActivity.includes("Detected") ? (
                  ` I see you're using a ${lastActivity.replace("Detected ", "").toLowerCase()}. Make sure to blend properly!`
                ) : ""}
              </p>
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

export default FacialAnalysisDisplay;
