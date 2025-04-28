
// Voice interaction service

let recognition: any | null = null; // Use any type for compatibility
let isListening = false;

interface VoiceCommandHandler {
  (command: string, params: Record<string, string>): void;
}

let commandHandler: VoiceCommandHandler | null = null;

// User session storage to track visits
const isFirstVisit = () => {
  const visited = localStorage.getItem('hasVisitedBefore');
  if (!visited) {
    localStorage.setItem('hasVisitedBefore', 'true');
    return true;
  }
  return false;
};

// Welcome message based on if it's the first visit or a returning visit
export const getWelcomeMessage = () => {
  return isFirstVisit()
    ? "Welcome to the AI Makeup Assistant! I'll help you apply makeup and provide guidance. What would you like to try today?"
    : "Welcome back to the AI Makeup Assistant! Ready to continue your makeup journey? What look would you like to try today?";
};

// Start voice interaction automatically
export const autoStartVoiceInteraction = (handler: VoiceCommandHandler, welcomeMessage?: string) => {
  startListening(handler);
  
  // Speak welcome message
  if (welcomeMessage || welcomeMessage === undefined) {
    const message = welcomeMessage || getWelcomeMessage();
    speakInstruction(message);
  }
  
  return true;
};

export const startListening = (onCommand: VoiceCommandHandler) => {
  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    console.error('Speech recognition not supported in this browser');
    return false;
  }
  
  const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition) as any;
  
  if (recognition) {
    recognition.stop();
  }
  
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  commandHandler = onCommand;
  
  recognition.onresult = (event: any) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    console.log('Voice command detected:', transcript);
    
    // Enhanced command parsing for makeup application
    const commands = {
      'next': /^next( step)?$/i,
      'previous': /^(previous|back)( step)?$/i,
      'analyze': /^(analyze|scan|detect)( face| makeup)?$/i,
      'stop': /^(stop|end)( listening)?$/i,
      'apply': /^apply (foundation|concealer|blush|lipstick|eyeshadow|mascara|eyeliner|powder|bronzer|highlighter)$/i,
      'blend': /^blend( makeup| it)?$/i,
      'complete': /^(complete|done|finished)$/i,
      'help': /^(help|what can i say|commands)$/i,
      'take picture': /^(take|capture) (picture|photo|image)$/i,
    };
    
    // Check if the transcript matches any command
    for (const [command, pattern] of Object.entries(commands)) {
      if (pattern.test(transcript)) {
        // Extract parameters for specific commands
        const params: Record<string, string> = {};
        
        if (command === 'apply') {
          const match = transcript.match(/apply (\w+)/);
          if (match && match[1]) {
            params.product = match[1];
          }
        }
        
        if (commandHandler) {
          commandHandler(command, params);
          // Provide voice feedback for recognized commands
          speakInstruction(`I heard you say ${transcript}. Processing your command.`);
        }
        break;
      }
    }
    
    // If no command matched, provide general response
    if (commandHandler) {
      commandHandler('general_input', { text: transcript });
      speakInstruction(`I heard you say ${transcript}. How can I help with your makeup?`);
    }
  };
  
  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
  };
  
  recognition.onend = () => {
    console.info('Speech recognition ended');
    isListening = false;
    // Auto restart if it was supposed to keep listening
    if (recognition && commandHandler) {
      console.info('Restarting voice command listening');
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
