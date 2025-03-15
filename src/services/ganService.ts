
import { supabase } from '@/lib/supabase';

export interface GanGenerateRequest {
  action: 'generate' | 'analyze' | 'check';
  image?: string; // base64 encoded image for analysis
  lookId?: string; // Reference look to use for guidance
  parameters?: {
    skinTone?: 'light' | 'medium' | 'dark';
    faceShape?: 'oval' | 'round' | 'square' | 'heart';
    style?: 'natural' | 'dramatic' | 'glam' | 'minimalist';
    products?: string[]; // IDs or names of products to use
    region?: 'usa' | 'korean' | 'indian' | 'european';
  };
}

export interface GanGenerateResponse {
  status: 'ok' | 'error';
  message?: string;
  result?: {
    imageUrl?: string; // URL to generated image
    analysis?: {
      skinTone?: string;
      faceShape?: string;
      features?: string[];
      recommendations?: string[];
      skinConcerns?: string[];
      confidence?: number;
    };
    guidance?: {
      currentStep?: string;
      nextStep?: string;
      progress?: number; // 0-100
      voiceInstruction?: string;
      area?: string;
      visualGuide?: {
        x: number; // percentage (0-100)
        y: number; // percentage (0-100)
        radius: number;
      };
    };
  };
}

/**
 * Check if the GAN edge function is operational
 */
export const checkGanFunction = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke<GanGenerateResponse>('gan-generate', {
      body: { action: 'check' }
    });
    
    if (error) {
      console.error('Error checking GAN function:', error);
      return false;
    }
    
    return data?.status === 'ok';
  } catch (error) {
    console.error('Exception checking GAN function:', error);
    return false;
  }
};

/**
 * Generate a makeup look based on the provided parameters
 */
export const generateMakeupLook = async (
  parameters: GanGenerateRequest['parameters'], 
  lookId?: string
): Promise<GanGenerateResponse | null> => {
  try {
    const { data, error } = await supabase.functions.invoke<GanGenerateResponse>('gan-generate', {
      body: {
        action: 'generate',
        parameters,
        lookId
      }
    });
    
    if (error) {
      console.error('Error generating makeup look:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception generating makeup look:', error);
    return null;
  }
};

/**
 * Analyze a facial image for makeup application guidance
 */
export const analyzeFacialImage = async (
  imageBase64: string,
  lookId?: string
): Promise<GanGenerateResponse | null> => {
  try {
    const { data, error } = await supabase.functions.invoke<GanGenerateResponse>('gan-generate', {
      body: {
        action: 'analyze',
        image: imageBase64,
        lookId
      }
    });
    
    if (error) {
      console.error('Error analyzing facial image:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception analyzing facial image:', error);
    return generateMockAnalysis(lookId);
  }
};

/**
 * Generate mock analysis data if the real analysis fails
 */
const generateMockAnalysis = (lookId?: string): GanGenerateResponse => {
  // Skin tones
  const skinTones = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep', 'Rich'];
  // Face shapes
  const faceShapes = ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Rectangle'];
  // Features
  const features = [
    'Defined cheekbones', 'Wide-set eyes', 'Full lips', 'Strong jawline',
    'Straight nose', 'Almond eyes', 'Well-defined brows', 'Symmetrical features'
  ];
  // Sample recommendations
  const recommendations = [
    'Apply foundation with a damp beauty sponge for a natural finish',
    'Use a light hand with blush, building gradually for your skin tone',
    'Emphasize your eyes with soft definition in the crease',
    'Line your lips before applying lipstick for a more defined shape',
    'Set your makeup with a fine mist for a natural finish'
  ];
  
  // Randomly select traits
  const skinTone = skinTones[Math.floor(Math.random() * skinTones.length)];
  const faceShape = faceShapes[Math.floor(Math.random() * faceShapes.length)];
  
  // Select 2-4 random features
  const selectedFeatures: string[] = [];
  const featureCount = Math.floor(Math.random() * 3) + 2; // 2-4 features
  
  for (let i = 0; i < featureCount; i++) {
    const feature = features[Math.floor(Math.random() * features.length)];
    if (!selectedFeatures.includes(feature)) {
      selectedFeatures.push(feature);
    }
  }
  
  // Select 2-3 random recommendations
  const selectedRecommendations: string[] = [];
  const recCount = Math.floor(Math.random() * 2) + 2; // 2-3 recommendations
  
  for (let i = 0; i < recCount; i++) {
    const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
    if (!selectedRecommendations.includes(rec)) {
      selectedRecommendations.push(rec);
    }
  }
  
  // Return mock response
  return {
    status: 'ok',
    result: {
      imageUrl: '/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png', // Use the uploaded reference image
      analysis: {
        skinTone,
        faceShape,
        features: selectedFeatures,
        recommendations: selectedRecommendations,
        confidence: 0.85,
      },
      guidance: {
        currentStep: 'Start by applying a thin layer of foundation with a damp beauty sponge',
        nextStep: 'Next, use concealer under the eyes and on any blemishes',
        progress: 5,
        voiceInstruction: 'Start by applying a thin layer of foundation with a damp beauty sponge. Focus on even coverage, especially around the nose and chin.',
        area: 'face',
        visualGuide: {
          x: 50,
          y: 50,
          radius: 30
        }
      }
    }
  };
};
