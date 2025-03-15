
import { supabase } from '@/lib/supabase';

export interface ReferenceLook {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  products: {
    category: string;
    name: string;
    shade?: string;
    technique?: string;
  }[];
  steps: {
    order: number;
    area: string;
    instruction: string;
    technique: string;
  }[];
}

// Updated interface for steps with customization property
export interface CustomizedStep {
  order: number;
  area: string;
  instruction: string;
  technique: string;
  customization?: string;
}

// Casual day soft glam look based on the provided image
const casualSoftGlamLook: ReferenceLook = {
  id: 'casual-day-soft-glam',
  name: 'Soft Glam Elegant Casual',
  description: 'A soft glam look that balances elegance with a natural touch, perfect for casual outings or semi-formal gatherings.',
  imageUrl: '/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png',
  category: 'Casual Day Looks',
  products: [
    { category: 'Skin Prep', name: 'Lightweight Moisturizer' },
    { category: 'Skin Prep', name: 'Blurring Primer' },
    { category: 'Base', name: 'Satin Foundation' },
    { category: 'Base', name: 'Lightweight Concealer' },
    { category: 'Base', name: 'Translucent Setting Powder' },
    { category: 'Cheeks', name: 'Subtle Contour' },
    { category: 'Cheeks', name: 'Peach Blush' },
    { category: 'Cheeks', name: 'Champagne Highlighter' },
    { category: 'Eyes', name: 'Neutral Eyeshadow Palette' },
    { category: 'Eyes', name: 'Defined Eyeliner' },
    { category: 'Eyes', name: 'Lengthening Mascara' },
    { category: 'Eyes', name: 'Brow Pencil' },
    { category: 'Lips', name: 'Classic Red Lipstick' },
    { category: 'Lips', name: 'Matching Lip Liner' },
    { category: 'Setting', name: 'Hydrating Setting Spray' }
  ],
  steps: [
    { order: 1, area: 'face', instruction: 'Apply lightweight moisturizer all over the face', technique: 'Pat gently into skin using fingertips' },
    { order: 2, area: 'face', instruction: 'Apply blurring primer focusing on t-zone and areas with texture', technique: 'Press into skin, don\'t rub' },
    { order: 3, area: 'face', instruction: 'Apply satin foundation for a natural healthy glow', technique: 'Start from center of face and blend outward' },
    { order: 4, area: 'under-eyes', instruction: 'Apply lightweight concealer under eyes and on any blemishes', technique: 'Pat gently with fingertip or beauty sponge' },
    { order: 5, area: 'face', instruction: 'Set with translucent powder focusing on t-zone', technique: 'Press lightly with a fluffy brush, don\'t sweep' },
    { order: 6, area: 'cheeks', instruction: 'Apply subtle contour along cheekbones and jawline', technique: 'Use light pressure and blend thoroughly' },
    { order: 7, area: 'cheeks', instruction: 'Apply peach or soft pink blush to the apples of cheeks', technique: 'Smile and apply to the roundest part, then blend upward' },
    { order: 8, area: 'high-points', instruction: 'Apply champagne highlighter to high points of face', technique: 'Light application on cheekbones, bridge of nose, cupid\'s bow' },
    { order: 9, area: 'eyes', instruction: 'Apply light brown eyeshadow to the crease', technique: 'Use windshield wiper motions to blend' },
    { order: 10, area: 'eyes', instruction: 'Apply soft shimmer to the lids', technique: 'Pat on with finger or dense brush' },
    { order: 11, area: 'eyes', instruction: 'Apply defined eyeliner with a soft wing', technique: 'Start thin at inner corner, gradually thicken' },
    { order: 12, area: 'eyes', instruction: 'Apply lengthening mascara', technique: 'Wiggle wand at base of lashes, then pull through' },
    { order: 13, area: 'brows', instruction: 'Fill in brows with a natural arch', technique: 'Use light, feathery strokes in direction of hair growth' },
    { order: 14, area: 'lips', instruction: 'Line lips with matching lip liner', technique: 'Follow natural lip line, slightly overline if desired' },
    { order: 15, area: 'lips', instruction: 'Apply classic red or berry lipstick', technique: 'Start from center and work outward' },
    { order: 16, area: 'face', instruction: 'Finish with hydrating setting spray', technique: 'Hold bottle at arm\'s length and apply in X and T motion' }
  ]
};

// Array of reference looks (can be expanded later)
const REFERENCE_LOOKS: ReferenceLook[] = [
  casualSoftGlamLook
];

/**
 * Get all available reference looks
 */
export const getReferenceLooks = (): ReferenceLook[] => {
  return REFERENCE_LOOKS;
};

/**
 * Get a reference look by ID
 */
export const getReferenceLookById = (id: string): ReferenceLook | undefined => {
  return REFERENCE_LOOKS.find(look => look.id === id);
};

/**
 * Get makeup steps for a reference look
 */
export const getLookSteps = (lookId: string): ReferenceLook['steps'] => {
  const look = getReferenceLookById(lookId);
  return look?.steps || [];
};

/**
 * Get product recommendations for a reference look
 */
export const getLookProducts = (lookId: string): ReferenceLook['products'] => {
  const look = getReferenceLookById(lookId);
  return look?.products || [];
};

/**
 * Get personalized makeup instructions based on face analysis
 */
export const getPersonalizedInstructions = async (
  lookId: string,
  faceAnalysis: {
    skinTone?: string;
    faceShape?: string;
    features?: string[];
  }
): Promise<{
  customizedSteps: CustomizedStep[];
  recommendations: string[];
}> => {
  const lookSteps = getLookSteps(lookId);
  const lookProducts = getLookProducts(lookId);
  
  // This would ideally call an AI service to customize steps based on face analysis
  // For now, we'll simulate this with some basic logic
  
  const customizedSteps = lookSteps.map(step => {
    const customizedStep: CustomizedStep = { ...step };
    
    // Add customizations based on face shape
    if (faceAnalysis.faceShape) {
      if (step.area === 'cheeks' && step.instruction.includes('contour')) {
        if (faceAnalysis.faceShape.toLowerCase() === 'round') {
          customizedStep.customization = "For round faces, focus contour on sides of forehead and directly below cheekbones";
        } else if (faceAnalysis.faceShape.toLowerCase() === 'square') {
          customizedStep.customization = "For square faces, soften angles by contouring the corners of the jaw";
        } else if (faceAnalysis.faceShape.toLowerCase() === 'heart') {
          customizedStep.customization = "For heart-shaped faces, contour the chin and temples to balance the face";
        }
      }
    }
    
    // Add customizations based on skin tone
    if (faceAnalysis.skinTone) {
      if (step.area === 'cheeks') {
        if (faceAnalysis.skinTone.toLowerCase().includes('deep') || 
            faceAnalysis.skinTone.toLowerCase().includes('dark')) {
          customizedStep.customization = "Choose deeper, more vibrant blush shades for rich skin tones";
        } else if (faceAnalysis.skinTone.toLowerCase().includes('light') || 
                  faceAnalysis.skinTone.toLowerCase().includes('fair')) {
          customizedStep.customization = "Opt for softer, more buildable application for fair skin tones";
        }
      }
    }
    
    return customizedStep;
  });
  
  // Generate personalized recommendations
  const recommendations: string[] = [];
  
  if (faceAnalysis.features) {
    if (faceAnalysis.features.some(f => f.toLowerCase().includes('hooded'))) {
      recommendations.push("For hooded eyes, apply eyeshadow with eyes open to ensure visibility, and focus on a higher crease placement");
    }
    
    if (faceAnalysis.features.some(f => f.toLowerCase().includes('thin lips'))) {
      recommendations.push("For thinner lips, use lip liner slightly outside your natural lip line to create the illusion of fuller lips");
    }
    
    if (faceAnalysis.features.some(f => f.toLowerCase().includes('high cheekbones'))) {
      recommendations.push("Your high cheekbones are a beautiful feature! Highlight them by applying blush slightly higher on the cheekbones");
    }
  }
  
  return {
    customizedSteps,
    recommendations
  };
};

// Function to save user feedback about a look
export const saveLookFeedback = async (
  lookId: string,
  userId: string,
  feedback: {
    rating: number;
    comments?: string;
    difficultyLevel?: 'easy' | 'medium' | 'hard';
  }
): Promise<boolean> => {
  try {
    // Store feedback in the user_looks table instead of a non-existent table
    const { error } = await supabase
      .from('user_looks')
      .insert({
        user_id: userId,
        look_id: lookId,
        custom_settings: {
          feedback: {
            rating: feedback.rating,
            comments: feedback.comments,
            difficulty_level: feedback.difficultyLevel
          }
        }
      });
    
    return !error;
  } catch (e) {
    console.error('Error saving look feedback:', e);
    return false;
  }
};
