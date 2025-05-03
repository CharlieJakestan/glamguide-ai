
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { setApiKey } from '@/services/speechService';
import { analyzeFacialImage } from '@/services/ganService';
import SetupStatusPanel from '@/components/makeup/SetupStatusPanel';
import ReadyToUsePanel from '@/components/makeup/ReadyToUsePanel';
import AdvancedFaceAnalysisCamera from '@/components/makeup/AdvancedFaceAnalysisCamera';
import { getReferenceLooks, ReferenceLook } from '@/services/lookReferenceService';
import { useReferenceLookGuidance } from '@/hooks/useReferenceLookGuidance';
import { initAdvancedFaceDetection } from '@/lib/advancedFaceDetection';
import MakeupTips from '@/components/makeup/MakeupTips';
import { useSetupStatus } from '@/hooks/useSetupStatus';
import { useCamera } from '@/hooks/useCamera';
import { useAnalysisSetup } from '@/hooks/useAnalysisSetup';
import { useMakeupObjectDetection } from '@/hooks/useMakeupObjectDetection';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const GanGeneratorAdvanced = () => {
  const { toast } = useToast();
  const { 
    isLoading, setupStatus, modelStatus, 
    edgeFunctionStatus, checkStatus 
  } = useSetupStatus();
  
  const { 
    cameraActive, toggleCamera, activateCamera,
    videoRef, canvasRef, streamRef, captureFrame,
    permissionDenied, deviceNotFound
  } = useCamera();
  
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const [facePosition, setFacePosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [faceDetected, setFaceDetected] = useState(false);
  
  const {
    voiceEnabled, setVoiceEnabled,
    currentGuidance, setCurrentGuidance,
    progressPercentage, setProgressPercentage,
    detectedFacialTraits, setDetectedFacialTraits,
    analysisImage, setAnalysisImage,
    analysisError, setAnalysisError,
    isAnalyzing, setIsAnalyzing,
    referenceLooks, setReferenceLooks,
    selectedLookId, setSelectedLookId
  } = useAnalysisSetup();
  
  const {
    detectedObjects,
    detectedMakeupTools
  } = useMakeupObjectDetection({
    videoRef,
    facePosition,
    enabled: cameraActive && faceDetected
  });
  
  const lookGuidance = useReferenceLookGuidance({
    voiceEnabled,
    facialAnalysis: detectedFacialTraits
  });
  
  useEffect(() => {
    const setupFaceDetection = async () => {
      try {
        console.log('Setting up face detection...');
        const success = await initAdvancedFaceDetection();
        console.log('Face detection setup result:', success);
        setFaceDetectionReady(success);
        
        if (!success) {
          toast({
            title: "Advanced Face Detection Setup Failed",
            description: "Could not load advanced face detection models. Some features may not work properly.",
            variant: "destructive"
          });
        } else {
          console.log('Advanced face detection models loaded successfully');
        }
      } catch (error) {
        console.error('Error setting up face detection:', error);
        setFaceDetectionReady(false);
        toast({
          title: "Face Detection Error",
          description: "Failed to initialize face detection. Please refresh the page and try again.",
          variant: "destructive"
        });
      }
    };
    
    setupFaceDetection();
  }, [toast]);
  
  useEffect(() => {
    const looks = getReferenceLooks();
    console.log('Loaded reference looks:', looks.length);
    setReferenceLooks(looks);
    
    if (looks.length > 0 && !selectedLookId) {
      setSelectedLookId(looks[0].id);
      lookGuidance.setSelectedLookId(looks[0].id);
    }
  }, [selectedLookId, lookGuidance, setReferenceLooks, setSelectedLookId]);
  
  useEffect(() => {
    const defaultKey = "sk_0dfcb07ba1e4d72443fcb5385899c03e9106d3d27ddaadc2";
    setApiKey(defaultKey);
    setVoiceEnabled(true);
    
    // Auto-activate camera after a short delay
    setTimeout(() => {
      if (!cameraActive) {
        console.log('Auto-activating camera...');
        activateCamera();
      }
    }, 1000);
  }, [setVoiceEnabled, cameraActive, activateCamera]);
  
  const [autoAnalysisInterval, setAutoAnalysisInterval] = useState<number | null>(null);
  
  useEffect(() => {
    if (cameraActive && !detectedFacialTraits && !isAnalyzing) {
      const timer = window.setTimeout(() => {
        captureAndAnalyzeFace();
      }, 2000);
      
      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [cameraActive, detectedFacialTraits, isAnalyzing]);
  
  const captureAndAnalyzeFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('Cannot capture and analyze: video or canvas ref not available');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      console.log('Capturing frame for analysis...');
      const imageBase64 = captureFrame();
      
      if (!imageBase64) {
        throw new Error("Failed to capture frame");
      }
      
      try {
        console.log('Sending frame to GAN service for analysis...');
        const result = await analyzeFacialImage(imageBase64, selectedLookId);
        
        if (result && result.status === 'ok' && result.result) {
          const analysis = result.result.analysis;
          if (analysis) {
            console.log('Analysis received:', analysis);
            setDetectedFacialTraits({
              skinTone: analysis.skinTone || 'Not detected',
              faceShape: analysis.faceShape || 'Not detected',
              features: analysis.features || [],
              recommendations: analysis.recommendations || []
            });
            
            if (result.result.guidance?.currentStep) {
              setCurrentGuidance(result.result.guidance.currentStep);
              
              if (result.result.guidance.progress !== undefined) {
                setProgressPercentage(result.result.guidance.progress);
              }
            }
            
            if (result.result.imageUrl) {
              setAnalysisImage(result.result.imageUrl);
            }
            
            setFaceDetected(true);
          }
          
          toast({
            title: "Face Analyzed",
            description: "Your facial traits have been detected by our AI",
          });
        } else {
          throw new Error("Edge function returned invalid data");
        }
      } catch (error) {
        console.warn('Edge function failed, using mock data:', error);
        
        const mockTraits = generateMockFacialAnalysis();
        setDetectedFacialTraits(mockTraits);
        setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
        setProgressPercentage(5);
        
        // Set face as detected even with mock data
        setFaceDetected(true);
        
        toast({
          title: "Face Analyzed",
          description: "Using simulation mode due to connection issues.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error capturing and analyzing face:', error);
      setAnalysisError("Error analyzing face");
      
      const mockTraits = generateMockFacialAnalysis();
      setDetectedFacialTraits(mockTraits);
      setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
      setFaceDetected(true);
      
      toast({
        title: "Analysis Completed",
        description: "Using simulation mode due to connection issues.",
        variant: "default",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    videoRef, canvasRef, captureFrame, selectedLookId, setIsAnalyzing, setAnalysisError,
    setDetectedFacialTraits, setAnalysisImage, setCurrentGuidance, setProgressPercentage, toast
  ]);
  
  const stepNames = lookGuidance.selectedLook?.steps.map(step => step.instruction) || [];
  
  const handleCustomInstructionChange = (value: string) => {
    console.log("Custom instruction changed to:", value);
  };
  
  if (isLoading && !faceDetectionReady) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto mt-10">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <h2 className="text-xl font-medium text-gray-800">Loading Advanced AI Makeup System</h2>
            <p className="text-gray-600 mt-2">Initializing advanced face detection models...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  type MakeupReferenceWithCategory = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    category: string;
    tags?: string[];
  };

  const ensureCategoryInReferenceLooks = (looks: ReferenceLook[]): MakeupReferenceWithCategory[] => {
    return looks.map(look => ({
      id: look.id,
      name: look.name,
      description: look.description,
      imageUrl: look.imageUrl,
      category: look.category || look.occasion || 'general',
      tags: look.tags,
    }));
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-pink-500 mb-4">
            Advanced AI Makeup Assistant
          </h2>
          
          <p className="mb-6 text-gray-600">
            Experience our new advanced AI makeup assistant with real-time face tracking, AR makeup try-on, 
            and interactive guidance powered by artificial intelligence.
          </p>
          
          {permissionDenied && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Camera Permission Denied</AlertTitle>
              <AlertDescription>
                You've blocked camera access. Please reset permissions in your browser settings and refresh the page.
              </AlertDescription>
            </Alert>
          )}
          
          {deviceNotFound && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>No Camera Found</AlertTitle>
              <AlertDescription>
                No camera was detected. Please connect a camera and reload the page.
              </AlertDescription>
            </Alert>
          )}
          
          {!faceDetectionReady && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Advanced Face Detection Not Ready</AlertTitle>
              <AlertDescription>
                The advanced face detection system failed to initialize. Some features may not work correctly.
                Please reload the page or try again later.
              </AlertDescription>
            </Alert>
          )}
          
          <SetupStatusPanel
            modelStatus={modelStatus}
            edgeFunctionStatus={edgeFunctionStatus}
            setupStatus={setupStatus}
            isLoading={isLoading}
            onCheckStatus={checkStatus}
          />
          
          {setupStatus === 'completed' && (
            <ReadyToUsePanel
              cameraActive={cameraActive}
              voiceEnabled={voiceEnabled}
              onToggleCamera={toggleCamera}
              onVoiceEnabledChange={setVoiceEnabled}
              analysisProgress={progressPercentage}
              referenceLooks={ensureCategoryInReferenceLooks(referenceLooks)}
              onSelectReferenceLook={(lookId) => {
                setSelectedLookId(lookId);
                lookGuidance.setSelectedLookId(lookId);
              }}
            />
          )}
          
          {cameraActive && (
            <AdvancedFaceAnalysisCamera
              cameraActive={cameraActive}
              isAnalyzing={isAnalyzing}
              progressPercentage={progressPercentage}
              currentGuidance={currentGuidance}
              detectedFacialTraits={detectedFacialTraits}
              analysisImage={analysisImage}
              analysisError={analysisError}
              voiceEnabled={voiceEnabled}
              onVoiceEnabledChange={setVoiceEnabled}
              availableLooks={ensureCategoryInReferenceLooks(referenceLooks)}
              selectedLookId={selectedLookId}
              onSelectLook={(lookId) => {
                setSelectedLookId(lookId);
                lookGuidance.setSelectedLookId(lookId);
              }}
              lookGuidance={{
                currentStep: lookGuidance.currentStep,
                completedSteps: lookGuidance.completedSteps,
                totalSteps: stepNames.length,
                stepNames,
                getCurrentInstruction: () => {
                  const instruction = lookGuidance.getCurrentStepInstruction();
                  return typeof instruction === 'string' ? instruction : String(instruction);
                },
                goToNextStep: lookGuidance.goToNextStep,
                goToPreviousStep: lookGuidance.goToPreviousStep,
                markCompleted: lookGuidance.markCurrentStepCompleted,
                selectStep: lookGuidance.selectStep
              }}
              onCaptureAndAnalyze={captureAndAnalyzeFace}
              onToggleCamera={toggleCamera}
              videoRef={videoRef}
              canvasRef={canvasRef}
              faceDetected={faceDetected}
              movementData={{ x: 0, y: 0, magnitude: 0 }}
              lastActivity={null}
              nearbyObjects={[]}
              detectedMakeupTools={detectedMakeupTools}
              retryFaceDetection={() => {
                if (cameraActive) {
                  toggleCamera();
                  setTimeout(() => {
                    activateCamera();
                  }, 500);
                } else {
                  activateCamera();
                }
              }}
            />
          )}
          
          <MakeupTips />
        </div>
      </div>
    </Layout>
  );
};

const generateMockFacialAnalysis = () => {
  const skinTones = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep', 'Rich'];
  const faceShapes = ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Rectangle'];
  const features = [
    'Wide-set eyes', 'Close-set eyes', 'Hooded eyes', 'Full lips', 'Thin lips',
    'High cheekbones', 'Strong jawline', 'Soft jawline', 'Strong brow', 'Soft brow'
  ];
  const recommendations = [
    'Use a foundation with yellow undertones to complement your skin tone',
    'Apply bronzer along the temples and jawline to define your face shape',
    'Define your brows with a slightly angled shape to balance your features',
    'Try a cream blush on the apples of your cheeks for a natural flush',
    'Apply highlighter to your cheekbones to enhance your facial structure',
    'Use a lip liner to define your natural lip shape before applying lipstick',
    'Apply eyeshadow in a gradient from light to dark to create depth',
    'Curl your lashes before applying mascara for a more open-eyed look'
  ];
  
  const skinTone = skinTones[Math.floor(Math.random() * skinTones.length)];
  const faceShape = faceShapes[Math.floor(Math.random() * faceShapes.length)];
  
  const selectedFeatures: string[] = [];
  const featureCount = Math.floor(Math.random() * 2) + 2;
  
  for (let i = 0; i < featureCount; i++) {
    const feature = features[Math.floor(Math.random() * features.length)];
    if (!selectedFeatures.includes(feature)) {
      selectedFeatures.push(feature);
    }
  }
  
  const selectedRecommendations: string[] = [];
  const recCount = Math.floor(Math.random() * 2) + 3;
  
  for (let i = 0; i < recCount; i++) {
    const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
    if (!selectedRecommendations.includes(rec)) {
      selectedRecommendations.push(rec);
    }
  }
  
  return {
    skinTone,
    faceShape,
    features: selectedFeatures,
    recommendations: selectedRecommendations
  };
};

export default GanGeneratorAdvanced;
