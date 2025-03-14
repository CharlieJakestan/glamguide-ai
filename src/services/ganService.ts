
import { supabase } from '@/lib/supabase';

export interface GanGenerateRequest {
  action: 'generate' | 'analyze' | 'check';
  image?: string; // base64 encoded image for analysis
  parameters?: {
    skinTone?: 'light' | 'medium' | 'dark';
    faceShape?: 'oval' | 'round' | 'square' | 'heart';
    style?: 'natural' | 'dramatic' | 'glam' | 'minimalist';
    products?: string[]; // IDs or names of products to use
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
    };
    guidance?: {
      currentStep?: string;
      nextStep?: string;
      progress?: number; // 0-100
      voiceInstruction?: string;
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
export const generateMakeupLook = async (parameters: GanGenerateRequest['parameters']): Promise<GanGenerateResponse | null> => {
  try {
    const { data, error } = await supabase.functions.invoke<GanGenerateResponse>('gan-generate', {
      body: {
        action: 'generate',
        parameters
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
export const analyzeFacialImage = async (imageBase64: string): Promise<GanGenerateResponse | null> => {
  try {
    const { data, error } = await supabase.functions.invoke<GanGenerateResponse>('gan-generate', {
      body: {
        action: 'analyze',
        image: imageBase64
      }
    });
    
    if (error) {
      console.error('Error analyzing facial image:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception analyzing facial image:', error);
    return null;
  }
};
