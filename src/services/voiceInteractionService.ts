
import { generateSpeech, stopSpeech, generateDynamicGuidance } from './voiceGuidanceService';
import { processVoiceCommand } from './speechService';

// Speech recognition instance
let recognition: any = null;
let isListening = false;
let commandProcessor: ((command: string) => void) | null = null;
let wakePhrases = ['hey makeup', 'hey assistant', 'hey beauty'];
let lastSpeechTime = 0;

// Initialize speech recognition
export const initVoiceInteraction = (onCommand: (command: string) => void): boolean => {
  try {
    // @ts-ignore - SpeechRecognition is not yet in the standard TypeScript DOM definitions
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return false;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log('Speech recognized:', transcript);
      
      const now = Date.now();
      const timeSinceLastSpeech = now - lastSpeechTime;
      lastSpeechTime = now;
      
      // Process wake words
      const isWakeWord = wakePhrases.some(phrase => transcript.includes(phrase));
      
      if (isWakeWord || timeSinceLastSpeech < 10000) {
        // Remove wake word from command
        let command = transcript;
        wakePhrases.forEach(phrase => {
          command = command.replace(phrase, '').trim();
        });
        
        // Only process if there's a command after wake word
        if (command) {
          if (onCommand) {
            onCommand(command);
          }
          
          if (commandProcessor) {
            commandProcessor(command);
          }
        }
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      isListening = false;
      
      // Auto-restart if error was not aborted by user
      if (event.error !== 'aborted') {
        setTimeout(startListening, 1000);
      }
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      isListening = false;
      
      // Auto-restart
      setTimeout(startListening, 300);
    };
    
    commandProcessor = onCommand;
    console.log('Voice interaction initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing voice interaction:', error);
    return false;
  }
};

// Start listening for commands
export const startListening = (): boolean => {
  if (!recognition) {
    console.warn('Voice interaction not initialized');
    return false;
  }
  
  try {
    if (!isListening) {
      recognition.start();
      isListening = true;
      console.log('Started listening for voice commands');
    }
    return true;
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    isListening = false;
    return false;
  }
};

// Stop listening for commands
export const stopListening = (): boolean => {
  if (!recognition) return false;
  
  try {
    recognition.stop();
    isListening = false;
    console.log('Stopped listening for voice commands');
    return true;
  } catch (error) {
    console.error('Error stopping voice recognition:', error);
    return false;
  }
};

// Process a command and generate response
export const processCommand = async (command: string): Promise<string> => {
  try {
    console.log('Processing command:', command);
    
    // Process command to determine intent
    const { command: intent, params } = processVoiceCommand(command);
    
    let response = "I didn't understand that command";
    
    switch (intent) {
      case 'open_camera':
        response = "Opening the camera for you";
        break;
      case 'capture_image':
        response = "Capturing your image now";
        break;
      case 'apply_makeup':
        if (params.product) {
          response = `Applying ${params.product} to your face`;
        } else {
          response = "What makeup would you like to apply?";
        }
        break;
      case 'next_step':
        response = "Moving to the next step";
        break;
      case 'previous_step':
        response = "Going back to the previous step";
        break;
      default:
        response = "I'll help you with that";
    }
    
    return response;
  } catch (error) {
    console.error('Error processing command:', error);
    return "Sorry, I couldn't process that request";
  }
};
