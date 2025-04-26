
// Basic makeup knowledge service with mocked data

export interface MakeupKnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  source?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// This is a mock function that simulates fetching from a makeup_knowledge table
export async function fetchMakeupKnowledge(category?: string): Promise<MakeupKnowledgeEntry[]> {
  try {
    console.log('Fetching makeup knowledge', category);
    
    // Mocked data that matches the MakeupKnowledgeEntry interface
    const mockData: MakeupKnowledgeEntry[] = [
      {
        id: '1',
        category: 'basics',
        title: 'Foundation Application',
        content: 'Always apply foundation from the center of your face outward. Use a damp beauty blender for a seamless finish.',
        source: 'Essence of Makeup Level',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        category: 'color',
        title: 'Color Theory for Warm Skin Tones',
        content: 'Foundation: Choose yellow or golden undertones. Eyeshadow: Copper, bronze, and warm browns work best.',
        source: 'Essence of Makeup Level',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        category: 'face_shapes',
        title: 'Oval Face Shape',
        content: 'Contour: Minimal contouring needed. Highlight: Center of forehead, under eyes, and center of chin.',
        source: 'Essence of Makeup Level',
        created_at: new Date().toISOString()
      }
    ];
    
    if (category) {
      return mockData.filter(item => item.category === category);
    }
    
    return mockData;
  } catch (error) {
    console.error('Error in fetchMakeupKnowledge:', error);
    return [];
  }
}

export async function getKnowledgeForFacialTraits(traits: {
  skinTone?: string;
  faceShape?: string;
  features?: string[];
}): Promise<Record<string, string[]>> {
  try {
    // Mock implementation
    const recommendations: Record<string, string[]> = {
      foundation: [],
      eyeshadow: [],
      lips: [],
      blush: [],
      techniques: []
    };
    
    // Get specific color recommendations based on skin tone
    if (traits.skinTone) {
      // Mock data for skin tones
      if (traits.skinTone.toLowerCase().includes('warm')) {
        recommendations.foundation.push('Choose foundation with yellow or golden undertones');
        recommendations.eyeshadow.push('Copper, bronze, and warm browns work best for eyeshadow');
      } else if (traits.skinTone.toLowerCase().includes('cool')) {
        recommendations.foundation.push('Choose foundation with pink or blue undertones');
        recommendations.eyeshadow.push('Silver, taupe, and cool purples work best for eyeshadow');
      }
    }
    
    // Get specific technique recommendations based on face shape
    if (traits.faceShape) {
      // Mock data for face shapes
      if (traits.faceShape.toLowerCase().includes('oval')) {
        recommendations.techniques.push('Minimal contouring needed for oval face shapes');
        recommendations.techniques.push('Highlight the center of forehead, under eyes, and center of chin');
      } else if (traits.faceShape.toLowerCase().includes('round')) {
        recommendations.techniques.push('Contour the sides of the face to create more definition');
        recommendations.blush.push('Apply blush slightly higher on the cheekbones to create lift');
      }
    }
    
    // General application techniques
    recommendations.foundation.push('Apply foundation from the center of your face outward');
    recommendations.eyeshadow.push('Start with a neutral base color all over the lid');
    recommendations.lips.push('Use lip liner before applying lipstick for a more defined look');
    recommendations.blush.push('Smile when applying blush to find the apples of your cheeks');
    
    return recommendations;
  } catch (error) {
    console.error('Error getting knowledge for facial traits:', error);
    return {};
  }
}

export async function enhanceMakeupGuidanceWithKnowledge(
  baseGuidance: string,
  facialTraits?: { skinTone?: string; faceShape?: string; },
  makeupArea?: string
): Promise<string> {
  try {
    let enhancedGuidance = baseGuidance;
    
    // If we know what makeup area we're working on, add specific knowledge
    if (makeupArea) {
      // Mock data for different makeup areas
      if (makeupArea.toLowerCase().includes('eye')) {
        enhancedGuidance += ' Pro tip: Start with a neutral base color all over the lid, then add darker colors to the crease.';
      } else if (makeupArea.toLowerCase().includes('lip')) {
        enhancedGuidance += ' Pro tip: Use lip liner before applying lipstick for a more defined look and to prevent feathering.';
      } else if (makeupArea.toLowerCase().includes('foundation') || makeupArea.toLowerCase().includes('face')) {
        enhancedGuidance += ' Pro tip: Apply foundation from the center of your face outward for the most natural finish.';
      } else if (makeupArea.toLowerCase().includes('cheek') || makeupArea.toLowerCase().includes('blush')) {
        enhancedGuidance += ' Pro tip: Smile when applying blush to find the apples of your cheeks.';
      }
    }
    
    // If we know the person's facial traits, add personalized advice
    if (facialTraits?.faceShape) {
      // Mock personalized advice based on face shape
      if (facialTraits.faceShape.toLowerCase().includes('oval')) {
        enhancedGuidance += ` For your oval face shape: Minimal contouring needed, you have the ideal proportions.`;
      } else if (facialTraits.faceShape.toLowerCase().includes('round')) {
        enhancedGuidance += ` For your round face shape: Contour the sides of your face to create more definition.`;
      } else if (facialTraits.faceShape.toLowerCase().includes('square')) {
        enhancedGuidance += ` For your square face shape: Soften the jawline with contouring and highlight the center of the face.`;
      }
    }
    
    return enhancedGuidance;
  } catch (error) {
    console.error('Error enhancing makeup guidance:', error);
    return baseGuidance; // Return original guidance if enhancement fails
  }
}
