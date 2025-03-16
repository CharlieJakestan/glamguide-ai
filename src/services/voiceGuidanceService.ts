
import { supabase } from '@/lib/supabase';

// Store audio elements to prevent memory leaks
let audioPlayer: HTMLAudioElement | null = null;
let audioQueue: string[] = [];
let isPlaying = false;

// Track context for more intelligent responses
let lastContext: {
  detectedTools: string[];
  userMovement: string;
  faceDetected: boolean;
  lastSpokenTime: number;
  spokenPhrases: Set<string>;
} = {
  detectedTools: [],
  userMovement: 'still',
  faceDetected: false,
  lastSpokenTime: 0,
  spokenPhrases: new Set()
};

// Initialize audio player
const initAudioPlayer = () => {
  if (!audioPlayer) {
    audioPlayer = new Audio();
    audioPlayer.onended = playNextInQueue;
  }
};

// Play next audio in queue
const playNextInQueue = () => {
  if (audioQueue.length === 0) {
    isPlaying = false;
    return;
  }

  const nextAudio = audioQueue.shift();
  if (nextAudio) {
    isPlaying = true;
    audioPlayer!.src = nextAudio;
    audioPlayer!.play().catch(err => {
      console.error('Error playing audio:', err);
      // Try next one in case of error
      playNextInQueue();
    });
  } else {
    isPlaying = false;
  }
};

// Add audio to queue and start playing if not already
const queueAudio = (audioData: string, format: string = 'mp3') => {
  initAudioPlayer();
  const audioUrl = `data:audio/${format};base64,${audioData}`;
  audioQueue.push(audioUrl);
  
  if (!isPlaying) {
    playNextInQueue();
  }
};

// Generate speech using ElevenLabs via Edge Function
export const generateSpeech = async (
  text: string, 
  voice: string = 'Charlie',
  immediately: boolean = false
): Promise<boolean> => {
  try {
    // Don't repeat the same phrase too soon
    if (lastContext.spokenPhrases.has(text) && 
        Date.now() - lastContext.lastSpokenTime < 15000) {
      console.log('Skipping repeated phrase:', text);
      return false;
    }
    
    // Update context
    lastContext.lastSpokenTime = Date.now();
    lastContext.spokenPhrases.add(text);
    
    // Remove phrases from context after some time
    setTimeout(() => {
      lastContext.spokenPhrases.delete(text);
    }, 30000);

    // Call edge function
    const { data, error } = await supabase.functions.invoke('voice-guidance', {
      body: { text, voice }
    });

    if (error) {
      console.error('Error generating speech:', error);
      return false;
    }

    if (data?.status !== 'success' || !data?.audio) {
      console.error('Invalid response from voice-guidance function:', data);
      return false;
    }

    // Clear queue if immediate playback requested
    if (immediately && audioPlayer) {
      audioQueue = [];
      audioPlayer.pause();
      isPlaying = false;
    }

    // Add to playback queue
    queueAudio(data.audio, data.format);
    return true;
  } catch (err) {
    console.error('Error in generateSpeech:', err);
    return false;
  }
};

// Stop all audio playback
export const stopSpeech = () => {
  if (audioPlayer) {
    audioPlayer.pause();
    audioQueue = [];
    isPlaying = false;
  }
};

// Update context based on user actions for more intelligent responses
export const updateContext = (
  faceDetected: boolean,
  detectedTools: string[] = [],
  movementMagnitude: number = 0
) => {
  lastContext.faceDetected = faceDetected;
  
  // Update detected tools
  if (detectedTools.length > 0) {
    lastContext.detectedTools = [...detectedTools];
  }
  
  // Update movement classification
  if (movementMagnitude > 5) {
    lastContext.userMovement = 'active';
  } else if (movementMagnitude > 2) {
    lastContext.userMovement = 'moving';
  } else {
    lastContext.userMovement = 'still';
  }
  
  return lastContext;
};

// Generate dynamic guidance based on context
export const generateDynamicGuidance = async (
  faceDetected: boolean,
  detectedTools: string[] = [],
  movementMagnitude: number = 0,
  currentStep: string = ''
): Promise<string> => {
  // Update context
  updateContext(faceDetected, detectedTools, movementMagnitude);
  
  let guidance = '';
  
  // Handle different scenarios
  if (!faceDetected) {
    guidance = "I don't see your face clearly. Please position yourself in the camera view.";
  } else if (detectedTools.length > 0) {
    const tool = detectedTools[0].toLowerCase();
    
    if (tool.includes('foundation') || tool.includes('base')) {
      guidance = "I see you're using foundation. Start from the center of your face and blend outward using small circular motions.";
    } else if (tool.includes('blush') || tool.includes('cheek')) {
      guidance = "Smile to find the apples of your cheeks and apply blush with an upward motion toward your temples.";
    } else if (tool.includes('lip') || tool.includes('stick')) {
      guidance = "Start by defining your cupid's bow, then apply lipstick to your upper lip. Press your lips together to transfer color to your lower lip, then fill in any gaps.";
    } else if (tool.includes('eye') || tool.includes('shadow')) {
      guidance = "Apply a light base shadow all over your lid, then use a medium shade in your crease for dimension. Blend well for a seamless transition.";
    } else if (tool.includes('brush')) {
      guidance = "I see you're using a brush. Make sure to tap off excess product before applying to avoid fallout.";
    } else {
      guidance = `I see you're using ${tool}. What step are you working on now?`;
    }
  } else if (movementMagnitude > 5) {
    guidance = "I notice you're moving quite a bit. Try to keep still for more precise makeup application.";
  } else if (movementMagnitude < 1 && lastContext.userMovement === 'still') {
    guidance = "I see you're ready for the next step. " + (currentStep || "What would you like to work on next?");
  } else {
    // Default guidance based on current step
    guidance = currentStep || "I'm analyzing your movements. What makeup step would you like guidance on?";
  }
  
  // Generate speech from guidance
  await generateSpeech(guidance);
  
  return guidance;
};

export default {
  generateSpeech,
  stopSpeech,
  updateContext,
  generateDynamicGuidance
};
