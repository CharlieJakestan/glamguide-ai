
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

/**
 * Get GAN model from Supabase storage using the Edge Function
 * This uses the hardcoded file list approach to avoid the list() method issue
 */
export const getGanModel = async (style: string = 'casual_day'): Promise<GanModel | null> => {
  try {
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
      return null;
    }

    if (data.status !== 'ok' || !data.files || !data.downloadUrls) {
      console.error('Invalid response from get-gan-model function:', data);
      return null;
    }

    // For this example, we'll just use the first file
    const fileName = data.files[0];
    const downloadUrl = data.downloadUrls[fileName];

    const model: GanModel = {
      fileName,
      downloadUrl,
      style,
    };

    // Cache the model info
    modelCache[style] = model;
    return model;
  } catch (err) {
    const now = Date.now();
    // Avoid spamming error logs
    if (now - lastErrorTimestamp > ERROR_COOLDOWN) {
      console.error('Error in getGanModel:', err);
      lastErrorTimestamp = now;
    }
    return null;
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
      return null;
    }

    console.log(`Using GAN model: ${model.fileName} for style: ${style}`);
    
    // Here we would normally send the face image and model info to a backend service
    // that would apply the GAN model and return the result. For now, we'll use a mock.
    
    // Mock facial analysis result (in a real implementation, this would come from the model)
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

    // For now, just return the original image with the analysis
    // In a real implementation, we would apply the GAN model to transform the image
    return {
      imageUrl: faceImageData, // Would be the transformed image in a real implementation
      facialAnalysis: {
        skinTone,
        faceShape,
        features: selectedFeatures
      }
    };
  } catch (err) {
    console.error('Error in generateMakeupLook:', err);
    return null;
  }
};
