import { trainAIWithReferenceImages as trainWithImages } from '@/services/makeupReferenceService';

export interface ReferenceLook {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  occasion: string;
  duration: number; // in minutes
  category: string; // Added category property
  steps: {
    step: number;
    instruction: string;
    imageUrl?: string;
    toolsNeeded?: string[];
    productsNeeded?: string[];
    technique?: string; // Added technique property
  }[];
  tags: string[];
  products: { // Added products property
    name: string;
    category: string;
    shade?: string;
  }[];
}

// Sample reference looks for demonstration
const referenceLooks: ReferenceLook[] = [
  {
    id: 'natural-everyday',
    name: 'Natural Everyday',
    description: 'A clean, fresh look that enhances your features for daily wear',
    imageUrl: '/assets/looks/natural-everyday.jpg',
    difficulty: 'beginner',
    occasion: 'daily',
    category: 'everyday', // Added category
    duration: 10,
    steps: [
      {
        step: 1,
        instruction: 'Apply a light coverage foundation or BB cream all over face using fingertips or a beauty sponge',
        toolsNeeded: ['beauty sponge'],
        productsNeeded: ['foundation', 'bb cream'],
        technique: 'Pat and blend' // Added technique
      },
      {
        step: 2,
        instruction: 'Apply concealer under eyes and on any blemishes, blend well',
        toolsNeeded: ['concealer brush'],
        productsNeeded: ['concealer'],
        technique: 'Dab and blend' // Added technique
      },
      {
        step: 3,
        instruction: 'Lightly dust setting powder on T-zone to reduce shine',
        toolsNeeded: ['powder brush'],
        productsNeeded: ['setting powder'],
        technique: 'Light dusting motion' // Added technique
      },
      {
        step: 4,
        instruction: 'Apply a neutral eyeshadow across lid and blend upward',
        toolsNeeded: ['eyeshadow brush'],
        productsNeeded: ['neutral eyeshadow palette'],
        technique: 'Sweep and blend' // Added technique
      },
      {
        step: 5,
        instruction: 'Apply mascara to upper lashes',
        productsNeeded: ['mascara'],
        technique: 'Wiggle and sweep' // Added technique
      },
      {
        step: 6,
        instruction: 'Apply a natural pink blush to the apples of cheeks',
        toolsNeeded: ['blush brush'],
        productsNeeded: ['blush'],
        technique: 'Smile and sweep' // Added technique
      },
      {
        step: 7,
        instruction: 'Finish with a tinted lip balm',
        productsNeeded: ['tinted lip balm'],
        technique: 'Apply directly or with finger' // Added technique
      }
    ],
    tags: ['natural', 'everyday', 'quick', 'minimal'],
    products: [ // Added products array
      { name: 'BB Cream', category: 'face' },
      { name: 'Concealer', category: 'face' },
      { name: 'Setting Powder', category: 'face' },
      { name: 'Neutral Eyeshadow', category: 'eyes' },
      { name: 'Mascara', category: 'eyes' },
      { name: 'Natural Pink Blush', category: 'cheeks' },
      { name: 'Tinted Lip Balm', category: 'lips' }
    ]
  },
  {
    id: 'evening-glam',
    name: 'Evening Glam',
    description: 'A sophisticated look with dramatic eyes for special occasions',
    imageUrl: '/assets/looks/evening-glam.jpg',
    difficulty: 'advanced',
    occasion: 'evening',
    category: 'evening', // Added category
    duration: 25,
    steps: [
      {
        step: 1,
        instruction: 'Apply primer to face and eyelids',
        productsNeeded: ['face primer', 'eye primer'],
        technique: 'Pat in with fingertips' // Added technique
      },
      {
        step: 2,
        instruction: 'Apply full coverage foundation with a foundation brush',
        toolsNeeded: ['foundation brush'],
        productsNeeded: ['full coverage foundation'],
        technique: 'Buff in circular motions' // Added technique
      },
      {
        step: 3,
        instruction: 'Conceal under eyes and any imperfections with a high coverage concealer',
        toolsNeeded: ['concealer brush'],
        productsNeeded: ['high coverage concealer'],
        technique: 'Pat and blend' // Added technique
      },
      {
        step: 4,
        instruction: 'Set face with translucent powder',
        toolsNeeded: ['powder brush'],
        productsNeeded: ['translucent powder'],
        technique: 'Press and roll' // Added technique
      },
      {
        step: 5,
        instruction: 'Contour cheekbones, forehead, and jawline',
        toolsNeeded: ['contour brush'],
        productsNeeded: ['contour powder or cream'],
        technique: 'Blend in upward motion' // Added technique
      },
      {
        step: 6,
        instruction: 'Apply dark eyeshadow to crease, blend well',
        toolsNeeded: ['crease brush', 'blending brush'],
        productsNeeded: ['eyeshadow palette'],
        technique: 'Build and blend' // Added technique
      },
      {
        step: 7,
        instruction: 'Apply shimmery eyeshadow to lid',
        toolsNeeded: ['flat eyeshadow brush'],
        productsNeeded: ['shimmer eyeshadow'],
        technique: 'Pat on with finger or brush' // Added technique
      },
      {
        step: 8,
        instruction: 'Line upper lash line with liquid eyeliner, creating a wing',
        productsNeeded: ['liquid eyeliner'],
        technique: 'Short strokes from inner to outer corner' // Added technique
      },
      {
        step: 9,
        instruction: 'Apply false lashes and mascara',
        toolsNeeded: ['lash applicator'],
        productsNeeded: ['false lashes', 'lash glue', 'mascara'],
        technique: 'Apply glue, wait 30 seconds, place and press' // Added technique
      },
      {
        step: 10,
        instruction: 'Add highlighter to cheekbones, brow bone, and cupid\'s bow',
        toolsNeeded: ['highlighting brush'],
        productsNeeded: ['highlighter'],
        technique: 'Sweep and tap' // Added technique
      },
      {
        step: 11,
        instruction: 'Line lips and apply a bold lipstick',
        productsNeeded: ['lip liner', 'lipstick'],
        technique: 'Outline then fill in' // Added technique
      }
    ],
    tags: ['dramatic', 'evening', 'glam', 'special occasion'],
    products: [ // Added products array
      { name: 'Face Primer', category: 'face' },
      { name: 'Eye Primer', category: 'eyes' },
      { name: 'Full Coverage Foundation', category: 'face' },
      { name: 'High Coverage Concealer', category: 'face' },
      { name: 'Translucent Powder', category: 'face' },
      { name: 'Contour Powder', category: 'face' },
      { name: 'Eyeshadow Palette', category: 'eyes' },
      { name: 'Shimmer Eyeshadow', category: 'eyes' },
      { name: 'Liquid Eyeliner', category: 'eyes' },
      { name: 'False Lashes', category: 'eyes' },
      { name: 'Lash Glue', category: 'eyes' },
      { name: 'Mascara', category: 'eyes' },
      { name: 'Highlighter', category: 'face' },
      { name: 'Lip Liner', category: 'lips' },
      { name: 'Bold Lipstick', category: 'lips', shade: 'Red' }
    ]
  }
];

export const getReferenceLooks = (): ReferenceLook[] => {
  return referenceLooks;
};

export const getReferenceLookById = (id: string): ReferenceLook | null => {
  return referenceLooks.find(look => look.id === id) || null;
};

export const trainAIWithReferenceImages = trainWithImages;

// Get personalized steps based on facial analysis
export const getPersonalizedInstructions = async (
  lookId: string,
  facialAnalysis: {
    skinTone?: string;
    faceShape?: string;
    features?: string[];
  }
): Promise<{
  customizedSteps: (ReferenceLook['steps'][0] & { customization?: string })[];
  recommendations: string[];
}> => {
  const look = getReferenceLookById(lookId);
  if (!look) {
    return {
      customizedSteps: [],
      recommendations: []
    };
  }
  
  // Simulate a delay for API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const customizedSteps = look.steps.map(step => {
    let customization = '';
    
    // Add customizations based on facial analysis
    if (facialAnalysis.faceShape === 'Round' && step.instruction.includes('contour')) {
      customization = 'For your round face shape, focus on contouring the sides of your face to create more definition.';
    } else if (facialAnalysis.faceShape === 'Square' && step.instruction.includes('contour')) {
      customization = 'For your square face shape, soften the jawline by contouring the corners of your jaw.';
    } else if (facialAnalysis.faceShape === 'Heart' && step.instruction.includes('contour')) {
      customization = 'For your heart-shaped face, contour the bottom of your chin to balance your face proportions.';
    }
    
    if (facialAnalysis.skinTone === 'Fair' && step.instruction.includes('blush')) {
      customization = 'With your fair skin tone, opt for a lighter pink or peach blush for a natural flush.';
    } else if (facialAnalysis.skinTone === 'Medium' && step.instruction.includes('blush')) {
      customization = 'For your medium skin tone, coral and warm pink blushes will complement your complexion.';
    } else if (facialAnalysis.skinTone === 'Deep' && step.instruction.includes('blush')) {
      customization = 'For your deeper skin tone, rich berry or deep coral blushes will give a beautiful glow.';
    }
    
    return {
      ...step,
      customization
    };
  });
  
  // Generate recommendations based on facial analysis
  const recommendations: string[] = [];
  
  if (facialAnalysis.faceShape) {
    switch(facialAnalysis.faceShape) {
      case 'Round':
        recommendations.push('Contour sides of face to add definition.');
        recommendations.push('Try angular blush application to create structure.');
        break;
      case 'Square':
        recommendations.push('Soften jawline with blending contour at corners.');
        recommendations.push('Round your features with circular blush application.');
        break;
      case 'Heart':
        recommendations.push('Balance your face by contouring the chin area.');
        recommendations.push('Apply blush in a horizontal rather than circular motion.');
        break;
      case 'Oval':
        recommendations.push('Your versatile face shape works well with most techniques.');
        break;
    }
  }
  
  if (facialAnalysis.features?.includes('Hooded eyes')) {
    recommendations.push("Apply eyeshadow with eyes open to ensure it is visible.");
    recommendations.push("Focus darker shadows on the outer corner to create lift.");
  }
  
  if (facialAnalysis.features?.includes('Full lips')) {
    recommendations.push('You can skip lip plumping products and focus on definition.');
  } else if (facialAnalysis.features?.includes('Thin lips')) {
    recommendations.push('Slightly overdraw your lip line and use lighter colors in the center for fullness.');
  }
  
  return {
    customizedSteps,
    recommendations
  };
};
