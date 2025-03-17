
import { supabase } from '@/lib/supabase';

// Check if the GAN function is available and working
export const checkGanFunction = async (): Promise<boolean> => {
  try {
    console.log('Checking GAN Edge Function availability...');
    
    // Simple ping to the function with minimal data
    const { data, error } = await supabase.functions.invoke('get-gan-model', {
      body: { style: 'ping_test' },
    });
    
    if (error) {
      console.error('Error checking GAN function:', error);
      return false;
    }
    
    // If we get any response with status field, consider it working
    return data && typeof data === 'object' && 'status' in data;
  } catch (error) {
    console.error('Exception checking GAN function:', error);
    return false;
  }
};

// Analyze a facial image using the GAN model
export const analyzeFacialImage = async (
  imageBase64: string,
  lookId?: string
): Promise<any> => {
  try {
    console.log('Analyzing facial image...');
    
    // First check if the edge function is available
    const functionAvailable = await checkGanFunction();
    if (!functionAvailable) {
      console.warn('GAN function not available, using mock data');
      return mockAnalysisResponse(imageBase64);
    }
    
    // Try to call the edge function with the image data
    try {
      const { data, error } = await supabase.functions.invoke('get-gan-model', {
        body: { 
          action: 'analyze',
          image: imageBase64,
          lookId
        },
      });
      
      if (error) {
        console.error('Error calling GAN function for analysis:', error);
        return mockAnalysisResponse(imageBase64);
      }
      
      if (data && data.status === 'ok') {
        console.log('Received analysis from GAN function');
        return data;
      } else {
        console.warn('Unexpected response from GAN function:', data);
        return mockAnalysisResponse(imageBase64);
      }
    } catch (functionError) {
      console.error('Exception calling GAN function:', functionError);
      return mockAnalysisResponse(imageBase64);
    }
  } catch (error) {
    console.error('Error analyzing facial image:', error);
    // Always return a valid response to avoid breaking the UI
    return mockAnalysisResponse(imageBase64);
  }
};

// Create a mock analysis response for development
const mockAnalysisResponse = (imageBase64: string) => {
  // Mock facial analysis result
  const skinTones = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep'];
  const faceShapes = ['Oval', 'Round', 'Heart', 'Square', 'Diamond', 'Rectangle'];
  const features = [
    'High cheekbones', 'Defined jawline', 'Prominent brow', 'Wide-set eyes', 
    'Full lips', 'Narrow nose', 'Arched eyebrows'
  ];
  
  const recommendations = [
    'Use warm-toned foundation to complement your skin undertones',
    'Apply bronzer along the temples and jawline to define your face shape',
    'Define your brows with a slightly angled shape',
    'Try a cream blush on the apples of your cheeks for a natural flush',
    'Apply highlighter to your cheekbones to enhance your facial structure',
    'Use a lip liner to define your natural lip shape',
    'Apply eyeshadow in a gradient from light to dark for depth'
  ];
  
  // Randomly select values for demonstration
  const skinTone = skinTones[Math.floor(Math.random() * skinTones.length)];
  const faceShape = faceShapes[Math.floor(Math.random() * faceShapes.length)];
  
  const selectedFeatures = [];
  const featureCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < featureCount; i++) {
    const feature = features[Math.floor(Math.random() * features.length)];
    if (!selectedFeatures.includes(feature)) {
      selectedFeatures.push(feature);
    }
  }
  
  const selectedRecommendations = [];
  const recCount = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < recCount; i++) {
    const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
    if (!selectedRecommendations.includes(rec)) {
      selectedRecommendations.push(rec);
    }
  }
  
  // Mock guidance steps
  const currentStep = "Let's start by applying foundation to create an even base.";
  const progress = 10;
  
  return {
    status: 'ok',
    result: {
      imageUrl: imageBase64.startsWith('data:') ? imageBase64 : 'data:image/jpeg;base64,' + imageBase64,
      analysis: {
        skinTone,
        faceShape,
        features: selectedFeatures,
        recommendations: selectedRecommendations
      },
      guidance: {
        currentStep,
        progress
      }
    }
  };
};
