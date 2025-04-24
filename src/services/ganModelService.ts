
import { supabase } from '@/lib/supabase';

// Types for GAN model integration
export interface GanModel {
  fileName: string;
  downloadUrl: string;
  style: string;
}

export interface GanPredictionResult {
  imageUrl: string;
  facialAnalysis: {
    skinTone: string;
    faceShape: string;
    features: string[];
  };
}

// Cache for avoiding redundant downloads
const modelCache: Record<string, GanModel> = {};
let lastErrorTimestamp = 0;
const ERROR_COOLDOWN = 5000; // 5 seconds between error messages
let simulationMode = false;

/**
 * Get GAN model from Supabase storage using the AI Makeup Manager edge function
 */
export const getGanModel = async (style: string = 'casual_day'): Promise<GanModel | null> => {
  try {
    // Check if we're operating in simulation mode
    if (simulationMode) {
      console.log('Operating in simulation mode, returning mock model data');
      return {
        fileName: 'mock_model.h5',
        downloadUrl: 'https://example.com/mock-model/model.h5',
        style
      };
    }

    // Check cache first
    if (modelCache[style]) {
      console.log('Using cached GAN model for style:', style);
      return modelCache[style];
    }

    console.log('Fetching GAN model for style:', style);
    
    // Call the new AI Makeup Manager edge function to get model info
    const { data, error } = await supabase.functions.invoke('ai-makeup-manager', {
      body: { 
        action: 'get-model',
        modelType: 'gan',
        style
      },
    });

    if (error) {
      console.error('Error fetching GAN model:', error);
      simulationMode = true;
      return {
        fileName: 'mock_model.h5',
        downloadUrl: 'https://example.com/mock-model/model.h5',
        style
      };
    }

    if (data.status !== 'ok' || !data.modelUrl) {
      console.error('Invalid response from ai-makeup-manager function:', data);
      simulationMode = true;
      return {
        fileName: 'mock_model.h5',
        downloadUrl: 'https://example.com/mock-model/model.h5',
        style
      };
    }

    // Get model info from the response
    const fileName = 'makeup_gan_models_final_resized.h5';
    const downloadUrl = data.modelUrl;

    const model: GanModel = {
      fileName,
      downloadUrl,
      style,
    };

    // Cache the model info
    modelCache[style] = model;
    simulationMode = false;
    return model;
  } catch (err) {
    const now = Date.now();
    // Avoid spamming error logs
    if (now - lastErrorTimestamp > ERROR_COOLDOWN) {
      console.error('Error in getGanModel:', err);
      lastErrorTimestamp = now;
    }
    
    simulationMode = true;
    return {
      fileName: 'mock_model.h5',
      downloadUrl: 'https://example.com/mock-model/model.h5',
      style
    };
  }
};

/**
 * Generate makeup using the GAN model via the AI Makeup Manager edge function
 */
export const generateMakeupLook = async (
  faceImageData: string,
  style: string = 'casual_day'
): Promise<GanPredictionResult | null> => {
  try {
    // First get the GAN model
    const model = await getGanModel(style);
    
    if (!model) {
      console.error('Failed to get GAN model');
      return null;
    }

    console.log(`Using GAN model: ${model.fileName} for style: ${style}`);
    
    // Use the AI Makeup Manager edge function for analysis
    const { data, error } = await supabase.functions.invoke('ai-makeup-manager', {
      body: { 
        action: 'analyze-face',
        image: faceImageData,
        lookId: style
      },
    });
    
    if (error) {
      console.error('Error analyzing face image:', error);
      return null;
    }
    
    if (data.status !== 'ok' || !data.result) {
      console.error('Invalid response from analyze-face:', data);
      return null;
    }
    
    // Extract facial analysis from the result
    const { imageUrl, analysis } = data.result;
    
    return {
      imageUrl,
      facialAnalysis: {
        skinTone: analysis.skinTone,
        faceShape: analysis.faceShape,
        features: analysis.features || []
      }
    };
  } catch (err) {
    console.error('Error in generateMakeupLook:', err);
    return null;
  }
};

// Function to check if the AI Makeup Manager edge function is working
export const checkAiMakeupManager = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-makeup-manager', {
      body: { action: 'check-status' },
    });
    
    if (error) {
      console.error('Error checking AI Makeup Manager:', error);
      return false;
    }
    
    return data && data.status === 'ok';
  } catch (err) {
    console.error('Exception checking AI Makeup Manager:', err);
    return false;
  }
};

// Set or check simulation mode
export const setSimulationMode = (enabled?: boolean): boolean => {
  if (enabled !== undefined) {
    simulationMode = enabled;
  }
  return simulationMode;
};

// Request model training
export const trainGanModel = async (trainingData: string[]): Promise<{success: boolean, jobId?: string}> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-makeup-manager', {
      body: { 
        action: 'train-model',
        trainingData
      },
    });
    
    if (error) {
      console.error('Error training GAN model:', error);
      return { success: false };
    }
    
    return { 
      success: data && data.status === 'ok', 
      jobId: data?.jobId
    };
  } catch (err) {
    console.error('Exception training GAN model:', err);
    return { success: false };
  }
};
