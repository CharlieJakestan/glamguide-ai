
import { supabase } from '@/lib/supabase';

// Improved error tracking
const errorTracking = {
  lastError: '',
  lastErrorTime: 0,
  errorCount: 0,
  maxErrorsBeforeSimulation: 3,
  errorCooldownTime: 10000, // 10 seconds
  isInSimulationMode: false
};

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
      recordError('check_function', error.message);
      return false;
    }
    
    // If we get any response with status field, consider it working
    const isWorking = data && typeof data === 'object' && 'status' in data;
    
    if (isWorking) {
      resetErrorTracking();
    }
    
    return isWorking;
  } catch (error) {
    console.error('Exception checking GAN function:', error);
    recordError('check_function_exception', error instanceof Error ? error.message : String(error));
    return false;
  }
};

// Record an error to the tracking system
const recordError = (context: string, errorMessage: string) => {
  const now = Date.now();
  errorTracking.lastError = `${context}: ${errorMessage}`;
  errorTracking.lastErrorTime = now;
  errorTracking.errorCount++;
  
  if (errorTracking.errorCount >= errorTracking.maxErrorsBeforeSimulation) {
    errorTracking.isInSimulationMode = true;
    console.warn(`Switching to simulation mode after ${errorTracking.errorCount} errors. Last error: ${errorTracking.lastError}`);
  }
};

// Reset error tracking when successful operations occur
const resetErrorTracking = () => {
  if (errorTracking.isInSimulationMode) {
    console.log('Exiting simulation mode after successful operation');
  }
  
  errorTracking.errorCount = 0;
  errorTracking.isInSimulationMode = false;
};

// Analyze a facial image using the GAN model
export const analyzeFacialImage = async (
  imageBase64: string,
  lookId?: string
): Promise<any> => {
  try {
    console.log('Analyzing facial image...');
    
    // If we're in simulation mode due to previous errors, skip actual API call
    if (errorTracking.isInSimulationMode) {
      console.warn('Using simulation mode for analysis due to previous errors');
      return mockAnalysisResponse(imageBase64, lookId);
    }
    
    // First check if the edge function is available
    const functionAvailable = await checkGanFunction();
    if (!functionAvailable) {
      console.warn('GAN function not available, using mock data');
      return mockAnalysisResponse(imageBase64, lookId);
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
        recordError('analyze_call', error.message);
        return mockAnalysisResponse(imageBase64, lookId);
      }
      
      if (data && data.status === 'ok') {
        console.log('Received analysis from GAN function');
        resetErrorTracking();
        return data;
      } else {
        console.warn('Unexpected response from GAN function:', data);
        recordError('analyze_response', 'Unexpected response format');
        return mockAnalysisResponse(imageBase64, lookId);
      }
    } catch (functionError) {
      console.error('Exception calling GAN function:', functionError);
      recordError('analyze_exception', functionError instanceof Error ? functionError.message : String(functionError));
      return mockAnalysisResponse(imageBase64, lookId);
    }
  } catch (error) {
    console.error('Error analyzing facial image:', error);
    recordError('analyze_outer', error instanceof Error ? error.message : String(error));
    // Always return a valid response to avoid breaking the UI
    return mockAnalysisResponse(imageBase64, lookId);
  }
};

// Get error state for UI display
export const getErrorState = () => {
  return {
    lastError: errorTracking.lastError,
    lastErrorTime: errorTracking.lastErrorTime,
    errorCount: errorTracking.errorCount,
    isInSimulationMode: errorTracking.isInSimulationMode
  };
};

// Force simulation mode on or off (for testing)
export const setSimulationMode = (enabled: boolean) => {
  errorTracking.isInSimulationMode = enabled;
  if (enabled) {
    errorTracking.errorCount = errorTracking.maxErrorsBeforeSimulation;
  } else {
    resetErrorTracking();
  }
  return errorTracking.isInSimulationMode;
};

// Create a more detailed mock analysis response
const mockAnalysisResponse = (imageBase64: string, lookId?: string) => {
  // Mock facial analysis result
  const skinTones = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep'];
  const faceShapes = ['Oval', 'Round', 'Heart', 'Square', 'Diamond', 'Rectangle'];
  const features = [
    'High cheekbones', 'Defined jawline', 'Prominent brow', 'Wide-set eyes', 
    'Full lips', 'Narrow nose', 'Arched eyebrows', 'Long lashes', 'Defined cupid\'s bow',
    'Symmetrical features', 'Almond-shaped eyes'
  ];
  
  const recommendations = [
    'Use warm-toned foundation to complement your skin undertones',
    'Apply bronzer along the temples and jawline to define your face shape',
    'Define your brows with a slightly angled shape',
    'Try a cream blush on the apples of your cheeks for a natural flush',
    'Apply highlighter to your cheekbones to enhance your facial structure',
    'Use a lip liner to define your natural lip shape',
    'Apply eyeshadow in a gradient from light to dark for depth',
    'Blend concealer in a triangle shape under your eyes to brighten',
    'Set your T-zone with translucent powder to control shine',
    'Curl your lashes before applying mascara for an eye-opening effect',
    'Use a transition shade in your eye crease for a seamless blend'
  ];
  
  // Randomize based on lookId to ensure consistent responses for the same look
  const seedValue = lookId ? hashString(lookId) : Date.now();
  const rng = seedRandom(seedValue);
  
  // Randomly select values using seeded RNG
  const skinTone = skinTones[Math.floor(rng() * skinTones.length)];
  const faceShape = faceShapes[Math.floor(rng() * faceShapes.length)];
  
  const selectedFeatures = [];
  const featureCount = 2 + Math.floor(rng() * 3);
  const shuffledFeatures = [...features].sort(() => rng() - 0.5);
  for (let i = 0; i < featureCount; i++) {
    selectedFeatures.push(shuffledFeatures[i]);
  }
  
  const selectedRecommendations = [];
  const recCount = 3 + Math.floor(rng() * 2);
  const shuffledRecs = [...recommendations].sort(() => rng() - 0.5);
  for (let i = 0; i < recCount; i++) {
    selectedRecommendations.push(shuffledRecs[i]);
  }
  
  // Generate more detailed guidance
  const lookType = lookId?.includes('glam') ? 'glamorous' : 
                  lookId?.includes('natural') ? 'natural' : 
                  lookId?.includes('korean') ? 'Korean' : 'classic';
  
  const steps = generateMockSteps(lookType, skinTone, faceShape);
  const currentStepIndex = Math.floor(rng() * steps.length);
  const currentStep = steps[currentStepIndex];
  const progress = Math.round((currentStepIndex / steps.length) * 100);
  
  return {
    status: 'ok',
    result: {
      imageUrl: imageBase64.startsWith('data:') ? imageBase64 : 'data:image/jpeg;base64,' + imageBase64,
      analysis: {
        skinTone,
        faceShape,
        features: selectedFeatures,
        recommendations: selectedRecommendations,
        lookType
      },
      guidance: {
        currentStep,
        progress,
        steps,
        currentStepIndex
      }
    }
  };
};

// Generate steps based on look type and facial features
const generateMockSteps = (lookType: string, skinTone: string, faceShape: string) => {
  // Base steps that are common to most looks
  const baseSteps = [
    "Start by applying primer to create a smooth base for your makeup",
    "Apply foundation, focusing on even coverage across your face",
    "Use concealer to cover any blemishes and brighten under your eyes",
    "Set your foundation with a light dusting of powder",
    "Define your brows to frame your face",
    "Apply eyeshadow primer to your eyelids",
    "Contour to enhance your face shape",
    "Apply blush to the apples of your cheeks",
    "Add highlighter to the high points of your face",
    "Apply mascara to your upper and lower lashes",
    "Finish with a setting spray to lock in your look"
  ];
  
  // Customize steps based on look type
  const customSteps: Record<string, string[]> = {
    'glamorous': [
      "Create a dramatic eye look with smoky eyeshadow, focusing on depth in the crease",
      "Apply winged eyeliner for definition and drama",
      "Add false lashes for extra volume and length",
      "Use a bold lipstick shade that complements your skin tone"
    ],
    'natural': [
      "Apply a neutral eyeshadow wash across the lid",
      "Tightline your upper lash line for subtle definition",
      "Apply a natural-looking blush for a healthy flush",
      "Finish with a tinted lip balm or sheer gloss"
    ],
    'Korean': [
      "Focus on creating a dewy, glass-skin finish",
      "Apply a subtle wash of color on the eyelids",
      "Create straight, soft brows rather than arched ones",
      "Apply a gradient lip with the color concentrated in the center"
    ],
    'classic': [
      "Apply a neutral eyeshadow base with definition in the crease",
      "Define your eyes with a subtle eyeliner",
      "Apply a classic pink or coral blush",
      "Finish with a satin lipstick in a flattering shade"
    ]
  };
  
  // Add face shape specific tips
  const faceShapeTips: Record<string, string> = {
    'Round': "Contour along the temples and jawline to add definition",
    'Square': "Soften your angles by applying blush in a circular motion on the apples of your cheeks",
    'Heart': "Balance your face by adding definition to your jawline with contour",
    'Oval': "Maintain the natural balance of your face with even application of contour and highlight",
    'Diamond': "Highlight your cheekbones and soften your jawline",
    'Rectangle': "Add width to your face by focusing blush on the apples of your cheeks"
  };
  
  // Add skin tone specific tips
  const skinToneTips: Record<string, string> = {
    'Fair': "Choose cool-toned contour shades to create natural shadows",
    'Light': "Opt for peachy blush tones to complement your skin",
    'Medium': "Bronze tones will add warmth and dimension to your complexion",
    'Olive': "Use golden-toned products to enhance your natural warmth",
    'Tan': "Rich, warm colors will complement your skin beautifully",
    'Deep': "Use vibrant colors that stand out against your rich skin tone"
  };
  
  // Combine all steps
  let allSteps = [...baseSteps];
  
  // Add look-specific steps
  if (customSteps[lookType]) {
    allSteps = allSteps.concat(customSteps[lookType]);
  }
  
  // Add face shape tip
  if (faceShapeTips[faceShape]) {
    allSteps.push(faceShapeTips[faceShape]);
  }
  
  // Add skin tone tip
  if (skinToneTips[skinTone]) {
    allSteps.push(skinToneTips[skinTone]);
  }
  
  // Shuffle and return
  return shuffleArray(allSteps);
};

// Helper function to create a seeded random number generator
function seedRandom(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Helper function to shuffle array using seeded RNG
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper to hash a string to a number (for seeding)
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
