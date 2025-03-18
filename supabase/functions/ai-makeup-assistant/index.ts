
import { serve } from "http/server.ts";

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
  }
};

serve(async (req) => {
  try {
    const { message, systemPrompt, context } = await req.json();
    
    // Check if an OpenAI API key is available
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    
    // Use OpenAI if available
    if (openAIApiKey) {
      try {
        const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAIApiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { 
                role: "system", 
                content: systemPrompt || "You are a helpful makeup assistant AI. Provide detailed, personalized makeup advice." 
              },
              { 
                role: "user", 
                content: `Context: ${JSON.stringify(context)}
                User message: ${message}
                Please respond conversationally as if directly addressing the user. Don't mention the context provided.`
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          })
        });
        
        const result = await openAIResponse.json();
        
        if (result.choices && result.choices[0]?.message?.content) {
          return new Response(
            JSON.stringify({ response: result.choices[0].message.content }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
      } catch (openAIError) {
        console.error("OpenAI API error:", openAIError);
        // Fall through to the local response
      }
    }
    
    // Fallback to local response generation if OpenAI is not available or fails
    const localResponse = generateLocalResponse(message, context);
    
    return new Response(
      JSON.stringify({ response: localResponse }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
});

function generateLocalResponse(
  userInput: string,
  context: any
): string {
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
    return "For eyeshadow application, start with a primer on your lids to prevent creasing and increase color payoff. Apply a light base shade all over, then define your crease with a medium tone using windshield wiper motions. Add a darker shade to the outer corner for depth, and finish with a shimmer on the lid for dimension. Always blend between each step for a seamless finish.";
  }
  
  if (input.includes('lipstick') || input.includes('lip')) {
    return "For perfect lipstick application, start by exfoliating your lips and applying a thin layer of lip balm. Line your lips with a pencil that matches your lipstick shade, slightly overlapping your natural lip line if you want more fullness. Fill in with lipstick using a lip brush for precision, blot with a tissue, and apply a second coat for longevity. For a modern look, focus the color in the center of your lips and blend outward for a soft gradient effect.";
  }
  
  if (input.includes('blush')) {
    return "For the most flattering blush application, smile and apply color to the apples of your cheeks, then blend upward toward your temples. The placement depends on your face shape - for round faces, apply slightly higher on the cheekbones to create the illusion of length, while for longer faces, focus more on the apples for width. Cream blush works beautifully for dry skin, while powder formulas are better for oily complexions. Remember that less is more - start with a light hand and build gradually!";
  }
  
  // Check if asking about current step
  if (input.includes('step') || input.includes('next') || input.includes('what now')) {
    if (context.currentStep) {
      return `Currently, you're at this step: ${context.currentStep}. Take your time with this step and make sure you blend thoroughly for a seamless finish. Would you like more detailed guidance on how to complete it?`;
    } else {
      return "I don't see a specific step in progress. Let's start with skin prep: cleanse your face, apply moisturizer, and primer. This creates the perfect canvas for flawless makeup application. What type of look are you going for today?";
    }
  }
  
  // Check if asking about detected tools
  if (input.includes('tool') || input.includes('using') || input.includes('brush')) {
    if (context.tools && context.tools.length > 0) {
      return `I can see you're using ${context.tools.join(', ')}. That's perfect for ${context.currentStep || 'your current makeup application'}. Make sure to use gentle strokes and blend thoroughly for the most natural-looking finish.`;
    } else {
      return "I don't detect any specific makeup tools at the moment. For foundation, I recommend a dense brush or beauty sponge. For eyeshadow, you'll want at least three brushes: a flat shader brush for applying color, a fluffy blending brush, and a smaller precision brush for detail work. What are you trying to apply or blend?";
    }
  }
  
  // Default response with helpful makeup tip
  return "Here's a pro makeup tip: Layer your products strategically for all-day wear. Start with a primer targeted to your skin type, apply a thin layer of foundation, and use concealer only where needed. Set with a light dusting of translucent powder, and then apply the rest of your color products. This technique prevents cakiness and helps your makeup last longer. Is there a specific area of makeup application I can help you with?";
}
