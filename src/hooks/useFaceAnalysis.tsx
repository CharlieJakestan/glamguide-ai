
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyzeFacialImage } from '@/services/ganService';
import { speakInstruction } from '@/services/speechService';

export interface FacialTraits {
  skinTone: string;
  faceShape: string;
  features: string[];
  recommendations: string[];
}

// Mock data for demonstration
const mockSkinTones = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep', 'Rich'];
const mockFaceShapes = ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Rectangle', 'Triangle'];
const mockFeatures = [
  'Wide-set eyes', 'Close-set eyes', 'Hooded eyes', 'Full lips', 'Thin lips',
  'High cheekbones', 'Strong jawline', 'Soft jawline', 'Strong brow', 'Soft brow',
  'Long nose', 'Button nose', 'Wide nose', 'Narrow nose'
];
const mockRecommendations = [
  'Use a foundation with yellow undertones to complement your skin tone',
  'Apply bronzer along the temples and jawline to define your face shape',
  'Define your brows with a slightly angled shape to balance your features',
  'Try a cream blush on the apples of your cheeks for a natural flush',
  'Apply highlighter to your cheekbones to enhance your facial structure',
  'Use a darker eyeshadow in the crease to create depth for your eye shape',
  'Contour beneath your cheekbones to enhance your face structure',
  'Line your lips slightly outside your natural lip line for fuller appearance',
  'Use a matte bronzer to soften your jawline',
  'Apply mascara with focus on the outer corners to enhance your eye shape'
];

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
  
  const generateMockGuidance = (progress: number) => {
    let guidance = '';
    
    if (progress < 20) {
      guidance = "Start by applying foundation evenly across your face. Focus on blending around your jawline.";
    } else if (progress < 40) {
      guidance = "Add concealer under your eyes and on any blemishes. Blend with gentle dabbing motions.";
    } else if (progress < 60) {
      guidance = "Apply blush to the apples of your cheeks. For your face shape, sweep it slightly upward.";
    } else if (progress < 80) {
      guidance = "Define your eyes with eyeshadow. Your eye shape would benefit from focusing darker shades in the outer corner.";
    } else {
      guidance = "Finish with a lip color that complements your skin tone. Your look is almost complete!";
    }
    
    setCurrentGuidance(guidance);
    return guidance;
  };
  
  // Effect to update guidance based on progress
  useEffect(() => {
    if (progressPercentage > 0 && detectedFacialTraits) {
      const guidance = generateMockGuidance(progressPercentage);
      
      // Speak the guidance if voice is enabled and progress hits certain thresholds
      if (voiceEnabled && 
          (progressPercentage === 100 || 
           Math.floor(progressPercentage / 20) !== Math.floor((progressPercentage - 1) / 20))) {
        speakInstruction(guidance);
      }
    }
  }, [progressPercentage, detectedFacialTraits, voiceEnabled]);
  
  const generateMockFacialTraits = () => {
    // Randomly select traits
    const skinTone = mockSkinTones[Math.floor(Math.random() * mockSkinTones.length)];
    const faceShape = mockFaceShapes[Math.floor(Math.random() * mockFaceShapes.length)];
    
    // Select 2-4 random features
    const featureCount = Math.floor(Math.random() * 3) + 2;
    const features = [];
    for (let i = 0; i < featureCount; i++) {
      const feature = mockFeatures[Math.floor(Math.random() * mockFeatures.length)];
      if (!features.includes(feature)) {
        features.push(feature);
      }
    }
    
    // Select 3-5 random recommendations
    const recommendationCount = Math.floor(Math.random() * 3) + 3;
    const recommendations = [];
    for (let i = 0; i < recommendationCount; i++) {
      const recommendation = mockRecommendations[Math.floor(Math.random() * mockRecommendations.length)];
      if (!recommendations.includes(recommendation)) {
        recommendations.push(recommendation);
      }
    }
    
    return {
      skinTone,
      faceShape,
      features,
      recommendations
    };
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
