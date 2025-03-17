
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah voice
const API_KEY_STORAGE_KEY = 'elevenlabs_api_key';
const DEFAULT_API_KEY = 'sk_0dfcb07ba1e4d72443fcb5385899c03e9106d3d27ddaadc2';

// Always use the default key
let apiKey: string = DEFAULT_API_KEY;

// Initialize in localStorage - only once
if (typeof window !== 'undefined' && !localStorage.getItem(API_KEY_STORAGE_KEY)) {
  localStorage.setItem(API_KEY_STORAGE_KEY, DEFAULT_API_KEY);
}

export const setApiKey = (key: string) => {
  // Even if someone tries to change it, we'll keep the default
  apiKey = DEFAULT_API_KEY;
  localStorage.setItem(API_KEY_STORAGE_KEY, DEFAULT_API_KEY);
};

export const getApiKey = () => {
  // Always return the default key
  return DEFAULT_API_KEY;
};

export const synthesizeSpeech = async (
  text: string, 
  voiceId: string = DEFAULT_VOICE_ID
): Promise<ArrayBuffer | null> => {
  try {
    const response = await fetch(`${ELEVEN_LABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': DEFAULT_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Speech synthesis failed: ${response.statusText}`);
    }
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Speech synthesis error:', error);
    // Fallback to native speech synthesis
    try {
      return useNativeSpeechSynthesis(text);
    } catch (e) {
      console.error('Native speech synthesis failed:', e);
      return null;
    }
  }
};

// Native browser speech synthesis fallback
const useNativeSpeechSynthesis = (text: string): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported in this browser'));
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to get a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('victoria')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    // Create audio data from speech synthesis
    // This is a mock since we can't directly get ArrayBuffer from SpeechSynthesis
    // Just return a placeholder that will allow the audio to play
    window.speechSynthesis.speak(utterance);
    
    // Create a dummy ArrayBuffer to satisfy the return type
    const dummyBuffer = new ArrayBuffer(8);
    resolve(dummyBuffer);
  });
};

// Function to speak the synthesized audio
export const speakInstruction = async (text: string): Promise<boolean> => {
  if (!text) return false;
  
  try {
    // Try ElevenLabs first
    const audioData = await synthesizeSpeech(text);
    
    if (audioData && audioData.byteLength > 8) {
      // Real audio data from ElevenLabs
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      return new Promise(resolve => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(true);
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        };
        
        audio.play().catch(err => {
          console.error('Error playing audio:', err);
          resolve(false);
        });
      });
    } else {
      // Dummy buffer from native speech synthesis
      // Native speech synthesis is already playing, so just wait a bit
      return new Promise(resolve => {
        setTimeout(() => resolve(true), text.length * 60); // Rough estimate of speech duration
      });
    }
  } catch (error) {
    console.error('Error speaking instruction:', error);
    return false;
  }
};

// Web Speech API recognition for conversational UI
let recognition: any = null;

// Initialize speech recognition
export const initSpeechRecognition = (onResult: (text: string) => void, onError?: (error: any) => void) => {
  try {
    // @ts-ignore - SpeechRecognition is not yet in the standard TypeScript DOM definitions
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        if (onResult) onResult(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (onError) onError(event);
      };
      
      return true;
    }
    
    console.warn('Speech Recognition not supported in this browser');
    return false;
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
    if (onError) onError(error);
    return false;
  }
};

// Start listening for voice commands
export const startListening = () => {
  if (recognition) {
    try {
      recognition.start();
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }
  return false;
};

// Stop listening for voice commands
export const stopListening = () => {
  if (recognition) {
    try {
      recognition.stop();
      return true;
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      return false;
    }
  }
  return false;
};

// Process voice commands
export const processVoiceCommand = (text: string): { command: string, params: Record<string, string> } => {
  const lowerText = text.toLowerCase();
  
  // Basic command detection
  const commands = {
    'start': ['start', 'begin', 'let\'s go', 'let\'s start'],
    'next': ['next', 'next step', 'continue', 'go on', 'what\'s next'],
    'previous': ['previous', 'go back', 'back', 'last step'],
    'repeat': ['repeat', 'say again', 'what was that'],
    'help': ['help', 'need help', 'how to', 'explain'],
    'stop': ['stop', 'pause', 'wait', 'hold on']
  };
  
  for (const [command, phrases] of Object.entries(commands)) {
    if (phrases.some(phrase => lowerText.includes(phrase))) {
      return { command, params: {} };
    }
  }
  
  // Handle specific product requests
  const productKeywords = ['lipstick', 'blush', 'eyeshadow', 'foundation', 'concealer', 'mascara', 'powder'];
  for (const product of productKeywords) {
    if (lowerText.includes(product)) {
      return { command: 'product', params: { product } };
    }
  }
  
  // If no command detected, treat as general query
  return { command: 'query', params: { text: text } };
};

export default {
  speakInstruction,
  initSpeechRecognition,
  startListening,
  stopListening,
  processVoiceCommand
};
