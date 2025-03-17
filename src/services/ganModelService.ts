
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
 * Get GAN model from Supabase storage using the Edge Function
 * This uses the hardcoded file list approach to avoid the list() method issue
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
    
    // Call the Edge Function to get model info and signed URLs
    const { data, error } = await supabase.functions.invoke('get-gan-model', {
      body: { style },
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

    if (data.status !== 'ok' || !data.files || !data.downloadUrls) {
      console.error('Invalid response from get-gan-model function:', data);
      simulationMode = true;
      return {
        fileName: 'mock_model.h5',
        downloadUrl: 'https://example.com/mock-model/model.h5',
        style
      };
    }

    // For this example, we'll just use the first file
    const fileName = data.files[0];
    const downloadUrl = data.downloadUrls[fileName];

    if (!downloadUrl) {
      console.error('No download URL provided for file:', fileName);
      simulationMode = true;
      return {
        fileName: 'mock_model.h5',
        downloadUrl: 'https://example.com/mock-model/model.h5',
        style
      };
    }

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
 * Generate makeup using the GAN model
 * In a real implementation, this would send the face image to a backend service
 * that applies the GAN model. For now, we'll use a mock implementation.
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
      return getMockPrediction(faceImageData);
    }

    console.log(`Using GAN model: ${model.fileName} for style: ${style}`);
    
    // Check if we're in simulation mode
    if (simulationMode || model.fileName === 'mock_model.h5') {
      console.log('Using simulation mode for makeup generation');
      return getMockPrediction(faceImageData);
    }
    
    // In a real implementation, we would use the model to generate makeup
    // For now, return mock data
    return getMockPrediction(faceImageData);
  } catch (err) {
    console.error('Error in generateMakeupLook:', err);
    return getMockPrediction(faceImageData);
  }
};

// Helper function to get mock prediction
const getMockPrediction = (faceImageData: string): GanPredictionResult => {
  const mockSkinTones = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep'];
  const mockFaceShapes = ['Oval', 'Round', 'Heart', 'Square', 'Diamond', 'Rectangle'];
  const mockFeatures = [
    'High cheekbones', 'Defined jawline', 'Prominent brow', 'Wide-set eyes',
    'Full lips', 'Narrow nose', 'Arched eyebrows', 'Defined cupid\'s bow'
  ];

  // Mock random selection for demo
  const skinTone = mockSkinTones[Math.floor(Math.random() * mockSkinTones.length)];
  const faceShape = mockFaceShapes[Math.floor(Math.random() * mockFaceShapes.length)];
  
  // Select 2-4 random features
  const featureCount = 2 + Math.floor(Math.random() * 3);
  const selectedFeatures = [];
  const shuffledFeatures = [...mockFeatures].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < featureCount; i++) {
    selectedFeatures.push(shuffledFeatures[i]);
  }

  return {
    imageUrl: faceImageData,
    facialAnalysis: {
      skinTone,
      faceShape,
      features: selectedFeatures
    }
  };
};
