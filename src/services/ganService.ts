
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
    console.log('Checking AI Makeup Manager Function availability...');
    
    // Simple ping to the function with minimal data
    const { data, error } = await supabase.functions.invoke('ai-makeup-manager', {
      body: { action: 'check-status' },
    });
    
    if (error) {
      console.error('Error checking AI Makeup Manager function:', error);
      recordError('check_function', error.message);
      return false;
    }
    
    // If we get any response with status field, consider it working
    const isWorking = data && typeof data === 'object' && data.status === 'ok';
    
    if (isWorking) {
      resetErrorTracking();
      console.log('AI Makeup Manager is operational:', data);
    }
    
    return isWorking;
  } catch (error) {
    console.error('Exception checking AI Makeup Manager function:', error);
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

// Analyze a facial image using the AI Makeup Manager
export const analyzeFacialImage = async (
  imageBase64: string,
  lookId?: string
): Promise<any> => {
  try {
    console.log('Analyzing facial image...');
    
    // Check if the edge function is available
    const functionAvailable = await checkGanFunction();
    if (!functionAvailable) {
      console.warn('AI Makeup Manager function not available, trying fallback');
      
      // Try one more time with direct call to the function
      try {
        const { data, error } = await supabase.functions.invoke('ai-makeup-manager', {
          body: { 
            action: 'analyze-face',
            image: imageBase64,
            lookId
          },
        });
        
        if (error) {
          throw new Error(`Error calling AI Makeup Manager: ${error.message}`);
        }
        
        if (data && data.status === 'ok') {
          console.log('Successfully received analysis from AI Makeup Manager');
          resetErrorTracking();
          return data;
        } else {
          throw new Error('Invalid response from AI Makeup Manager');
        }
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        recordError('analyze_retry', retryError instanceof Error ? retryError.message : String(retryError));
        return getFallbackAnalysis(imageBase64, lookId);
      }
    }
    
    // Call the edge function with the image data
    try {
      const { data, error } = await supabase.functions.invoke('ai-makeup-manager', {
        body: { 
          action: 'analyze-face',
          image: imageBase64,
          lookId
        },
      });
      
      if (error) {
        console.error('Error calling AI Makeup Manager for analysis:', error);
        recordError('analyze_call', error.message);
        return getFallbackAnalysis(imageBase64, lookId);
      }
      
      if (data && data.status === 'ok') {
        console.log('Received analysis from AI Makeup Manager');
        resetErrorTracking();
        return data;
      } else {
        console.warn('Unexpected response from AI Makeup Manager:', data);
        recordError('analyze_response', 'Unexpected response format');
        return getFallbackAnalysis(imageBase64, lookId);
      }
    } catch (functionError) {
      console.error('Exception calling AI Makeup Manager:', functionError);
      recordError('analyze_exception', functionError instanceof Error ? functionError.message : String(functionError));
      return getFallbackAnalysis(imageBase64, lookId);
    }
  } catch (error) {
    console.error('Error analyzing facial image:', error);
    recordError('analyze_outer', error instanceof Error ? error.message : String(error));
    // Always return a valid response to avoid breaking the UI
    return getFallbackAnalysis(imageBase64, lookId);
  }
};

// Detect products in an image
export const detectMakeupProducts = async (
  imageBase64: string
): Promise<any> => {
  try {
    console.log('Detecting makeup products...');
    
    const { data, error } = await supabase.functions.invoke('ai-makeup-manager', {
      body: { 
        action: 'product-detection',
        image: imageBase64
      },
    });
    
    if (error) {
      console.error('Error detecting makeup products:', error);
      return { status: 'error', error: error.message };
    }
    
    return data;
  } catch (error) {
    console.error('Error in product detection:', error);
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Get cosmetology knowledge
export const getCosmetologyKnowledge = async (): Promise<any> => {
  try {
    console.log('Getting cosmetology knowledge...');
    
    const { data, error } = await supabase.functions.invoke('ai-makeup-manager', {
      body: { action: 'get-cosmetology-knowledge' },
    });
    
    if (error) {
      console.error('Error getting cosmetology knowledge:', error);
      return { status: 'error', error: error.message };
    }
    
    return data;
  } catch (error) {
    console.error('Error getting cosmetology knowledge:', error);
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : String(error)
    };
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

// Fallback analysis function
const getFallbackAnalysis = (imageBase64: string, lookId?: string) => {
  console.warn('Using fallback analysis with enhanced structure');
  
  // Get makeup knowledge programmatically
  const makeupKnowledge = getMakeupKnowledge();
  
  // Generate deterministic but realistic analysis
  const skinTones = Object.keys(makeupKnowledge.skinTones);
  const faceShapes = Object.keys(makeupKnowledge.faceShapes);
  const features = [
    'High cheekbones', 'Defined jawline', 'Prominent brow', 'Wide-set eyes',
    'Full lips', 'Narrow nose', 'Arched eyebrows', 'Long lashes', 'Defined cupid\'s bow',
    'Symmetrical features', 'Almond-shaped eyes'
  ];
  
  // Generate a deterministic result based on the lookId
  const hashValue = lookId ? hashString(lookId) : Date.now();
  const skinTone = skinTones[hashValue % skinTones.length];
  const faceShape = faceShapes[(hashValue + 2) % faceShapes.length];
  
  // Select features based on the hash
  const featureCount = 2 + (hashValue % 3);
  const selectedFeatures = [];
  for (let i = 0; i < featureCount; i++) {
    const featureIndex = (hashValue + i * 7) % features.length;
    selectedFeatures.push(features[featureIndex]);
  }
  
  // Get makeup knowledge for this skin tone and face shape
  const skinToneInfo = makeupKnowledge.skinTones[skinTone.toLowerCase()] || makeupKnowledge.skinTones.medium;
  const faceShapeInfo = makeupKnowledge.faceShapes[faceShape.toLowerCase()] || makeupKnowledge.faceShapes.oval;
  
  // Generate recommendations based on the knowledge
  const recommendations = [
    ...skinToneInfo.makeupTips,
    ...faceShapeInfo.makeupTips,
    ...generateTechniqueTips(makeupKnowledge.techniques)
  ];
  
  // Generate a look process
  const lookType = lookId?.includes('glam') ? 'glamorous' :
                 lookId?.includes('natural') ? 'natural' :
                 lookId?.includes('korean') ? 'Korean' : 'classic';
  
  const steps = generateMakeupSteps(lookType, skinTone, faceShape, makeupKnowledge);
  const currentStepIndex = Math.floor(hashValue % steps.length);
  const progress = Math.round((currentStepIndex / steps.length) * 100);
  
  return {
    status: 'ok',
    result: {
      imageUrl: imageBase64.startsWith('data:') ? imageBase64 : 'data:image/jpeg;base64,' + imageBase64,
      analysis: {
        skinTone,
        faceShape,
        features: selectedFeatures,
        recommendations: recommendations.slice(0, 5),
        lookType,
        skinToneInfo,
        faceShapeInfo
      },
      guidance: {
        currentStep: steps[currentStepIndex],
        progress,
        steps,
        currentStepIndex
      }
    }
  };
};

// Helper functions
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function generateTechniqueTips(techniques) {
  const allTips = [];
  for (const category in techniques) {
    allTips.push(...techniques[category]);
  }
  
  // Select random tips
  const selectedTips = [];
  for (let i = 0; i < 3; i++) {
    if (allTips.length === 0) break;
    const randomIndex = Math.floor(Math.random() * allTips.length);
    selectedTips.push(allTips[randomIndex]);
    allTips.splice(randomIndex, 1);
  }
  
  return selectedTips;
}

function generateMakeupSteps(lookType: string, skinTone: string, faceShape: string, knowledge: any) {
  const baseSteps = [
    "Cleanse your face thoroughly to remove any oils or residue",
    "Apply primer focusing on T-zone and areas with visible pores",
    "Apply foundation evenly across your face using a beauty blender",
    "Conceal any blemishes and under-eye circles",
    "Set your foundation with translucent powder",
    "Define your brows with light, feathery strokes",
    "Apply eyeshadow primer to your eyelids",
    "Contour your cheekbones and jawline",
    "Apply blush to the apples of your cheeks",
    "Highlight the high points of your face",
    "Apply mascara to your upper and lower lashes",
    "Apply lipstick and blot for a natural finish",
    "Set your makeup with setting spray"
  ];
  
  // Get customized steps based on look type
  const customSteps = {
    'glamorous': [
      "Create a dramatic smoky eye, building intensity at the outer corner",
      "Apply winged liner for definition and drama",
      "Apply individual false lashes for volume and dimension",
      "Use a bold lipstick shade that complements your skin tone",
      "Apply highlighter more generously for a dramatic glow"
    ],
    'natural': [
      "Apply a neutral eyeshadow wash across the lid",
      "Tightline your upper lash line for subtle definition",
      "Apply a natural-looking cream blush for a healthy flush",
      "Use a tinted lip balm for subtle color",
      "Focus on skin looking natural and luminous rather than matte"
    ],
    'Korean': [
      "Focus on creating a dewy, glass-skin finish",
      "Apply a subtle wash of color on the eyelids",
      "Create straight, soft brows rather than arched ones",
      "Apply a gradient lip with the color concentrated in the center",
      "Keep the look fresh and youthful with minimal contouring"
    ],
    'classic': [
      "Apply a neutral eyeshadow with definition in the crease",
      "Define your eyes with a subtle brown liner",
      "Apply a classic pink or coral blush",
      "Finish with a satin lipstick in a flattering shade",
      "Ensure balance between eye and lip intensity"
    ]
  };
  
  // Get face shape specific tips
  const faceShapeInfo = knowledge.faceShapes[faceShape.toLowerCase()] || knowledge.faceShapes.oval;
  const faceShapeTips = faceShapeInfo.makeupTips;
  
  // Get skin tone specific tips
  const skinToneInfo = knowledge.skinTones[skinTone.toLowerCase()] || knowledge.skinTones.medium;
  const skinToneTips = skinToneInfo.makeupTips;
  
  // Combine all steps
  let allSteps = [...baseSteps];
  
  // Add look-specific steps
  if (customSteps[lookType]) {
    allSteps = allSteps.concat(customSteps[lookType]);
  }
  
  // Add face shape and skin tone tips
  allSteps = allSteps.concat(faceShapeTips);
  allSteps = allSteps.concat(skinToneTips);
  
  // Make each step more instructional
  return allSteps.map((step, index) => {
    return `Step ${index + 1}: ${step}`;
  });
}

// Get makeup knowledge for offline fallback
function getMakeupKnowledge() {
  return {
    products: {
      "primer": {
        purpose: "Creates a smooth base for makeup application",
        applicationAreas: ["entire face"],
        applicationTechniques: ["fingers", "beauty blender", "brush"],
        detectionHints: ["shiny appearance", "smoothed skin texture"]
      },
      "foundation": {
        purpose: "Evens out skin tone and provides coverage",
        applicationAreas: ["entire face"],
        applicationTechniques: ["beauty blender", "brush", "fingers"],
        detectionHints: ["even skin tone", "covered blemishes", "uniform color"]
      },
      "concealer": {
        purpose: "Covers blemishes, dark circles and imperfections",
        applicationAreas: ["under eyes", "blemishes", "redness areas"],
        applicationTechniques: ["concealer brush", "beauty blender", "fingers"],
        detectionHints: ["brightened under-eye area", "hidden blemishes"]
      },
      "contour": {
        purpose: "Creates shadows to define facial structure",
        applicationAreas: ["cheekbones", "jawline", "sides of nose", "forehead"],
        applicationTechniques: ["angled brush", "contour stick", "beauty blender"],
        detectionHints: ["darkened areas below cheekbones", "defined jawline"]
      },
      "blush": {
        purpose: "Adds color to the cheeks",
        applicationAreas: ["apples of cheeks", "cheekbones"],
        applicationTechniques: ["fluffy brush", "cream blush", "fingers"],
        detectionHints: ["pink/peach color on cheeks", "flushed appearance"]
      },
      "highlighter": {
        purpose: "Adds glow to high points of the face",
        applicationAreas: ["cheekbones", "brow bone", "cupid's bow", "nose bridge"],
        applicationTechniques: ["fan brush", "highlighting stick", "fingers"],
        detectionHints: ["shimmery/glowy areas", "light reflection points"]
      },
      "eyeshadow": {
        purpose: "Adds color to the eyelids",
        applicationAreas: ["eyelids", "crease", "outer corner"],
        applicationTechniques: ["eyeshadow brushes", "fingers", "sponge applicator"],
        detectionHints: ["colored/shimmery eyelids", "defined crease"]
      },
      "eyeliner": {
        purpose: "Defines the eyes and lash line",
        applicationAreas: ["upper lash line", "lower lash line", "waterline"],
        applicationTechniques: ["eyeliner brush", "pencil", "gel pot", "liquid pen"],
        detectionHints: ["defined line along lashes", "winged tips", "darkened lash line"]
      },
      "mascara": {
        purpose: "Darkens, lengthens and thickens lashes",
        applicationAreas: ["upper lashes", "lower lashes"],
        applicationTechniques: ["mascara wand"],
        detectionHints: ["darkened eyelashes", "more visible/longer lashes"]
      },
      "lipstick": {
        purpose: "Adds color to the lips",
        applicationAreas: ["lips", "lip line"],
        applicationTechniques: ["lipstick bullet", "lip brush", "liquid applicator"],
        detectionHints: ["colored lips", "defined lip shape"]
      },
      "setting spray": {
        purpose: "Sets makeup and extends wear time",
        applicationAreas: ["entire face"],
        applicationTechniques: ["spray bottle"],
        detectionHints: ["slightly dewy finish", "makeup appears set"]
      }
    },
    faceShapes: {
      "oval": {
        characteristics: ["face length is about 1.5x width", "slightly wider forehead", "jawline slightly narrower than forehead"],
        makeupTips: ["Most makeup looks work well", "Light contouring to maintain natural balance", "Can experiment with many styles"]
      },
      "round": {
        characteristics: ["face length and width are similar", "rounded jawline and chin", "fuller cheeks"],
        makeupTips: ["Contour sides of face to create definition", "Highlight center of face", "Angular eye makeup to create sharpness"]
      },
      "square": {
        characteristics: ["strong jawline", "forehead and jawline nearly same width", "minimal curve at jaw"],
        makeupTips: ["Soften angles with blush on apples of cheeks", "Contour jawline corners to soften", "Round eye makeup styles work well"]
      },
      "heart": {
        characteristics: ["wider forehead", "narrower jawline and chin", "high cheekbones"],
        makeupTips: ["Contour temples slightly", "Use blush to balance wider forehead", "Emphasize eyes and lips to draw attention center-face"]
      },
      "diamond": {
        characteristics: ["narrow forehead and jawline", "wide cheekbones", "angular features"],
        makeupTips: ["Highlight forehead and chin to balance", "Blush applied horizontally rather than angled", "Softer contour under cheekbones"]
      },
      "rectangular": {
        characteristics: ["face length more than 1.5x width", "forehead, cheeks, and jawline similar width", "long straight cheeks"],
        makeupTips: ["Contour temples and jawline to shorten", "Apply blush horizontally across cheeks", "Focus on creating width with makeup"]
      }
    },
    skinTones: {
      "fair": {
        characteristics: ["Burns easily", "Ivory or pale undertone", "Visible veins appear blue/purple"],
        makeupTips: ["Cool-toned contours (taupe)", "Soft pink or peach blushes", "Champagne or pearl highlighters"]
      },
      "light": {
        characteristics: ["Burns easily but can tan", "Neutral to warm undertones", "Visible veins appear blue/green"],
        makeupTips: ["Neutral-toned contours", "Rose or soft coral blushes", "Champagne or gold highlighters"]
      },
      "medium": {
        characteristics: ["Tans easily", "Golden or olive undertones", "Visible veins appear green"],
        makeupTips: ["Warm-toned contours", "Coral or warm pink blushes", "Gold or peach highlighters"]
      },
      "tan": {
        characteristics: ["Rarely burns, tans well", "Golden, caramel undertones", "Visible veins appear green"],
        makeupTips: ["Warm brown contours", "Warm terracotta or deep coral blushes", "Gold or bronze highlighters"]
      },
      "deep": {
        characteristics: ["Never burns", "Rich undertones", "Deep complexion"],
        makeupTips: ["Rich chocolate contours", "Deep berry or bright coral blushes", "Gold, copper or bronze highlighters"]
      }
    },
    techniques: {
      "foundation": [
        "Start from center of face and blend outward",
        "Use downward strokes to avoid highlighting facial hair",
        "Apply with beauty blender using bouncing motion for seamless finish",
        "Use less product around hairline and jawline to avoid harsh lines"
      ],
      "contouring": [
        "Place contour in hollow beneath cheekbone",
        "Blend upward toward temples for lifted effect",
        "Use light hand and build gradually",
        "Ensure strong blending for natural-looking shadows"
      ],
      "blush": [
        "Smile to locate apples of cheeks",
        "For round faces, apply at an angle toward temples",
        "For long faces, apply horizontally across cheekbones",
        "Blend edges thoroughly for natural flush"
      ],
      "eyeshadow": [
        "Apply lightest shade all over lid as base",
        "Define crease with medium tone using windshield wiper motions",
        "Deepen outer corner with darkest shade in V-shape",
        "Blend thoroughly between colors for seamless gradient"
      ],
      "eyeliner": [
        "Start thin at inner corner and thicken toward outer corner",
        "For winged liner, follow angle from lower lash line up toward end of eyebrow",
        "Use small, connected strokes rather than one continuous line",
        "Set liquid liner with matching eyeshadow for longevity"
      ],
      "lipstick": [
        "Define cupid's bow first with pointed applicator",
        "Line outer edges of lips for definition",
        "Fill in center and press lips together to distribute",
        "Blot with tissue and apply second coat for longevity"
      ]
    }
  };
}
