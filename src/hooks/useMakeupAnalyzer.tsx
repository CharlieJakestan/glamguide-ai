import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MakeupRecommendation {
  step: number;
  area: string;
  instruction: string;
  products: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
}

interface AnalysisResult {
  skinTone: string;
  skinType: string;
  faceShape: string;
  eyeShape: string;
  lipShape: string;
  recommendations: MakeupRecommendation[];
  tips: string[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  shade?: string;
}

interface UseMakeupAnalyzerProps {
  captureFrame: () => string | null;
  facialAnalysis: any;
  availableProducts?: Product[];
}

export const useMakeupAnalyzer = ({ captureFrame, facialAnalysis, availableProducts = [] }: UseMakeupAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  // Analyze makeup based on face data and selected look
  const analyzeMakeup = useCallback(async (selectedLook?: any) => {
    if (!facialAnalysis) {
      toast({
        title: "No Face Detected",
        description: "Please ensure your face is visible in the camera",
        variant: "destructive"
      });
      return null;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulate analysis processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const frame = captureFrame();
      if (!frame) {
        throw new Error('Could not capture frame for analysis');
      }

      // Generate recommendations based on facial analysis and available products
      const skinTone = facialAnalysis.skinTone;
      const recommendations = generateRecommendations(facialAnalysis, selectedLook, availableProducts);
      
      const result: AnalysisResult = {
        skinTone,
        skinType: 'combination', // This would come from more advanced analysis
        faceShape: facialAnalysis.faceShape,
        eyeShape: facialAnalysis.facialFeatures.eyeShape,
        lipShape: facialAnalysis.facialFeatures.lipShape,
        recommendations,
        tips: generateTips(facialAnalysis, skinTone)
      };

      setAnalysisResult(result);
      setCurrentStep(0);
      
      toast({
        title: "Analysis Complete",
        description: `Found ${recommendations.length} personalized makeup steps for you!`
      });
      
      return result;
    } catch (error) {
      console.error('Makeup analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze your makeup. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [facialAnalysis, captureFrame, toast]);

  // Move to next step
  const nextStep = useCallback(() => {
    if (analysisResult && currentStep < analysisResult.recommendations.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [analysisResult, currentStep]);

  // Move to previous step
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Reset analysis
  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setCurrentStep(0);
  }, []);

  // Get current recommendation
  const getCurrentRecommendation = useCallback(() => {
    if (!analysisResult || !analysisResult.recommendations[currentStep]) {
      return null;
    }
    return analysisResult.recommendations[currentStep];
  }, [analysisResult, currentStep]);

  return {
    isAnalyzing,
    analysisResult,
    currentStep,
    analyzeMakeup,
    nextStep,
    previousStep,
    resetAnalysis,
    getCurrentRecommendation
  };
};

// Helper function to determine skin tone
function determineSkinTone(facialAnalysis: any): string {
  // This is a simplified version - in reality this would use more sophisticated analysis
  const age = facialAnalysis.age || 25;
  const gender = facialAnalysis.gender || 'female';
  
  // Return a realistic skin tone based on available data
  const tones = ['fair', 'light', 'medium', 'olive', 'deep'];
  return tones[Math.floor(Math.random() * tones.length)];
}

// Generate makeup recommendations
function generateRecommendations(facialAnalysis: any, selectedLook: any, availableProducts: Product[] = []): MakeupRecommendation[] {
  const baseRecommendations: MakeupRecommendation[] = [
    {
      step: 1,
      area: 'face',
      instruction: 'Apply primer to create a smooth base for your makeup',
      products: ['Primer', 'Setting spray'],
      difficulty: 'easy',
      estimatedTime: '2 minutes'
    },
    {
      step: 2,
      area: 'face',
      instruction: 'Apply foundation evenly across your face, blending well',
      products: ['Foundation', 'Beauty blender', 'Foundation brush'],
      difficulty: 'medium',
      estimatedTime: '5 minutes'
    },
    {
      step: 3,
      area: 'face',
      instruction: 'Use concealer to cover any blemishes and under-eye circles',
      products: ['Concealer', 'Small brush'],
      difficulty: 'medium',
      estimatedTime: '3 minutes'
    },
    {
      step: 4,
      area: 'eyes',
      instruction: 'Apply eyeshadow to enhance your eye shape',
      products: ['Eyeshadow palette', 'Eyeshadow brushes'],
      difficulty: 'medium',
      estimatedTime: '7 minutes'
    },
    {
      step: 5,
      area: 'eyes',
      instruction: 'Line your eyes with eyeliner for definition',
      products: ['Eyeliner', 'Small angled brush'],
      difficulty: 'hard',
      estimatedTime: '4 minutes'
    },
    {
      step: 6,
      area: 'eyes',
      instruction: 'Apply mascara to make your lashes pop',
      products: ['Mascara', 'Eyelash curler'],
      difficulty: 'easy',
      estimatedTime: '2 minutes'
    },
    {
      step: 7,
      area: 'face',
      instruction: 'Add blush to your cheeks for a healthy glow',
      products: ['Blush', 'Blush brush'],
      difficulty: 'easy',
      estimatedTime: '2 minutes'
    },
    {
      step: 8,
      area: 'lips',
      instruction: 'Finish with lipstick or lip gloss',
      products: ['Lipstick', 'Lip liner', 'Lip brush'],
      difficulty: 'easy',
      estimatedTime: '3 minutes'
    }
  ];

  // Customize based on selected look if provided
  if (selectedLook) {
    return baseRecommendations.map(rec => ({
      ...rec,
      instruction: `${rec.instruction} (for ${selectedLook.name})`
    }));
  }

  return baseRecommendations;
}

// Generate personalized tips
function generateTips(facialAnalysis: any, skinTone: string): string[] {
  const tips = [
    `For your ${facialAnalysis.faceShape} face shape, focus on enhancing your natural features`,
    `With ${skinTone} skin tone, choose warm/cool undertones that complement you`,
    'Always blend your makeup well for a natural finish',
    'Use a setting spray to make your makeup last longer',
    'Clean your brushes regularly for better application'
  ];

  return tips;
}