
import { trainAIWithReferenceImages as trainWithImages } from '@/services/makeupReferenceService';

export interface ReferenceLook {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  occasion: string;
  duration: number; // in minutes
  steps: {
    step: number;
    instruction: string;
    imageUrl?: string;
    toolsNeeded?: string[];
    productsNeeded?: string[];
  }[];
  tags: string[];
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
    duration: 10,
    steps: [
      {
        step: 1,
        instruction: 'Apply a light coverage foundation or BB cream all over face using fingertips or a beauty sponge',
        toolsNeeded: ['beauty sponge'],
        productsNeeded: ['foundation', 'bb cream']
      },
      {
        step: 2,
        instruction: 'Apply concealer under eyes and on any blemishes, blend well',
        toolsNeeded: ['concealer brush'],
        productsNeeded: ['concealer']
      },
      {
        step: 3,
        instruction: 'Lightly dust setting powder on T-zone to reduce shine',
        toolsNeeded: ['powder brush'],
        productsNeeded: ['setting powder']
      },
      {
        step: 4,
        instruction: 'Apply a neutral eyeshadow across lid and blend upward',
        toolsNeeded: ['eyeshadow brush'],
        productsNeeded: ['neutral eyeshadow palette']
      },
      {
        step: 5,
        instruction: 'Apply mascara to upper lashes',
        productsNeeded: ['mascara']
      },
      {
        step: 6,
        instruction: 'Apply a natural pink blush to the apples of cheeks',
        toolsNeeded: ['blush brush'],
        productsNeeded: ['blush']
      },
      {
        step: 7,
        instruction: 'Finish with a tinted lip balm',
        productsNeeded: ['tinted lip balm']
      }
    ],
    tags: ['natural', 'everyday', 'quick', 'minimal']
  },
  {
    id: 'evening-glam',
    name: 'Evening Glam',
    description: 'A sophisticated look with dramatic eyes for special occasions',
    imageUrl: '/assets/looks/evening-glam.jpg',
    difficulty: 'advanced',
    occasion: 'evening',
    duration: 25,
    steps: [
      {
        step: 1,
        instruction: 'Apply primer to face and eyelids',
        productsNeeded: ['face primer', 'eye primer']
      },
      {
        step: 2,
        instruction: 'Apply full coverage foundation with a foundation brush',
        toolsNeeded: ['foundation brush'],
        productsNeeded: ['full coverage foundation']
      },
      {
        step: 3,
        instruction: 'Conceal under eyes and any imperfections with a high coverage concealer',
        toolsNeeded: ['concealer brush'],
        productsNeeded: ['high coverage concealer']
      },
      {
        step: 4,
        instruction: 'Set face with translucent powder',
        toolsNeeded: ['powder brush'],
        productsNeeded: ['translucent powder']
      },
      {
        step: 5,
        instruction: 'Contour cheekbones, forehead, and jawline',
        toolsNeeded: ['contour brush'],
        productsNeeded: ['contour powder or cream']
      },
      {
        step: 6,
        instruction: 'Apply dark eyeshadow to crease, blend well',
        toolsNeeded: ['crease brush', 'blending brush'],
        productsNeeded: ['eyeshadow palette']
      },
      {
        step: 7,
        instruction: 'Apply shimmery eyeshadow to lid',
        toolsNeeded: ['flat eyeshadow brush'],
        productsNeeded: ['shimmer eyeshadow']
      },
      {
        step: 8,
        instruction: 'Line upper lash line with liquid eyeliner, creating a wing',
        productsNeeded: ['liquid eyeliner']
      },
      {
        step: 9,
        instruction: 'Apply false lashes and mascara',
        toolsNeeded: ['lash applicator'],
        productsNeeded: ['false lashes', 'lash glue', 'mascara']
      },
      {
        step: 10,
        instruction: 'Add highlighter to cheekbones, brow bone, and cupid\'s bow',
        toolsNeeded: ['highlighting brush'],
        productsNeeded: ['highlighter']
      },
      {
        step: 11,
        instruction: 'Line lips and apply a bold lipstick',
        productsNeeded: ['lip liner', 'lipstick']
      }
    ],
    tags: ['dramatic', 'evening', 'glam', 'special occasion']
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
    recommendations.push('Apply eyeshadow with eyes open to ensure it's visible.');
    recommendations.push('Focus darker shadows on the outer corner to create lift.');
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
