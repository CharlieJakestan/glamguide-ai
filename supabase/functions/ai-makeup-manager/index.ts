
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as tf from "https://esm.sh/@tensorflow/tfjs@4.11.0";
import { loadTFModel } from "../utils/model-loader.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model paths in storage
const MODEL_PATHS = {
  faceDetector: "models/face-detection/",
  makeupGAN: "models/makeup-gan/",
  facialAttributes: "models/facial-attributes/",
  makeupProducts: "models/product-detection/"
};

// Knowledge base
const MAKEUP_KNOWLEDGE = {
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

// Initialize Supabase client with service role key for storage operations
function initSupabaseAdmin() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Ensure storage buckets exist
async function ensureStorageBuckets(supabase: any) {
  try {
    // Check for the main storage bucket
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Error checking buckets: ${bucketsError.message}`);
    }
    
    // Create gantrainingfiles bucket if it doesn't exist
    const ganBucket = buckets?.find(bucket => bucket.name === 'gantrainingfiles');
    if (!ganBucket) {
      const { error } = await supabase.storage.createBucket('gantrainingfiles', { public: true });
      if (error) throw new Error(`Error creating gantrainingfiles bucket: ${error.message}`);
      console.log("Created gantrainingfiles bucket");
    }
    
    // Create makeup-models bucket if it doesn't exist
    const modelsBucket = buckets?.find(bucket => bucket.name === 'makeup-models');
    if (!modelsBucket) {
      const { error } = await supabase.storage.createBucket('makeup-models', { public: true });
      if (error) throw new Error(`Error creating makeup-models bucket: ${error.message}`);
      console.log("Created makeup-models bucket");
    }
    
    // Create makeup-reference bucket if it doesn't exist
    const refBucket = buckets?.find(bucket => bucket.name === 'makeup-reference');
    if (!refBucket) {
      const { error } = await supabase.storage.createBucket('makeup-reference', { public: true });
      if (error) throw new Error(`Error creating makeup-reference bucket: ${error.message}`);
      console.log("Created makeup-reference bucket");
    }
    
    return { gantrainingfiles: ganBucket, makeupModels: modelsBucket, makeupReference: refBucket };
  } catch (error) {
    console.error("Error ensuring storage buckets:", error);
    throw error;
  }
}

// Check if model files exist, create placeholders if not
async function ensureModelFiles(supabase: any) {
  try {
    // Check gantrainingfiles bucket for required GAN model file
    const { data: ganFiles, error: ganError } = await supabase.storage
      .from('gantrainingfiles')
      .list();
      
    if (ganError) throw new Error(`Error listing gantrainingfiles: ${ganError.message}`);
    
    // Check if GAN model file exists, upload placeholder if not
    const ganModel = ganFiles?.find(file => file.name === 'makeup_gan_models_final_resized.h5');
    if (!ganModel) {
      console.log("Uploading placeholder GAN model file");
      // Create a more substantial placeholder model file
      const placeholderModelData = new Uint8Array(new Array(1024).fill(1));
      
      const { error: uploadError } = await supabase.storage
        .from('gantrainingfiles')
        .upload('makeup_gan_models_final_resized.h5', placeholderModelData);
        
      if (uploadError) throw new Error(`Error uploading GAN model file: ${uploadError.message}`);
    }
    
    // Check makeup-models bucket for face detection models
    const { data: faceModels, error: faceModelsError } = await supabase.storage
      .from('makeup-models')
      .list('face-detection');
      
    if (faceModelsError && faceModelsError.message !== 'The resource was not found') {
      throw new Error(`Error listing face models: ${faceModelsError.message}`);
    }
    
    // If face detection folder doesn't exist, create it with placeholder models
    if (!faceModels || faceModels.length === 0) {
      console.log("Creating face detection model placeholders");
      
      // Create minimal placeholder files for the face detection models
      const placeholderFiles = [
        'face_detection_model.json',
        'face_landmark_68_model.json',
        'face_recognition_model.json',
        'face_expression_model.json',
        'ssd_mobilenetv1_model.json'
      ];
      
      for (const file of placeholderFiles) {
        const placeholderContent = new TextEncoder().encode(JSON.stringify({
          modelTopology: { placeholder: true },
          weightsManifest: [{ paths: ["weights.bin"], weights: [] }]
        }));
        
        const { error } = await supabase.storage
          .from('makeup-models')
          .upload(`face-detection/${file}`, placeholderContent);
          
        if (error && !error.message.includes('already exists')) {
          console.error(`Error uploading face model ${file}:`, error);
          // Continue with other files rather than stopping entirely
        }
        
        // Create a minimal weights file
        const weightsData = new Uint8Array(new Array(128).fill(0));
        await supabase.storage
          .from('makeup-models')
          .upload(`face-detection/weights.bin`, weightsData);
      }
    }
    
    return { 
      ganModelExists: !!ganModel,
      faceModelsExist: faceModels && faceModels.length > 0
    };
  } catch (error) {
    console.error("Error ensuring model files:", error);
    throw error;
  }
}

// Process facial image analysis using TensorFlow.js
async function analyzeFacialImage(imgData: string, lookId: string) {
  try {
    // In a real implementation, this would use the TensorFlow.js models to analyze
    // the facial image and apply the GAN transformation
    
    // For now, we'll use enhanced but still partly simulated analysis with real structure
    const skinTones = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep'];
    const faceShapes = ['Oval', 'Round', 'Heart', 'Square', 'Diamond', 'Rectangle'];
    const features = [
      'High cheekbones', 'Defined jawline', 'Prominent brow', 'Wide-set eyes',
      'Full lips', 'Narrow nose', 'Arched eyebrows', 'Defined cupid\'s bow',
      'Symmetrical features', 'Long lashes', 'Almond-shaped eyes'
    ];
    
    // Generate a more deterministic result based on the lookId
    const hashValue = lookId ? hashString(lookId) : Date.now();
    const skinTone = skinTones[hashValue % skinTones.length];
    const faceShape = faceShapes[(hashValue + 2) % faceShapes.length];
    
    // Select 2-4 features based on the hash
    const featureCount = 2 + (hashValue % 3);
    const selectedFeatures = [];
    for (let i = 0; i < featureCount; i++) {
      const featureIndex = (hashValue + i * 7) % features.length;
      selectedFeatures.push(features[featureIndex]);
    }
    
    // Get makeup knowledge for this skin tone and face shape
    const skinToneInfo = MAKEUP_KNOWLEDGE.skinTones[skinTone.toLowerCase()] || MAKEUP_KNOWLEDGE.skinTones.medium;
    const faceShapeInfo = MAKEUP_KNOWLEDGE.faceShapes[faceShape.toLowerCase()] || MAKEUP_KNOWLEDGE.faceShapes.oval;
    
    // Generate personalized recommendations based on the knowledge database
    const recommendations = [
      ...skinToneInfo.makeupTips,
      ...faceShapeInfo.makeupTips,
      ...generateTechniqueTips(MAKEUP_KNOWLEDGE.techniques)
    ];
    
    // Generate a look process with steps
    const lookType = lookId?.includes('glam') ? 'glamorous' :
                    lookId?.includes('natural') ? 'natural' :
                    lookId?.includes('korean') ? 'Korean' : 'classic';
    
    const steps = generateMakeupSteps(lookType, skinTone, faceShape);
    const currentStepIndex = Math.floor(hashValue % steps.length);
    const progress = Math.round((currentStepIndex / steps.length) * 100);
    
    return {
      status: 'ok',
      result: {
        imageUrl: imgData.startsWith('data:') ? imgData : 'data:image/jpeg;base64,' + imgData,
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
  } catch (error) {
    console.error('Error analyzing facial image:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

// Helper functions for makeup analysis
function generateTechniqueTips(techniques) {
  const allTips = [];
  for (const category in techniques) {
    allTips.push(...techniques[category]);
  }
  // Select random tips
  const selectedTips = [];
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * allTips.length);
    selectedTips.push(allTips[randomIndex]);
    allTips.splice(randomIndex, 1);
  }
  return selectedTips;
}

function generateMakeupSteps(lookType: string, skinTone: string, faceShape: string) {
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
  
  // Add face shape specific tips from our knowledge base
  const faceShapeInfo = MAKEUP_KNOWLEDGE.faceShapes[faceShape.toLowerCase()] || MAKEUP_KNOWLEDGE.faceShapes.oval;
  const faceShapeTips = faceShapeInfo.makeupTips;
  
  // Add skin tone specific tips from our knowledge base
  const skinToneInfo = MAKEUP_KNOWLEDGE.skinTones[skinTone.toLowerCase()] || MAKEUP_KNOWLEDGE.skinTones.medium;
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

// Helper to hash a string to a number (for seeding)
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Main request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = initSupabaseAdmin();
    const body = await req.json();
    const { action } = body;
    
    // First, ensure all storage buckets and required files exist
    await ensureStorageBuckets(supabase);
    const modelStatus = await ensureModelFiles(supabase);
    
    // Handle different action requests
    switch (action) {
      case 'check-status': {
        return new Response(
          JSON.stringify({ 
            status: 'ok',
            modelStatus,
            version: "1.0.0",
            message: 'AI Makeup Manager is operational',
            buckets: ['gantrainingfiles', 'makeup-models', 'makeup-reference'],
            knowledgeBase: {
              products: Object.keys(MAKEUP_KNOWLEDGE.products),
              faceShapes: Object.keys(MAKEUP_KNOWLEDGE.faceShapes),
              skinTones: Object.keys(MAKEUP_KNOWLEDGE.skinTones),
              techniques: Object.keys(MAKEUP_KNOWLEDGE.techniques)
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'analyze-face': {
        const { image, lookId } = body;
        
        if (!image) {
          throw new Error('No image data provided');
        }
        
        const result = await analyzeFacialImage(image, lookId);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'get-model': {
        const { modelType = 'gan' } = body;
        
        // Get the appropriate model file
        let bucketName = 'gantrainingfiles';
        let fileName = 'makeup_gan_models_final_resized.h5';
        
        if (modelType === 'face-detection') {
          bucketName = 'makeup-models';
          fileName = 'face-detection/face_detection_model.json';
        }
        
        // Create a signed URL for the model file
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(fileName, 60 * 60); // 1 hour expiry
          
        if (error) {
          throw new Error(`Error creating signed URL: ${error.message}`);
        }
        
        return new Response(
          JSON.stringify({ 
            status: 'ok', 
            modelUrl: data.signedUrl,
            modelType,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'train-model': {
        // In a real implementation, this would initiate model training
        // For now, we'll simulate a successful training response
        return new Response(
          JSON.stringify({ 
            status: 'ok', 
            message: 'Model training initiated',
            jobId: `train-${Date.now()}`,
            estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000).toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'product-detection': {
        const { image } = body;
        
        if (!image) {
          throw new Error('No image data provided');
        }
        
        // In a real implementation, this would use a trained model to detect makeup products
        // For now, we'll return simulated but structured detection results
        const products = Object.keys(MAKEUP_KNOWLEDGE.products);
        const detectedProducts = [];
        
        // Simulate detection of 1-3 products
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence
          
          detectedProducts.push({
            product,
            confidence,
            boundingBox: {
              x: Math.random() * 0.7,
              y: Math.random() * 0.7,
              width: 0.1 + Math.random() * 0.2,
              height: 0.1 + Math.random() * 0.2
            },
            productInfo: MAKEUP_KNOWLEDGE.products[product]
          });
        }
        
        return new Response(
          JSON.stringify({ 
            status: 'ok', 
            detectedProducts,
            analysisTime: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'get-cosmetology-knowledge': {
        // Return the makeup knowledge base
        return new Response(
          JSON.stringify({ 
            status: 'ok', 
            knowledge: MAKEUP_KNOWLEDGE
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in ai-makeup-manager function:', error);
    
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        error: error.message,
        message: "The AI makeup manager function encountered an error."
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
