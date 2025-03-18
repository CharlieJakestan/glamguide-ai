
import { supabase } from '@/lib/supabase';

// Database of makeup facts and techniques
const MAKEUP_KNOWLEDGE_BASE = {
  skinTones: {
    'Fair': {
      foundation: 'Look for foundations with neutral or slightly pink undertones.',
      blush: 'Soft pink and peach blushes work well.',
      lipstick: 'Avoid very dark shades which can appear harsh. Opt for rosy pinks, peachy nudes, or soft reds.',
      eyeshadow: 'Cool-toned shades like taupes, soft grays, and lavenders complement well.'
    },
    'Light': {
      foundation: 'Choose foundations with yellow, neutral, or slightly pink undertones.',
      blush: 'Pink, peach, and coral blushes suit this skin tone.',
      lipstick: 'Pink, coral, berry, and red shades work beautifully.',
      eyeshadow: 'Both warm and cool tones work well, like bronze, copper, navy, and purple.'
    },
    'Medium': {
      foundation: 'Look for foundations with golden or olive undertones.',
      blush: 'Rich pinks, warm corals, and peachy shades complement medium skin.',
      lipstick: 'Coral, berry, cranberry, and warm red shades flatter this skin tone.',
      eyeshadow: 'Earth tones like bronze, copper, warm browns, and olive greens work well.'
    },
    'Olive': {
      foundation: 'Choose foundations with yellow-green or golden undertones.',
      blush: 'Terracotta, warm peach, and bronze blushes are flattering.',
      lipstick: 'Rich berries, terracotta, warm browns, and cranberry shades enhance olive skin.',
      eyeshadow: 'Bronze, gold, copper, and emerald green enhance the natural warmth.'
    },
    'Tan': {
      foundation: 'Look for foundations with golden or warm undertones.',
      blush: 'Rich corals, deep peaches, and bronze blushes work well.',
      lipstick: 'Coral, orange-red, terracotta, and rich berry shades are flattering.',
      eyeshadow: 'Golden bronzes, copper, warm browns, and mossy greens complement tan skin.'
    },
    'Deep': {
      foundation: 'Choose foundations with red, golden, or neutral undertones.',
      blush: 'Rich berries, deep corals, and warm bronzes add beautiful dimension.',
      lipstick: 'Bold berries, plums, rich reds, and warm browns make a statement.',
      eyeshadow: 'Gold, copper, bronze, rich purples, and emerald green create stunning looks.'
    },
    'Rich': {
      foundation: 'Look for foundations with red, blue, or neutral undertones.',
      blush: 'Deep berries, rich plums, and warm bronzes are most flattering.',
      lipstick: 'Deep plums, rich berries, bold reds, and warm browns create gorgeous contrast.',
      eyeshadow: 'Bold jewel tones, gold, bronze, and deep blues and purples create striking looks.'
    }
  },
  
  faceShapes: {
    'Oval': {
      highlight: 'Your face has naturally balanced proportions. Highlight the center of your forehead and chin.',
      contour: 'Light contouring on the sides of your forehead and jawline can enhance your already balanced features.',
      blush: 'Apply blush to the apples of your cheeks and blend upward toward your temples.',
      eyebrows: 'Most brow shapes work well with an oval face. A soft arch complements your proportions.'
    },
    'Round': {
      highlight: 'Highlight the center of your forehead, under your eyes, and the center of your chin.',
      contour: 'Contour the sides of your forehead, below your cheekbones, and along your jawline to create definition.',
      blush: 'Apply blush slightly above the hollows of your cheeks and blend toward your temples.',
      eyebrows: 'Angled or high-arched brows can help elongate your face shape.'
    },
    'Square': {
      highlight: 'Highlight the center of your forehead, under your eyes, and the center of your chin.',
      contour: 'Contour the corners of your forehead and jawline to soften angular features.',
      blush: 'Apply blush to the apples of your cheeks and blend upward for a softer look.',
      eyebrows: 'Softly rounded or slightly angled brows with a less defined arch can soften angular features.'
    },
    'Heart': {
      highlight: 'Highlight the center of your forehead, under your eyes, and the center of your chin.',
      contour: 'Contour the sides of your forehead and temples. Add light contour to the tip of your chin.',
      blush: 'Apply blush below the apples of your cheeks and blend outward to create balance.',
      eyebrows: 'Rounded brows with a soft arch complement heart-shaped faces.'
    },
    'Diamond': {
      highlight: 'Highlight the center of your forehead, high points of your cheekbones, and center of your chin.',
      contour: 'Contour the sides of your forehead and jawline to soften the angles.',
      blush: 'Apply blush horizontally across your cheekbones to add width to the center of your face.',
      eyebrows: 'Softly curved brows with a subtle arch work well with diamond face shapes.'
    },
    'Rectangle': {
      highlight: 'Highlight the center of your forehead, under your eyes, and the center of your chin.',
      contour: 'Contour the top of your forehead, below your cheekbones, and along your jawline.',
      blush: 'Apply blush horizontally across your cheekbones to add width rather than length.',
      eyebrows: 'Straight or softly angled brows with minimal arch help balance the length of your face.'
    }
  },
  
  techniques: {
    foundation: [
      "Start by applying foundation to the center of your face and blend outward for the most natural finish.",
      "Use a damp makeup sponge for a seamless application that mimics natural skin texture.",
      "If you have dry skin, apply a hydrating primer before foundation to prevent patchiness.",
      "For oily skin, use a mattifying primer in the T-zone before applying foundation.",
      "Set your foundation with a light dusting of translucent powder to increase longevity."
    ],
    concealer: [
      "Apply concealer in an inverted triangle shape under your eyes to brighten dark circles.",
      "Let your concealer sit for 30 seconds before blending to achieve maximum coverage.",
      "Use a color corrector (peach or orange) under concealer to neutralize dark circles on deeper skin tones.",
      "For blemishes, use a small precision brush to apply concealer only on the spot and gently pat to blend.",
      "Set undereye concealer with a small amount of setting powder to prevent creasing."
    ],
    eyes: [
      "Apply a primer to your eyelids before eyeshadow to prevent creasing and increase color intensity.",
      "For hooded eyes, place your crease shade slightly above your natural crease to create the illusion of more lid space.",
      "Always apply mascara to curled lashes for maximum length and lift.",
      "When creating a smoky eye, start with a light hand and gradually build intensity.",
      "Use a white or nude eyeliner on your waterline to make your eyes appear larger and more awake."
    ],
    lips: [
      "Exfoliate your lips before applying lipstick to create a smooth canvas.",
      "Use a lip liner in a similar shade to your lipstick to prevent feathering and increase longevity.",
      "For long-lasting lip color, apply lipstick, blot with a tissue, and apply again.",
      "To make your lips appear fuller, apply a small amount of highlighter to your cupid's bow.",
      "For a gradient lip effect, apply color to the center of your lips and blend outward with your finger."
    ],
    blush: [
      "For the most natural-looking blush placement, smile and apply to the apples of your cheeks.",
      "To create a lifting effect, apply blush slightly higher on the cheekbones and blend toward your temples.",
      "Cream blush works well for dry skin, while powder blush is better for oily skin.",
      "Layer cream blush under powder blush for dimensional color that lasts all day.",
      "For a sun-kissed look, apply blush across the bridge of your nose and cheeks where the sun naturally hits."
    ],
    contour: [
      "Use a contour shade that's only 1-2 shades darker than your skin tone for the most natural effect.",
      "The hollow beneath your cheekbones is the primary area for contour placement.",
      "Use a cool-toned contour product to mimic natural shadows.",
      "For nose contouring, use a small brush and blend thoroughly to avoid harsh lines.",
      "Contour the jawline to define and sculpt your face shape."
    ],
    highlight: [
      "Apply highlighter to the high points of your face: cheekbones, brow bone, center of forehead, bridge of nose, and cupid's bow.",
      "For a subtle glow, use a fan brush to apply powder highlighter.",
      "Cream or liquid highlighters create a more intense, dewy finish.",
      "For oily skin, avoid applying highlighter to the center of your face.",
      "Use a champagne highlighter for light to medium skin tones and gold or bronze for deeper skin tones."
    ]
  }
};

// Generate an advanced response using context
export const generateAdvancedResponse = async (
  userInput: string,
  systemPrompt: string,
  context: {
    facialTraits?: any;
    tools?: string[];
    currentStep?: string;
    faceDetected: boolean;
    facialAttributes?: any;
    recentActions?: string[];
  }
): Promise<string> => {
  try {
    // Try to use an edge function if available
    const { data, error } = await supabase.functions.invoke('ai-makeup-assistant', {
      body: {
        message: userInput,
        systemPrompt,
        context
      }
    });
    
    if (!error && data?.response) {
      return data.response;
    }
    
    // If edge function fails, use local fallback
    console.warn('Edge function failed or not available, using local fallback');
    return generateLocalResponse(userInput, context);
  } catch (error) {
    console.error('Error generating advanced response:', error);
    return generateLocalResponse(userInput, context);
  }
};

// Fallback local response generation
const generateLocalResponse = (
  userInput: string,
  context: {
    facialTraits?: any;
    tools?: string[];
    currentStep?: string;
    faceDetected: boolean;
    facialAttributes?: any;
    recentActions?: string[];
  }
): string => {
  const input = userInput.toLowerCase();
  
  // Check if this is a general greeting
  if (input.match(/^(hi|hello|hey|greetings|what's up).*/i)) {
    return "Hello there! I'm your advanced makeup assistant. I can help with makeup tips, techniques, and recommendations based on your facial features. What would you like to know today?";
  }
  
  // Check for questions about skin tone
  if (input.includes('skin tone') || input.includes('foundation') || input.includes('match')) {
    const skinTone = context.facialTraits?.skinTone || 'Medium';
    return `Based on your ${skinTone} skin tone, ${MAKEUP_KNOWLEDGE_BASE.skinTones[skinTone]?.foundation || 'I recommend finding foundations with neutral or golden undertones'}. For the most accurate match, test foundation along your jawline in natural lighting to ensure it blends seamlessly with your neck.`;
  }
  
  // Check for questions about face shape
  if (input.includes('face shape') || input.includes('contour') || input.includes('highlight')) {
    const faceShape = context.facialTraits?.faceShape || 'Oval';
    return `You have a ${faceShape} face shape. ${MAKEUP_KNOWLEDGE_BASE.faceShapes[faceShape]?.contour || 'Apply contour to create definition and structure'} and ${MAKEUP_KNOWLEDGE_BASE.faceShapes[faceShape]?.highlight || 'highlight the high points of your face for dimension'}.`;
  }
  
  // Check for specific product or technique questions
  if (input.includes('eyeshadow') || input.includes('eye makeup')) {
    return MAKEUP_KNOWLEDGE_BASE.techniques.eyes[Math.floor(Math.random() * MAKEUP_KNOWLEDGE_BASE.techniques.eyes.length)];
  }
  
  if (input.includes('lipstick') || input.includes('lip')) {
    return MAKEUP_KNOWLEDGE_BASE.techniques.lips[Math.floor(Math.random() * MAKEUP_KNOWLEDGE_BASE.techniques.lips.length)];
  }
  
  if (input.includes('blush')) {
    return MAKEUP_KNOWLEDGE_BASE.techniques.blush[Math.floor(Math.random() * MAKEUP_KNOWLEDGE_BASE.techniques.blush.length)];
  }
  
  // Check if asking about current step
  if (input.includes('step') || input.includes('next') || input.includes('what now')) {
    if (context.currentStep) {
      return `Currently, you're at this step: ${context.currentStep}. Would you like more detailed guidance on how to complete it?`;
    } else {
      return "I don't see a specific step in progress. Would you like me to help you get started with a basic makeup routine?";
    }
  }
  
  // Check if asking about detected tools
  if (input.includes('tool') || input.includes('using') || input.includes('brush')) {
    if (context.tools && context.tools.length > 0) {
      return `I can see you're using ${context.tools.join(', ')}. That's perfect for ${context.currentStep || 'your current makeup application'}. Make sure to use gentle strokes for the most natural-looking finish.`;
    } else {
      return "I don't detect any specific makeup tools at the moment. What are you trying to apply or blend?";
    }
  }
  
  // Respond to facial expressions or movements
  if (context.facialAttributes?.expression && context.facialAttributes.expression !== 'neutral') {
    const expression = context.facialAttributes.expression;
    if (expression === 'happy' || expression === 'surprise') {
      return "I notice you're smiling! That's actually perfect for applying blush - smile naturally and apply to the apples of your cheeks for the most flattering placement.";
    } else if (expression === 'sad' || expression === 'angry') {
      return "I notice you might be feeling a bit tense. Remember that makeup should be fun! Take a deep breath, relax your facial muscles, and enjoy the process.";
    }
  }
  
  // Default responses based on makeup categories
  const makeupCategories = [
    'foundation', 'concealer', 'eyes', 'lips', 'blush', 'contour', 'highlight'
  ];
  
  // Randomly select a makeup category if no specific query is matched
  const randomCategory = makeupCategories[Math.floor(Math.random() * makeupCategories.length)];
  const tips = MAKEUP_KNOWLEDGE_BASE.techniques[randomCategory];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  
  return `Here's a helpful tip for your makeup routine: ${randomTip} Is there something specific you'd like to know more about?`;
};
