
import React, { useState, useEffect } from 'react';
import { BadgeInfo, Lightbulb, Camera, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ImprovedConversationalAI from './ImprovedConversationalAI';

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
  const [insights, setInsights] = useState<string[]>([]);
  const [showConversational, setShowConversational] = useState(true);
  
  // Generate dynamic insights based on detected data
  useEffect(() => {
    if (!facialTraits) return;
    
    const newInsights = [];
    
    if (facialTraits.skinTone) {
      newInsights.push(`Your ${facialTraits.skinTone} skin tone would benefit from ${getSkinToneRecommendation(facialTraits.skinTone)}.`);
    }
    
    if (facialTraits.faceShape) {
      newInsights.push(`For your ${facialTraits.faceShape} face shape, try ${getFaceShapeRecommendation(facialTraits.faceShape)}.`);
    }
    
    if (facialTraits.features && facialTraits.features.length > 0) {
      const feature = facialTraits.features[0];
      newInsights.push(`To enhance your ${feature}, consider ${getFeatureRecommendation(feature)}.`);
    }
    
    if (detectedTools.length > 0) {
      const tool = detectedTools[0].type;
      newInsights.push(`I noticed you're using ${tool}. For best results, ${getToolTip(tool)}.`);
    }
    
    if (newInsights.length > 0) {
      setInsights(newInsights);
    }
  }, [facialTraits, detectedTools]);
  
  return (
    <div className="space-y-4">
      {!faceDetected && (
        <Alert variant="destructive">
          <AlertDescription>
            No face detected. Please position your face in the camera view for personalized guidance.
          </AlertDescription>
        </Alert>
      )}
      
      {faceDetected && insights.length > 0 && (
        <Card className="p-3 bg-indigo-50 border-indigo-200">
          <div className="flex items-center mb-2">
            <BadgeInfo className="h-4 w-4 text-indigo-500 mr-2" />
            <h3 className="text-indigo-700 font-medium">AI Beauty Insights</h3>
          </div>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-indigo-800 text-sm">{insight}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      
      {/* Activity detection */}
      {movementData.magnitude > 0 && (
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Zap className="h-3 w-3 mr-1" /> 
            {movementData.magnitude > 5 
              ? "High activity detected" 
              : "Light movement detected"}
          </Badge>
          
          {currentStep && (
            <Badge className="bg-purple-100 text-purple-700">
              Current step: {currentStep.split(' ').slice(0, 3).join(' ')}...
            </Badge>
          )}
        </div>
      )}
      
      {/* Improved Conversational AI component */}
      {showConversational ? (
        <ImprovedConversationalAI 
          facialTraits={facialTraits}
          currentStep={currentStep}
          faceDetected={faceDetected}
          detectedTools={detectedTools}
          movementData={movementData}
          onExecuteCommand={onExecuteCommand}
        />
      ) : (
        <Button 
          onClick={() => setShowConversational(true)}
          className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200"
        >
          <Camera className="h-4 w-4 mr-2" />
          Start AI Conversation
        </Button>
      )}
    </div>
  );
};

// Helper functions for providing recommendations
const getSkinToneRecommendation = (skinTone: string): string => {
  switch (skinTone.toLowerCase()) {
    case 'fair':
      return 'foundations with neutral undertones and soft blush colors';
    case 'light':
      return 'light to medium coverage products with peachy or pink undertones';
    case 'medium':
      return 'golden or warm-toned products that enhance your natural glow';
    case 'olive':
      return 'products with warm golden or yellow undertones to complement your complexion';
    case 'tan':
      return 'rich, warm colors that enhance your natural warmth';
    case 'deep':
      return 'high-pigment products with red or orange undertones for rich definition';
    default:
      return 'products that complement your natural undertones';
  }
};

const getFaceShapeRecommendation = (faceShape: string): string => {
  switch (faceShape.toLowerCase()) {
    case 'oval':
      return 'balanced application as most styles complement your proportional shape';
    case 'round':
      return 'applying contour at the temples and jawline to create definition';
    case 'square':
      return 'softening the angles with contour at the corners of your jawline';
    case 'heart':
      return 'balancing your wider forehead with contour and highlighting your chin';
    case 'diamond':
      return 'highlighting your cheekbones and softening your forehead and jawline';
    case 'rectangle':
      return 'applying blush horizontally across your cheeks to add width';
    default:
      return 'balanced application that enhances your unique proportions';
  }
};

const getFeatureRecommendation = (feature: string): string => {
  if (feature.includes('eyes')) {
    return 'eyeshadow techniques that accentuate your eye shape and color';
  } else if (feature.includes('lips')) {
    return 'lip products that enhance your natural lip shape';
  } else if (feature.includes('cheek') || feature.includes('bone')) {
    return 'highlighting techniques that make your cheekbones pop';
  } else if (feature.includes('brow')) {
    return 'brow products that define and frame your face';
  } else {
    return 'makeup techniques that highlight this beautiful feature';
  }
};

const getToolTip = (tool: string): string => {
  if (tool.includes('foundation')) {
    return 'apply in downward strokes to avoid highlighting facial hair';
  } else if (tool.includes('brush') && tool.includes('blush')) {
    return 'smile to find the apples of your cheeks for perfect placement';
  } else if (tool.includes('eye')) {
    return 'use light, building motions rather than heavy application';
  } else if (tool.includes('lip')) {
    return 'start from the center and work outward for even application';
  } else {
    return 'use soft, blending motions for the most natural finish';
  }
};

export default AIAssistantPanel;
