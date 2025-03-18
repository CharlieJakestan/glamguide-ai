import { useCallback } from 'react';

// Mock data for demonstration
const mockSkinTones = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep', 'Rich'];
const mockFaceShapes = ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Rectangle', 'Triangle'];
const mockFeatures = [
  'Wide-set eyes', 'Close-set eyes', 'Hooded eyes', 'Full lips', 'Thin lips',
  'High cheekbones', 'Strong jawline', 'Soft jawline', 'Strong brow', 'Soft brow',
  'Long nose', 'Button nose', 'Wide nose', 'Narrow nose'
];
const mockRecommendations = [
  'Use a foundation with yellow undertones to complement your skin tone',
  'Apply bronzer along the temples and jawline to define your face shape',
  'Define your brows with a slightly angled shape to balance your features',
  'Try a cream blush on the apples of your cheeks for a natural flush',
  'Apply highlighter to your cheekbones to enhance your facial structure',
  'Use a darker eyeshadow in the crease to create depth for your eye shape',
  'Contour beneath your cheekbones to enhance your face structure',
  'Line your lips slightly outside your natural lip line for fuller appearance',
  'Use a matte bronzer to soften your jawline',
  'Apply mascara with focus on the outer corners to enhance your eye shape'
];

export const useMockFacialData = () => {
  const generateMockFacialTraits = useCallback(() => {
    // Randomly select traits
    return {
      skinTone: mockSkinTones[Math.floor(Math.random() * mockSkinTones.length)],
      faceShape: mockFaceShapes[Math.floor(Math.random() * mockFaceShapes.length)],
      features: [...Array(Math.floor(Math.random() * 3) + 2)].map(() => 
        mockFeatures[Math.floor(Math.random() * mockFeatures.length)]
      ).filter((v, i, a) => a.indexOf(v) === i),
      recommendations: [...Array(Math.floor(Math.random() * 3) + 3)].map(() => 
        mockRecommendations[Math.floor(Math.random() * mockRecommendations.length)]
      ).filter((v, i, a) => a.indexOf(v) === i)
    };
  }, []);

  const generateMockGuidance = useCallback((progress: number = 0) => {
    let guidance = '';
    
    if (progress < 20) {
      guidance = "Start by applying foundation evenly across your face. Focus on blending around your jawline.";
    } else if (progress < 40) {
      guidance = "Add concealer under your eyes and on any blemishes. Blend with gentle dabbing motions.";
    } else if (progress < 60) {
      guidance = "Apply blush to the apples of your cheeks. For your face shape, sweep it slightly upward.";
    } else if (progress < 80) {
      guidance = "Define your eyes with eyeshadow. Your eye shape would benefit from focusing darker shades in the outer corner.";
    } else {
      guidance = "Finish with a lip color that complements your skin tone. Your look is almost complete!";
    }
    
    return guidance;
  }, []);

  return {
    generateMockFacialTraits,
    generateMockGuidance
  };
};
