
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah voice

let apiKey: string | null = null;

export const setApiKey = (key: string) => {
  apiKey = key;
};

export const getApiKey = () => apiKey;

export const synthesizeSpeech = async (
  text: string, 
  voiceId: string = DEFAULT_VOICE_ID
): Promise<ArrayBuffer | null> => {
  if (!apiKey) {
    console.warn('ElevenLabs API key not set. Speech synthesis is disabled.');
    return null;
  }
  
  try {
    const response = await fetch(`${ELEVEN_LABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
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
    return null;
  }
};

// Function to speak the synthesized audio
export const speakInstruction = async (text: string): Promise<boolean> => {
  if (!text || !apiKey) return false;
  
  try {
    const audioData = await synthesizeSpeech(text);
    if (!audioData) return false;
    
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
  } catch (error) {
    console.error('Error speaking instruction:', error);
    return false;
  }
};
