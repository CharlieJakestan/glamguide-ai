
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyzeFacialImage } from '@/services/ganService';

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
  
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
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
      
      // Call the GAN edge function to analyze the face
      const result = await analyzeFacialImage(imageBase64);
      
      if (result && result.status === 'ok' && result.result) {
        // Set the analysis results
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
            
            // Speak instruction if voice is enabled
            if (voiceEnabled && result.result.guidance.voiceInstruction) {
              const utterance = new SpeechSynthesisUtterance(result.result.guidance.voiceInstruction);
              window.speechSynthesis.speak(utterance);
            }
          }
          
          // Show the analyzed image
          if (result.result.imageUrl) {
            setAnalysisImage(result.result.imageUrl);
          }
        }
        
        toast({
          title: "Face Analyzed",
          description: "Your facial traits have been detected by our AI",
        });
        
        return true;
      } else {
        setAnalysisError(result?.message || "Analysis failed");
        toast({
          title: "Analysis Error",
          description: "Could not analyze the face image. Please try again.",
          variant: "destructive",
        });
        return false;
      }
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
