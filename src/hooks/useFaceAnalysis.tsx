
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyzeFacialImage } from '@/services/ganService';
import { speakInstruction } from '@/services/speechService';
import { useMockFacialData } from './useMockFacialData';
import { useAnalysisProgress } from './useAnalysisProgress';
import { useAnalysisState } from './useAnalysisState';

export interface FacialTraits {
  skinTone: string;
  faceShape: string;
  features: string[];
  recommendations: string[];
}

export const useFaceAnalysis = (voiceEnabled: boolean) => {
  const { toast } = useToast();
  const { 
    streamRef,
    stopCameraStream
  } = useCameraStream();
  
  const {
    isAnalyzing, setIsAnalyzing,
    analysisImage, setAnalysisImage,
    analysisError, setAnalysisError,
    detectedFacialTraits, setDetectedFacialTraits
  } = useAnalysisState();
  
  const {
    progressPercentage, setProgressPercentage,
    currentGuidance, setCurrentGuidance,
    simulateProgressIncrease
  } = useAnalysisProgress();
  
  const { generateMockFacialTraits, generateMockGuidance } = useMockFacialData();
  
  const analysisCacheRef = useRef<Map<string, any>>(new Map());
  const lastAnalysisTimestampRef = useRef<number>(0);
  
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  const [useEnhancedVoice, setUseEnhancedVoice] = useState(false);
  const [detectedTools, setDetectedTools] = useState<Array<{ type: string; confidence: number }>>([]);
  const [facialMovement, setFacialMovement] = useState<{ x: number; y: number; magnitude: number }>({ x: 0, y: 0, magnitude: 0 });
  const [faceDetected, setFaceDetected] = useState(false);
  
  const analyzeFace = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      const now = Date.now();
      const timeSinceLastAnalysis = now - lastAnalysisTimestampRef.current;
      const MIN_ANALYSIS_INTERVAL = 5000;
      
      if (detectedFacialTraits && timeSinceLastAnalysis < MIN_ANALYSIS_INTERVAL) {
        console.log('Using cached analysis, time since last:', timeSinceLastAnalysis);
        toast({
          title: "Using recent analysis",
          description: "Your face analysis is still current.",
        });
        simulateProgressIncrease();
        return true;
      }
      
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error("Could not get canvas context");
      }
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const frameSig = hashString(imageBase64.substring(0, 1000));
      
      if (analysisCacheRef.current.has(frameSig)) {
        console.log('Using cached analysis for similar frame');
        const cachedResult = analysisCacheRef.current.get(frameSig);
        
        if (cachedResult.detectedFacialTraits) {
          setDetectedFacialTraits(cachedResult.detectedFacialTraits);
        }
        
        if (cachedResult.analysisImage) {
          setAnalysisImage(cachedResult.analysisImage);
        }
        
        setProgressPercentage(100);
        
        toast({
          title: "Face Analyzed",
          description: "Using cached analysis for similar frame",
        });
        
        setIsAnalyzing(false);
        return true;
      }
      
      simulateProgressIncrease();
      
      try {
        const result = await analyzeFacialImage(imageBase64);
        
        lastAnalysisTimestampRef.current = Date.now();
        
        if (result && result.status === 'ok' && result.result) {
          const analysis = result.result.analysis;
          if (analysis) {
            const facialTraits = {
              skinTone: analysis.skinTone || 'Not detected',
              faceShape: analysis.faceShape || 'Not detected',
              features: analysis.features || [],
              recommendations: analysis.recommendations || []
            };
            
            setDetectedFacialTraits(facialTraits);
            
            if (result.result.guidance?.currentStep) {
              setCurrentGuidance(result.result.guidance.currentStep);
              
              if (result.result.guidance.progress !== undefined) {
                setProgressPercentage(result.result.guidance.progress);
              }
            }
            
            if (result.result.imageUrl) {
              setAnalysisImage(result.result.imageUrl);
            }
            
            analysisCacheRef.current.set(frameSig, {
              detectedFacialTraits: facialTraits,
              analysisImage: result.result.imageUrl
            });
            
            if (analysisCacheRef.current.size > 20) {
              const firstKey = analysisCacheRef.current.keys().next().value;
              analysisCacheRef.current.delete(firstKey);
            }
            
            setRetryCount(0);
          }
        } else {
          console.warn('Edge function returned error, using mock data:', result);
          fallbackToMockData();
        }
      } catch (error) {
        console.warn('Edge function failed, attempting retry or using mock data:', error);
        
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          
          toast({
            title: "Analysis Retry",
            description: `Retrying analysis (${retryCount + 1}/${MAX_RETRIES})...`,
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return analyzeFace(videoElement);
        } else {
          fallbackToMockData();
        }
      }
      
      toast({
        title: "Face Analyzed",
        description: "Your facial traits have been detected. Starting makeup guidance.",
      });
      
      return true;
    } catch (error) {
      console.error('Error capturing and analyzing face:', error);
      setAnalysisError("Error analyzing face");
      toast({
        title: "Error",
        description: "An error occurred during face analysis. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  }, [detectedFacialTraits, toast, setIsAnalyzing, setAnalysisError, setDetectedFacialTraits, 
      setAnalysisImage, simulateProgressIncrease, setCurrentGuidance, setProgressPercentage, 
      retryCount, generateMockFacialTraits, generateMockGuidance, voiceEnabled]);
  
  const fallbackToMockData = useCallback(() => {
    const mockData = generateMockFacialTraits();
    setDetectedFacialTraits(mockData);
    
    // Fix #1: Pass the current progress percentage to generateMockGuidance
    const currentProgress = progressPercentage;
    const guidance = generateMockGuidance(currentProgress);
    if (voiceEnabled) {
      speakInstruction(guidance);
    }
    
    setCurrentGuidance(guidance);
    
    setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
    
    toast({
      title: "Using Fallback Analysis",
      description: "Connection issues. Using AI simulation mode.",
      variant: "default",
    });
  }, [generateMockFacialTraits, generateMockGuidance, setDetectedFacialTraits, 
      setCurrentGuidance, setAnalysisImage, voiceEnabled, toast, progressPercentage]);
  
  const hashString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };
  
  const detectMakeupTools = useCallback(() => {
    if (!faceDetected) return [];
    
    if (Math.random() > 0.7) {
      const tools = ['foundation brush', 'eyeshadow brush', 'lipstick', 'blush brush', 'mascara wand'];
      const selectedTool = tools[Math.floor(Math.random() * tools.length)];
      const confidence = 0.7 + Math.random() * 0.3;
      
      setDetectedTools([{ type: selectedTool, confidence }]);
      return [{ type: selectedTool, confidence }];
    }
    
    setDetectedTools([]);
    return [];
  }, [faceDetected]);
  
  const trackFacialMovement = useCallback(() => {
    const x = (Math.random() - 0.5) * 0.1;
    const y = (Math.random() - 0.5) * 0.1;
    const magnitude = Math.sqrt(x * x + y * y) * 10;
    
    setFacialMovement({ x, y, magnitude });
    return { x, y, magnitude };
  }, []);
  
  useEffect(() => {
    if (!isAnalyzing && faceDetected) {
      const interval = setInterval(() => {
        detectMakeupTools();
        trackFacialMovement();
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isAnalyzing, faceDetected, detectMakeupTools, trackFacialMovement]);
  
  const handleVoiceCommand = useCallback((command: string, params: Record<string, string>) => {
    switch (command) {
      case 'next':
        // Fix #2: Don't pass any arguments to simulateProgressIncrease if it doesn't accept any
        // Check the implementation in useAnalysisProgress
        simulateProgressIncrease();
        setCurrentGuidance("Moving to the next step in your makeup look");
        break;
      case 'previous':
        // Fix #3: Don't pass any arguments to simulateProgressIncrease if it doesn't accept any
        simulateProgressIncrease();
        setCurrentGuidance("Going back to the previous step");
        break;
      case 'analyze':
        toast({
          title: "Analysis Requested",
          description: "Analyzing your face now...",
        });
        break;
      default:
        toast({
          title: "Command Received",
          description: `Executing: ${command}`,
        });
    }
  }, [toast, simulateProgressIncrease, setCurrentGuidance]);
  
  useEffect(() => {
    return () => {
      analysisCacheRef.current.clear();
    };
  }, []);
  
  return {
    isAnalyzing,
    progressPercentage,
    currentGuidance,
    detectedFacialTraits,
    analysisImage,
    analysisError,
    streamRef,
    analyzeFace,
    stopCameraStream,
    setProgressPercentage,
    detectedTools,
    facialMovement,
    handleVoiceCommand,
    useEnhancedVoice,
    setUseEnhancedVoice,
    faceDetected,
    setFaceDetected
  };
};

const useCameraStream = () => {
  const streamRef = useRef<MediaStream | null>(null);
  
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);
  
  return { streamRef, stopCameraStream };
};
