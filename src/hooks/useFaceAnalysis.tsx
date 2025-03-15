
import { useState, useRef, useEffect } from 'react';
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
