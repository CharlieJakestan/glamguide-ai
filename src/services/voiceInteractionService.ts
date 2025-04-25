// Basic voice interaction service

let recognition: SpeechRecognition | null = null;
let isListening = false;

interface VoiceCommandHandler {
  (command: string, params: Record<string, string>): void;
}

let commandHandler: VoiceCommandHandler | null = null;

export const startListening = (onCommand: VoiceCommandHandler) => {
  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    console.error('Speech recognition not supported in this browser');
    return false;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (recognition) {
    recognition.stop();
  }
  
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  commandHandler = onCommand;
  
  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    console.log('Voice command detected:', transcript);
    
    // Simple command parsing
    const commands = {
      'next': /^next( step)?$/i,
      'previous': /^(previous|back)( step)?$/i,
      'analyze': /^(analyze|scan)( face)?$/i,
      'stop': /^(stop|end)( listening)?$/i,
    };
    
    // Check if the transcript matches any command
    for (const [command, pattern] of Object.entries(commands)) {
      if (pattern.test(transcript)) {
        if (commandHandler) {
          commandHandler(command, {});
        }
        break;
      }
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };
  
  recognition.onend = () => {
    console.info('Speech recognition ended');
    isListening = false;
    // Auto restart if it was supposed to keep listening
    if (recognition && commandHandler) {
      console.info('Started listening for voice commands');
      recognition.start();
      isListening = true;
    }
  };
  
  try {
    recognition.start();
    isListening = true;
    console.info('Started listening for voice commands');
    return true;
  } catch (error) {
    console.error('Error starting speech recognition:', error);
    return false;
  }
};

export const stopListening = () => {
  if (recognition) {
    recognition.stop();
    recognition = null;
    isListening = false;
    commandHandler = null;
    console.info('Stopped listening for voice commands');
    return true;
  }
  return false;
};

export const isVoiceListening = () => isListening;

export const speakInstruction = async (text: string): Promise<boolean> => {
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported in this browser');
    return false;
  }
  
  if (!text || typeof text !== 'string') {
    console.error('Invalid text provided for speech synthesis');
    return false;
  }
  
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      resolve(true);
    };
    
    utterance.onerror = () => {
      console.error('Error occurred during speech synthesis');
      resolve(false);
    };
    
    window.speechSynthesis.speak(utterance);
  });
};
