import { supabase } from '@/lib/supabase';

// Define makeup style characteristics by region
const REGIONAL_STYLES = {
  'usa': {
    'natural': 'Focuses on enhancing features with neutral tones, defined but natural-looking brows, and subtle contouring.',
    'glam': 'Bold eye makeup with winged liner, voluminous lashes, strong contour, and often matte finish.',
    'technique': 'Build coverage gradually, focus on blending for seamless transitions.'
  },
  'korean': {
    'natural': 'Dewy skin, subtle eye makeup with soft brown shadows, straight brows, and gradient lips.',
    'glam': 'Glass skin, shimmer on eyes, puppy liner, and glossy gradient lips.',
    'technique': 'Layer thin products, pat rather than swipe, focus on luminous finish.'
  },
  'indian': {
    'natural': 'Defined eyes with kajal, warm tones, and natural-looking lips.',
    'glam': 'Bold and colorful eye makeup, strong brows, defined contour, and rich lip colors.',
    'technique': 'Build intensity with layering, focus on eye definition.'
  },
  'european': {
    'natural': 'Subtle enhancement with focus on complexion, minimal eye makeup, and natural lips.',
    'glam': 'Smoky eyes, sculpted features, and defined lips.',
    'technique': 'Precision application, strategic placement of products.'
  }
};

// Product substitution recommendations
const PRODUCT_SUBSTITUTIONS = {
  'foundation': ['tinted moisturizer', 'bb cream', 'cc cream', 'concealer'],
  'lipstick': ['lip tint', 'lip gloss', 'lip crayon', 'lip liner'],
  'eyeshadow': ['eye crayon', 'eyeliner', 'bronzer', 'eyebrow powder'],
  'blush': ['lipstick', 'tinted lip balm', 'bronzer'],
  'mascara': ['eyeliner', 'brow gel'],
  'highlighter': ['shimmer eyeshadow', 'illuminating primer'],
  'bronzer': ['matte brown eyeshadow', 'contour powder'],
  'eyeliner': ['dark eyeshadow', 'brow pencil']
};

export interface FaceAnalysisResult {
  regions: {
    [key: string]: {
      coverage: number; // 0-1 scale
      intensity: number; // 0-1 scale
      blending: number; // 0-1 scale
      placement: 'good' | 'too high' | 'too low' | 'too centered' | 'too outer';
      colorMatch: boolean;
    }
  };
  overallProgress: number; // 0-1 scale
  nextStep?: string;
  feedback: string[];
}

export interface MakeupGuidance {
  instruction: string;
  voiceInstruction: string;
  regionOfFocus?: string;
  visualGuide?: {
    x: number;
    y: number;
    radius: number;
  }
}

// Mock analysis function - in a real implementation, this would call an AI API
export const analyzeFaceMakeup = async (
  imageData: ImageData, 
  targetLook: string,
  region: 'usa' | 'korean' | 'indian' | 'european',
  currentStep: number
): Promise<FaceAnalysisResult> => {
  // In a real implementation, we would send the image data to an AI service
  // For now, return simulated analysis based on the step
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simple mock analysis
  const mockAnalysis: FaceAnalysisResult = {
    regions: {
      'eyes': {
        coverage: Math.random() * 0.7 + 0.3,
        intensity: Math.random() * 0.6 + 0.2,
        blending: Math.random() * 0.8 + 0.1,
        placement: Math.random() > 0.7 ? 'too high' : 'good',
        colorMatch: Math.random() > 0.3
      },
      'lips': {
        coverage: Math.random() * 0.8 + 0.2,
        intensity: Math.random() * 0.7 + 0.3,
        blending: Math.random() * 0.5 + 0.5,
        placement: 'good',
        colorMatch: Math.random() > 0.2
      },
      'cheeks': {
        coverage: Math.random() * 0.6 + 0.2,
        intensity: Math.random() * 0.5 + 0.1,
        blending: Math.random() * 0.7 + 0.3,
        placement: Math.random() > 0.6 ? 'too outer' : 'good',
        colorMatch: Math.random() > 0.4
      }
    },
    overallProgress: Math.min(currentStep * 0.2, 0.9),
    feedback: []
  };
  
  // Generate feedback based on analysis
  Object.entries(mockAnalysis.regions).forEach(([region, analysis]) => {
    if (analysis.coverage < 0.4) {
      mockAnalysis.feedback.push(`Apply more product to the ${region} area`);
    }
    if (analysis.intensity > 0.8) {
      mockAnalysis.feedback.push(`The ${region} makeup is too intense, try blending more`);
    }
    if (analysis.blending < 0.5) {
      mockAnalysis.feedback.push(`Blend the ${region} area more thoroughly`);
    }
    if (analysis.placement !== 'good') {
      mockAnalysis.feedback.push(`Adjust the placement of your ${region} makeup - it's ${analysis.placement}`);
    }
    if (!analysis.colorMatch) {
      mockAnalysis.feedback.push(`The color on your ${region} doesn't match the selected style`);
    }
  });
  
  // Add technique tips based on regional style
  if (REGIONAL_STYLES[region]) {
    mockAnalysis.feedback.push(`Tip: ${REGIONAL_STYLES[region].technique}`);
  }
  
  return mockAnalysis;
};

export const generateNextStepGuidance = (
  analysis: FaceAnalysisResult,
  targetLook: string,
  region: 'usa' | 'korean' | 'indian' | 'european',
  availableProducts: string[]
): MakeupGuidance => {
  // Determine the next area to focus on based on analysis
  let lowestProgressRegion = '';
  let lowestProgress = 1;
  
  Object.entries(analysis.regions).forEach(([region, regionAnalysis]) => {
    const regionProgress = (regionAnalysis.coverage + regionAnalysis.blending + (regionAnalysis.placement === 'good' ? 1 : 0)) / 3;
    if (regionProgress < lowestProgress) {
      lowestProgress = regionProgress;
      lowestProgressRegion = region;
    }
  });
  
  // If all regions are progressing well, focus on overall improvement
  if (lowestProgress > 0.7 || !lowestProgressRegion) {
    const overallGuidance: MakeupGuidance = {
      instruction: "Your makeup application is progressing well! Focus on final touches and blending for a seamless finish.",
      voiceInstruction: "Your makeup is looking good! Now focus on blending all areas for a seamless finish."
    };
    return overallGuidance;
  }
  
  // Generate region-specific guidance
  const regionAnalysis = analysis.regions[lowestProgressRegion];
  let instruction = '';
  let voiceInstruction = '';
  
  // Specific guidance based on the region and its analysis
  if (regionAnalysis.coverage < 0.5) {
    instruction = `Apply more product to the ${lowestProgressRegion} area. `;
    voiceInstruction = `Please apply more product to your ${lowestProgressRegion}. `;
  } else if (regionAnalysis.blending < 0.6) {
    instruction = `Focus on blending the ${lowestProgressRegion} more thoroughly. `;
    voiceInstruction = `Now blend your ${lowestProgressRegion} more thoroughly for a seamless finish. `;
  } else if (regionAnalysis.placement !== 'good') {
    instruction = `Adjust the placement of your ${lowestProgressRegion} makeup - it appears ${regionAnalysis.placement}. `;
    voiceInstruction = `The placement of your ${lowestProgressRegion} makeup is ${regionAnalysis.placement}. Please adjust it. `;
  }
  
  // Add regional technique tip
  if (REGIONAL_STYLES[region]) {
    instruction += `Remember: ${REGIONAL_STYLES[region].technique}`;
    voiceInstruction += `Remember, for ${region} style makeup: ${REGIONAL_STYLES[region].technique}`;
  }
  
  return {
    instruction,
    voiceInstruction,
    regionOfFocus: lowestProgressRegion,
    visualGuide: {
      x: Math.random() * 100,  // These would be actual coordinates in a real implementation
      y: Math.random() * 100,
      radius: 20
    }
  };
};

export const suggestProductSubstitutions = (
  requiredProducts: string[],
  availableProducts: string[]
): Record<string, string[]> => {
  const missingProducts = requiredProducts.filter(p => !availableProducts.includes(p));
  const substitutions: Record<string, string[]> = {};
  
  missingProducts.forEach(product => {
    const productType = Object.keys(PRODUCT_SUBSTITUTIONS).find(type => 
      product.toLowerCase().includes(type.toLowerCase())
    );
    
    if (productType && PRODUCT_SUBSTITUTIONS[productType]) {
      // Filter substitutions to only recommend products the user has
      const possibleSubstitutes = PRODUCT_SUBSTITUTIONS[productType].filter(
        substitute => availableProducts.some(p => p.toLowerCase().includes(substitute.toLowerCase()))
      );
      
      if (possibleSubstitutes.length > 0) {
        substitutions[product] = possibleSubstitutes;
      }
    }
  });
  
  return substitutions;
};

// Function to send feedback to backend for improving the AI
export const sendFeedbackToAI = async (
  lookId: string,
  feedback: string,
  successful: boolean
) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      console.error('User not authenticated');
      return false;
    }
    
    // Check if a user_look entry exists for this look
    const { data: existingLook } = await supabase
      .from('user_looks')
      .select('id, custom_settings')
      .eq('user_id', userId)
      .eq('look_id', lookId)
      .maybeSingle();
    
    if (existingLook) {
      // Update existing entry
      const customSettings = existingLook.custom_settings as Record<string, any> || {};
      const existingFeedback = Array.isArray(customSettings.feedback) ? customSettings.feedback : [];
      
      const updatedSettings = {
        ...customSettings,
        feedback: [
          ...existingFeedback,
          {
            text: feedback,
            successful,
            timestamp: new Date().toISOString()
          }
        ]
      };
      
      const { error } = await supabase
        .from('user_looks')
        .update({ custom_settings: updatedSettings })
        .eq('id', existingLook.id);
      
      if (error) throw error;
    } else {
      // Create new entry
      const { error } = await supabase
        .from('user_looks')
        .insert({
          user_id: userId,
          look_id: lookId,
          custom_settings: {
            feedback: [{
              text: feedback,
              successful,
              timestamp: new Date().toISOString()
            }]
          }
        });
      
      if (error) throw error;
    }
    
    return true;
  } catch (err) {
    console.error('Error sending feedback to AI:', err);
    return false;
  }
};
