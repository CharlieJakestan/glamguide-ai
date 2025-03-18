
import { synthesizeSpeech, speakInstruction } from './speechService';
import { updateContext } from './voiceGuidanceService';

// Interface for the conversation context
interface ConversationContext {
  recentTopics: string[];
  userPreferences: Record<string, any>;
  makeupSteps: {
    completed: string[];
    current: string;
    next: string[];
  };
  facialTraits?: {
    skinTone?: string;
    faceShape?: string;
    features?: string[];
  };
  lastUserQuery?: string;
  lastResponse?: string;
  conversationState: 'greeting' | 'analysis' | 'tutorial' | 'feedback' | 'idle';
}

// Create a default context
const defaultContext: ConversationContext = {
  recentTopics: [],
  userPreferences: {},
  makeupSteps: {
    completed: [],
    current: '',
    next: []
  },
  conversationState: 'greeting'
};

// Maintain the conversation context
let conversationContext: ConversationContext = { ...defaultContext };

// Common makeup-related terms for natural language processing
const makeupTerms = {
  products: [
    'foundation', 'concealer', 'powder', 'blush', 'bronzer', 'highlighter',
    'eyeshadow', 'eyeliner', 'mascara', 'lipstick', 'lip gloss', 'primer',
    'setting spray', 'contour', 'brow pencil', 'brow gel', 'lip liner'
  ],
  tools: [
    'brush', 'beauty blender', 'sponge', 'applicator', 'pencil', 'wand',
    'spoolie', 'tweezer', 'curler'
  ],
  areas: [
    'eyes', 'lips', 'cheeks', 'face', 'brows', 'eyebrows', 'jawline',
    'forehead', 'nose', 'eyelids', 'waterline', 'lashline', 'cupid\'s bow'
  ],
  techniques: [
    'blend', 'apply', 'buff', 'contour', 'highlight', 'set', 'prime',
    'line', 'fill', 'define', 'shape', 'build', 'layer', 'pat', 'smudge'
  ],
  looks: [
    'natural', 'glam', 'smokey', 'everyday', 'bold', 'subtle', 'dramatic',
    'dewy', 'matte', 'korean', 'western', 'editorial', 'bridal', 'evening'
  ]
};

// Update the conversation context
export const updateConversationContext = (
  updates: Partial<ConversationContext>
): ConversationContext => {
  conversationContext = {
    ...conversationContext,
    ...updates
  };
  return conversationContext;
};

// Reset the conversation context
export const resetConversationContext = (): void => {
  conversationContext = { ...defaultContext };
};

// Process user input to extract makeup-related entities
export const extractMakeupEntities = (input: string): Record<string, string[]> => {
  const lowerInput = input.toLowerCase();
  const result: Record<string, string[]> = {
    products: [],
    tools: [],
    areas: [],
    techniques: [],
    looks: []
  };
  
  // Check each category
  Object.entries(makeupTerms).forEach(([category, terms]) => {
    const found = terms.filter(term => lowerInput.includes(term));
    if (found.length > 0) {
      result[category] = found;
    }
  });
  
  return result;
};

// Generate a more contextual response based on user input and current state
export const generateContextualResponse = async (
  input: string,
  facialTraits?: { skinTone?: string; faceShape?: string; features?: string[] },
  detectedTools: string[] = [],
  currentStep: string = '',
  faceDetected: boolean = true
): Promise<string> => {
  // Update context with user input
  updateConversationContext({
    lastUserQuery: input,
    facialTraits
  });
  
  // Extract makeup-related entities
  const entities = extractMakeupEntities(input);
  
  // Get movement data from the voiceGuidance service for additional context
  const movementContext = updateContext(
    faceDetected,
    detectedTools,
    Math.random() * 3 // Mock movement magnitude for now
  );
  
  // Generate response based on current context and input
  let response = '';
  const lowerInput = input.toLowerCase();
  
  // Handle greetings and basic queries
  if (
    lowerInput.includes('hello') || 
    lowerInput.includes('hi') || 
    lowerInput.includes('hey')
  ) {
    response = `Hello there! I'm your makeup assistant. How can I help you today?`;
    conversationContext.conversationState = 'greeting';
  }
  // Handle requests for analysis
  else if (
    lowerInput.includes('analyze') || 
    lowerInput.includes('scan') || 
    lowerInput.includes('check') ||
    lowerInput.includes('what') && (
      lowerInput.includes('skin') || 
      lowerInput.includes('face') || 
      lowerInput.includes('look')
    )
  ) {
    if (facialTraits) {
      response = `Based on my analysis, you have ${facialTraits.skinTone || 'a beautiful'} skin tone ` +
        `and a ${facialTraits.faceShape || 'unique'} face shape. ` +
        `I would recommend focusing on ${getRecommendationForFaceShape(facialTraits.faceShape)}.`;
    } else {
      response = `I'd love to analyze your features. Could you position your face clearly in the camera, please?`;
    }
    conversationContext.conversationState = 'analysis';
  }
  // Handle product-related queries
  else if (entities.products.length > 0) {
    const product = entities.products[0];
    response = `For ${product}, I recommend ${getProductRecommendation(product, facialTraits?.skinTone)}. ` +
      `Would you like me to guide you on how to apply it?`;
    conversationContext.conversationState = 'tutorial';
  }
  // Handle look-related queries
  else if (entities.looks.length > 0) {
    const look = entities.looks[0];
    response = `A ${look} look would be perfect! For your ${facialTraits?.skinTone || ''} skin tone, ` +
      `I'd recommend starting with ${getFirstStepForLook(look)}. Would you like me to guide you through it?`;
    conversationContext.conversationState = 'tutorial';
  }
  // Handle step guidance
  else if (
    lowerInput.includes('how') || 
    lowerInput.includes('guide') || 
    lowerInput.includes('help') ||
    lowerInput.includes('next') ||
    lowerInput.includes('show me')
  ) {
    if (currentStep) {
      response = `For the ${currentStep} step, ${getGuidanceForStep(currentStep)}. ` +
        `Make sure to ${getCommonMistake(currentStep)} for the best results.`;
    } else {
      response = `I'd be happy to guide you! What look are you trying to achieve today?`;
    }
    conversationContext.conversationState = 'tutorial';
  }
  // Handle feedback requests
  else if (
    lowerInput.includes('how do i look') || 
    lowerInput.includes('is this good') || 
    lowerInput.includes('check my') ||
    lowerInput.includes('did i do it right')
  ) {
    if (faceDetected) {
      if (detectedTools.length > 0) {
        response = `Your ${currentStep || 'makeup'} is looking good! The ${detectedTools[0]} is ` +
          `being applied well. Maybe try to ${getRandomTip()} for even better results.`;
      } else {
        response = `You're doing great! Your application is even and well-blended. ` +
          `I particularly like how you've done your ${getRandomArea()}.`;
      }
    } else {
      response = `I need to see your face clearly to give you feedback. Could you adjust the camera angle?`;
    }
    conversationContext.conversationState = 'feedback';
  }
  // Default response for other queries
  else {
    response = `I'm here to help with your makeup journey. I can analyze your face, recommend products, or guide you through applying makeup. What would you like to know?`;
    conversationContext.conversationState = 'idle';
  }
  
  // Update context with the response
  updateConversationContext({
    lastResponse: response
  });
  
  return response;
};

// Helper functions for contextual responses
const getRecommendationForFaceShape = (faceShape?: string): string => {
  switch (faceShape?.toLowerCase()) {
    case 'oval':
      return 'highlighting your cheekbones and balancing your features';
    case 'round':
      return 'creating definition with contour along your jawline and temples';
    case 'square':
      return 'softening your angles with blush on the apples of your cheeks';
    case 'heart':
      return 'balancing your features by adding definition to your jawline';
    case 'diamond':
      return 'softening your cheekbones with a subtle blush';
    default:
      return 'enhancing your natural beauty with balanced application techniques';
  }
};

const getProductRecommendation = (product: string, skinTone?: string): string => {
  switch (product.toLowerCase()) {
    case 'foundation':
      return skinTone ? `a ${getShadeForSkinTone(skinTone)} shade with ${getFinishForSkinTone(skinTone)} finish` : 'a foundation that matches your skin tone and type';
    case 'blush':
      return skinTone ? `a ${getBlushColorForSkinTone(skinTone)} blush` : 'a blush that complements your natural flush';
    case 'lipstick':
      return skinTone ? `a ${getLipColorForSkinTone(skinTone)} lipstick` : 'a lipstick shade that enhances your natural lip color';
    case 'eyeshadow':
      return skinTone ? `eyeshadows in ${getEyeshadowColorForSkinTone(skinTone)} tones` : 'eyeshadow colors that make your eyes pop';
    default:
      return 'products that enhance your natural features';
  }
};

const getShadeForSkinTone = (skinTone?: string): string => {
  switch (skinTone?.toLowerCase()) {
    case 'fair': return 'light ivory or porcelain';
    case 'light': return 'light beige or sand';
    case 'medium': return 'medium beige or golden';
    case 'olive': return 'warm olive or golden tan';
    case 'tan': return 'deep golden or caramel';
    case 'deep': return 'rich chestnut or espresso';
    default: return 'shade that matches your undertone';
  }
};

const getFinishForSkinTone = (skinTone?: string): string => {
  switch (skinTone?.toLowerCase()) {
    case 'fair': return 'satin or natural';
    case 'light': return 'natural or dewy';
    case 'medium': return 'natural or radiant';
    case 'olive': return 'radiant or dewy';
    case 'tan': return 'radiant or luminous';
    case 'deep': return 'luminous or natural';
    default: return 'natural';
  }
};

const getBlushColorForSkinTone = (skinTone?: string): string => {
  switch (skinTone?.toLowerCase()) {
    case 'fair': return 'soft pink or light peach';
    case 'light': return 'peachy pink or coral';
    case 'medium': return 'rosy pink or warm peach';
    case 'olive': return 'terracotta or warm coral';
    case 'tan': return 'rich coral or berry';
    case 'deep': return 'deep berry or rich plum';
    default: return 'shade that gives a natural flush';
  }
};

const getLipColorForSkinTone = (skinTone?: string): string => {
  switch (skinTone?.toLowerCase()) {
    case 'fair': return 'soft pink or peachy nude';
    case 'light': return 'rosy nude or coral';
    case 'medium': return 'warm pink or mauve';
    case 'olive': return 'terracotta or warm berry';
    case 'tan': return 'warm brown or brick red';
    case 'deep': return 'wine red or deep berry';
    default: return 'shade that complements your natural lip color';
  }
};

const getEyeshadowColorForSkinTone = (skinTone?: string): string => {
  switch (skinTone?.toLowerCase()) {
    case 'fair': return 'taupe, soft pink, or light brown';
    case 'light': return 'champagne, rose gold, or medium brown';
    case 'medium': return 'bronze, copper, or warm brown';
    case 'olive': return 'olive green, gold, or deep bronze';
    case 'tan': return 'copper, terracotta, or plum';
    case 'deep': return 'deep plum, emerald, or rich bronze';
    default: return 'tones that complement your eye color';
  }
};

const getFirstStepForLook = (look: string): string => {
  switch (look.toLowerCase()) {
    case 'natural':
      return 'a light coverage tinted moisturizer or BB cream';
    case 'glam':
      return 'a full coverage foundation and concealer for a flawless base';
    case 'smokey':
      return 'an eyeshadow primer to ensure your eye look lasts all night';
    case 'dewy':
      return 'a hydrating primer and illuminating foundation';
    case 'matte':
      return 'an oil-control primer and matte foundation';
    case 'korean':
      return 'skin prep with toner, essence, and a lightweight BB cream';
    default:
      return 'creating a good base with primer and foundation';
  }
};

const getGuidanceForStep = (step: string): string => {
  if (step.toLowerCase().includes('foundation')) {
    return 'apply it from the center of your face outward using a damp beauty sponge for seamless blending';
  } else if (step.toLowerCase().includes('blush')) {
    return 'smile to find the apples of your cheeks and apply in a sweeping motion toward your temples';
  } else if (step.toLowerCase().includes('eye')) {
    return 'apply a light shade all over your lid, then build depth with a medium shade in the crease';
  } else if (step.toLowerCase().includes('lip')) {
    return 'line your lips first for definition, then fill in with your lipstick';
  } else if (step.toLowerCase().includes('contour')) {
    return 'place it in the hollows of your cheeks, along your jawline, and at your temples';
  } else {
    return 'apply with precision and blend well for a seamless finish';
  }
};

const getCommonMistake = (step: string): string => {
  if (step.toLowerCase().includes('foundation')) {
    return 'blend down your neck to avoid a line of demarcation';
  } else if (step.toLowerCase().includes('blush')) {
    return 'avoid applying too close to your nose to prevent a feverish look';
  } else if (step.toLowerCase().includes('eye')) {
    return 'blend out any harsh lines for a professional finish';
  } else if (step.toLowerCase().includes('lip')) {
    return 'blot your lips after application to prevent transfer';
  } else if (step.toLowerCase().includes('contour')) {
    return 'blend thoroughly to avoid harsh lines';
  } else {
    return 'take your time and build product gradually rather than applying too much at once';
  }
};

const getRandomTip = (): string => {
  const tips = [
    'use a light hand and build up gradually',
    'blend a bit more at the edges for a seamless transition',
    'warm the product on the back of your hand before applying',
    'use tapping motions instead of swiping for more precise application',
    'look straight ahead in the mirror to check your work as you go'
  ];
  return tips[Math.floor(Math.random() * tips.length)];
};

const getRandomArea = (): string => {
  const areas = ['eyes', 'cheeks', 'lips', 'brows', 'jawline', 'highlight'];
  return areas[Math.floor(Math.random() * areas.length)];
};

// Function to generate and speak a response
export const generateAndSpeakResponse = async (
  input: string,
  facialTraits?: { skinTone?: string; faceShape?: string; features?: string[] },
  detectedTools: string[] = [],
  currentStep: string = '',
  faceDetected: boolean = true
): Promise<string> => {
  const response = await generateContextualResponse(
    input,
    facialTraits,
    detectedTools,
    currentStep,
    faceDetected
  );
  
  // Speak the response
  await speakInstruction(response);
  
  return response;
};

export default {
  updateConversationContext,
  resetConversationContext,
  extractMakeupEntities,
  generateContextualResponse,
  generateAndSpeakResponse
};
