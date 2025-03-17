
import { useState, useEffect, useRef } from 'react';
import { MakeupLook, MakeupProduct } from '@/types/makeup';
import { 
  analyzeFaceMakeup, 
  generateNextStepGuidance, 
  suggestProductSubstitutions,
  FaceAnalysisResult,
  MakeupGuidance,
  sendFeedbackToAI
} from '@/services/makeupAIService';
import { speakInstruction } from '@/services/speechService';

interface UseMakeupGuidanceProps {
  isActive: boolean;
  currentLook: MakeupLook | null;
  availableProducts: MakeupProduct[];
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  faceDetected: boolean;
}

export const useMakeupGuidance = ({
  isActive,
  currentLook,
  availableProducts,
  canvasRef,
  videoRef,
  faceDetected
}: UseMakeupGuidanceProps) => {
  const [analysisResult, setAnalysisResult] = useState<FaceAnalysisResult | null>(null);
  const [currentGuidance, setCurrentGuidance] = useState<MakeupGuidance | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [substitutions, setSubstitutions] = useState<Record<string, string[]>>({});
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [region, setRegion] = useState<'usa' | 'korean' | 'indian' | 'european'>('usa');
  const [setupComplete, setSetupComplete] = useState(false);
  const [detectedTools, setDetectedTools] = useState<string[]>([]);
  
  const analysisPaused = useRef(false);
  const lastAnalysisTime = useRef(0);
  const analysisCycleTime = 5000; // Time between analysis cycles in ms
  const voiceQueue = useRef<string[]>([]);
  const isVoicePlaying = useRef(false);
  
  // Initialize and check setup status
  useEffect(() => {
    const checkSetup = async () => {
      try {
        // Test analysis, guidance and voice capabilities
        const testAnalysis = await analyzeFaceMakeup(
          new ImageData(1, 1), 
          'test', 
          'usa', 
          0
        );
        
        if (testAnalysis) {
          console.log('Makeup analysis service initialized successfully');
          setSetupComplete(true);
        }
      } catch (error) {
        console.error('Failed to initialize makeup guidance services:', error);
        setSetupComplete(false);
      }
    };
    
    checkSetup();
  }, []);
  
  // Update region based on the look's description or name
  useEffect(() => {
    if (!currentLook) return;
    
    const lookInfo = (currentLook.description || '') + ' ' + (currentLook.name || '');
    if (lookInfo.toLowerCase().includes('korean')) {
      setRegion('korean');
    } else if (lookInfo.toLowerCase().includes('indian')) {
      setRegion('indian');
    } else if (lookInfo.toLowerCase().includes('european')) {
      setRegion('european');
    } else {
      setRegion('usa'); // Default region
    }
  }, [currentLook]);
  
  // Generate product substitutions when the look or available products change
  useEffect(() => {
    if (!currentLook || availableProducts.length === 0) {
      setSubstitutions({});
      return;
    }
    
    const requiredProductIds = currentLook.products.map(p => p.product_id);
    const availableProductIds = availableProducts.map(p => p.id);
    
    // Get names for comparison instead of IDs
    const requiredProductNames = requiredProductIds.map(id => {
      const product = availableProducts.find(p => p.id === id);
      return product ? product.name : id;
    });
    
    const availableProductNames = availableProducts.map(p => p.name);
    
    const subs = suggestProductSubstitutions(requiredProductNames, availableProductNames);
    setSubstitutions(subs);
  }, [currentLook, availableProducts]);
  
  // Process voice queue
  useEffect(() => {
    const processVoiceQueue = async () => {
      if (!voiceEnabled || isVoicePlaying.current || voiceQueue.current.length === 0) {
        return;
      }
      
      const instruction = voiceQueue.current.shift();
      if (instruction) {
        isVoicePlaying.current = true;
        await speakInstruction(instruction);
        isVoicePlaying.current = false;
        
        // Process next item in queue after a small delay
        setTimeout(processVoiceQueue, 500);
      }
    };
    
    processVoiceQueue();
    
    const interval = setInterval(processVoiceQueue, 1000);
    return () => clearInterval(interval);
  }, [voiceEnabled]);
  
  // Add instruction to voice queue
  const queueVoiceInstruction = (instruction: string) => {
    if (!instruction) return;
    
    // Don't add duplicate instructions
    if (voiceQueue.current.includes(instruction)) {
      return;
    }
    
    voiceQueue.current.push(instruction);
  };
  
  const runAnalysisCycle = async () => {
    if (!isActive || !faceDetected || !videoRef.current || !canvasRef.current || !currentLook || analysisPaused.current) {
      return;
    }
    
    const now = Date.now();
    if (now - lastAnalysisTime.current < analysisCycleTime) {
      return;
    }
    
    lastAnalysisTime.current = now;
    setIsAnalyzing(true);
    
    try {
      // Get image data from the video
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Run analysis
      const analysis = await analyzeFaceMakeup(
        imageData, 
        currentLook.name || 'default', 
        region,
        analysisStep,
        detectedTools
      );
      
      setAnalysisResult(analysis);
      setAnalysisStep(prev => prev + 1);
      
      // Generate guidance
      const availableProductNames = availableProducts.map(p => p.name);
      const guidance = generateNextStepGuidance(
        analysis,
        currentLook.name || 'default',
        region,
        availableProductNames
      );
      
      setCurrentGuidance(guidance);
      
      // Queue voice guidance if enabled
      if (voiceEnabled && guidance) {
        analysisPaused.current = true;
        queueVoiceInstruction(guidance.voiceInstruction);
        
        // Allow next analysis after a short delay
        setTimeout(() => {
          analysisPaused.current = false;
        }, 5000);
      }
      
      // Send feedback to improve AI
      if (analysisStep % 5 === 0 && currentLook.id) {
        sendFeedbackToAI(
          currentLook.id,
          `Auto feedback: Analysis cycle ${analysisStep}, detected tools: ${detectedTools.join(', ')}`,
          true
        );
      }
    } catch (error) {
      console.error('Error in makeup analysis cycle:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Run analysis cycle periodically
  useEffect(() => {
    if (!isActive) return;
    
    const intervalId = setInterval(runAnalysisCycle, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isActive, faceDetected, currentLook, availableProducts, voiceEnabled, region, detectedTools]);
  
  // Update detected tools based on external input
  const updateDetectedTools = useCallback((tools: string[]) => {
    setDetectedTools(tools);
  }, []);
  
  const toggleVoiceGuidance = () => {
    setVoiceEnabled(prev => !prev);
  };
  
  const resetAnalysis = () => {
    setAnalysisStep(0);
    setAnalysisResult(null);
    setCurrentGuidance(null);
    voiceQueue.current = [];
  };
  
  return {
    analysisResult,
    currentGuidance,
    isAnalyzing,
    substitutions,
    voiceEnabled,
    toggleVoiceGuidance,
    resetAnalysis,
    region,
    setRegion,
    setVoiceEnabled,
    setupComplete,
    updateDetectedTools,
    queueVoiceInstruction
  };
};
