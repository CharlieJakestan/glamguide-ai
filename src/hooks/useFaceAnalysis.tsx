
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
  
  // Cache for previous analyses to avoid unnecessary API calls
  const analysisCacheRef = useRef<Map<string, any>>(new Map());
  
  // Timestamp of last analysis to throttle API calls
  const lastAnalysisTimestampRef = useRef<number>(0);
  
  // Enhanced error handling with retries
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  // Analyze face with enhanced caching, throttling and retries
  const analyzeFace = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      const now = Date.now();
      const timeSinceLastAnalysis = now - lastAnalysisTimestampRef.current;
      const MIN_ANALYSIS_INTERVAL = 5000; // 5 seconds minimum between full analyses
      
      // If we have a recent analysis and it's too soon for another, use cached data
      if (detectedFacialTraits && timeSinceLastAnalysis < MIN_ANALYSIS_INTERVAL) {
        console.log('Using cached analysis, time since last:', timeSinceLastAnalysis);
        
        // Still update the UI to show we're processing
        toast({
          title: "Using recent analysis",
          description: "Your face analysis is still current.",
        });
        
        // Update progress to indicate activity
        simulateProgressIncrease();
        return true;
      }
      
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      // Create a canvas to capture the current video frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error("Could not get canvas context");
      }
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Generate frame signature for caching
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const frameSig = hashString(imageBase64.substring(0, 1000)); // Hash first 1000 chars for speed
      
      // Check cache for similar analysis
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
      
      // Start simulated progress
      simulateProgressIncrease();
      
      try {
        // Try to call the actual GAN edge function
        const result = await analyzeFacialImage(imageBase64);
        
        // Update last analysis timestamp
        lastAnalysisTimestampRef.current = Date.now();
        
        if (result && result.status === 'ok' && result.result) {
          // Set the analysis results from the edge function
          const analysis = result.result.analysis;
          if (analysis) {
            const facialTraits = {
              skinTone: analysis.skinTone || 'Not detected',
              faceShape: analysis.faceShape || 'Not detected',
              features: analysis.features || [],
              recommendations: analysis.recommendations || []
            };
            
            setDetectedFacialTraits(facialTraits);
            
            // Start guidance based on analysis
            if (result.result.guidance?.currentStep) {
              setCurrentGuidance(result.result.guidance.currentStep);
              
              if (result.result.guidance.progress !== undefined) {
                setProgressPercentage(result.result.guidance.progress);
              }
            }
            
            // Show the analyzed image
            if (result.result.imageUrl) {
              setAnalysisImage(result.result.imageUrl);
            }
            
            // Cache the result
            analysisCacheRef.current.set(frameSig, {
              detectedFacialTraits: facialTraits,
              analysisImage: result.result.imageUrl
            });
            
            // Limit cache size
            if (analysisCacheRef.current.size > 20) {
              // Remove oldest entry (first key)
              const firstKey = analysisCacheRef.current.keys().next().value;
              analysisCacheRef.current.delete(firstKey);
            }
            
            // Reset retry counter on success
            setRetryCount(0);
          }
        } else {
          // If edge function returns an error status, fallback to mock data
          console.warn('Edge function returned error, using mock data:', result);
          fallbackToMockData();
        }
      } catch (error) {
        console.warn('Edge function failed, attempting retry or using mock data:', error);
        
        // Implement retry logic
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          
          toast({
            title: "Analysis Retry",
            description: `Retrying analysis (${retryCount + 1}/${MAX_RETRIES})...`,
          });
          
          // Short delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try again recursively
          return analyzeFace(videoElement);
        } else {
          // If max retries reached, fallback to mock data
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
  
  // Fallback to mock data when API fails
  const fallbackToMockData = useCallback(() => {
    const mockData = generateMockFacialTraits();
    setDetectedFacialTraits(mockData);
    
    // Generate initial guidance
    const guidance = generateMockGuidance(0);
    if (voiceEnabled) {
      speakInstruction(guidance);
    }
    
    setCurrentGuidance(guidance);
    
    // Use a fallback image or generate one
    setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
    
    toast({
      title: "Using Fallback Analysis",
      description: "Connection issues. Using AI simulation mode.",
      variant: "default",
    });
  }, [generateMockFacialTraits, generateMockGuidance, setDetectedFacialTraits, 
      setCurrentGuidance, setAnalysisImage, voiceEnabled, toast]);
  
  // Simple hash function for frame signatures
  const hashString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  };
  
  // Clear analysis cache when component unmounts
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
  };
};

// Camera stream management hook
const useCameraStream = () => {
  const streamRef = useRef<MediaStream | null>(null);
  
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);
  
  return { streamRef, stopCameraStream };
};
