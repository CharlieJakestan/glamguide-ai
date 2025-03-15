
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyzeFacialImage } from '@/services/ganService';
import { speakInstruction } from '@/services/speechService';
import { useMockFacialData } from './useMockFacialData';

export interface FacialTraits {
  skinTone: string;
  faceShape: string;
  features: string[];
  recommendations: string[];
}

export const useFaceAnalysis = (voiceEnabled: boolean) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentGuidance, setCurrentGuidance] = useState<string>("");
  const [detectedFacialTraits, setDetectedFacialTraits] = useState<FacialTraits | null>(null);
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  
  const { generateMockFacialTraits, generateMockGuidance } = useMockFacialData();
  
  // Clean up progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, []);
  
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const simulateProgressIncrease = () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
    }
    
    setProgressPercentage(0);
    
    progressIntervalRef.current = window.setInterval(() => {
      setProgressPercentage(prev => {
        const newValue = prev + (Math.random() * 5);
        if (newValue >= 100) {
          if (progressIntervalRef.current) {
            window.clearInterval(progressIntervalRef.current);
          }
          return 100;
        }
        return newValue;
      });
    }, 500);
  };
  
  // Effect to update guidance based on progress
  useEffect(() => {
    if (progressPercentage > 0 && detectedFacialTraits) {
      const guidance = generateMockGuidance(progressPercentage);
      setCurrentGuidance(guidance);
      
      // Speak the guidance if voice is enabled and progress hits certain thresholds
      if (voiceEnabled && 
          (progressPercentage === 100 || 
           Math.floor(progressPercentage / 20) !== Math.floor((progressPercentage - 1) / 20))) {
        speakInstruction(guidance);
      }
    }
  }, [progressPercentage, detectedFacialTraits, voiceEnabled, generateMockGuidance]);
  
  const analyzeFace = async (videoElement: HTMLVideoElement) => {
    try {
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
      
      // Convert to base64
      const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
      
      // Start simulated progress
      simulateProgressIncrease();
      
      try {
        // Try to call the actual GAN edge function
        const result = await analyzeFacialImage(imageBase64);
        
        if (result && result.status === 'ok' && result.result) {
          // Set the analysis results from the edge function
          const analysis = result.result.analysis;
          if (analysis) {
            setDetectedFacialTraits({
              skinTone: analysis.skinTone || 'Not detected',
              faceShape: analysis.faceShape || 'Not detected',
              features: analysis.features || [],
              recommendations: analysis.recommendations || []
            });
            
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
          }
        } else {
          // If edge function fails, use mock data
          const mockData = generateMockFacialTraits();
          setDetectedFacialTraits(mockData);
          
          // Generate initial guidance
          const guidance = generateMockGuidance(0);
          if (voiceEnabled) {
            speakInstruction(guidance);
          }
        }
      } catch (error) {
        console.warn('Edge function failed, using mock data:', error);
        
        // Use mock data as fallback
        const mockData = generateMockFacialTraits();
        setDetectedFacialTraits(mockData);
        
        // Generate initial guidance
        const guidance = generateMockGuidance(0);
        if (voiceEnabled) {
          speakInstruction(guidance);
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
  };
  
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
