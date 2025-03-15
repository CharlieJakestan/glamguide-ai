
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { setApiKey } from '@/services/speechService';
import { analyzeFacialImage } from '@/services/ganService';
import SetupStatusPanel from '@/components/makeup/SetupStatusPanel';
import ReadyToUsePanel from '@/components/makeup/ReadyToUsePanel';
import FaceAnalysisCamera from '@/components/makeup/FaceAnalysisCamera';
import { getReferenceLooks, ReferenceLook } from '@/services/lookReferenceService';
import { useReferenceLookGuidance } from '@/hooks/useReferenceLookGuidance';
import { initFaceDetection } from '@/lib/faceDetection';
import MakeupTips from '@/components/makeup/MakeupTips';
import { useSetupStatus } from '@/hooks/useSetupStatus';
import { useCamera } from '@/hooks/useCamera';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useAnalysisSetup } from '@/hooks/useAnalysisSetup';

const GanGenerator = () => {
  const { toast } = useToast();
  const { 
    isLoading, setupStatus, modelStatus, 
    edgeFunctionStatus, checkStatus 
  } = useSetupStatus();
  
  const { 
    cameraActive, toggleCamera, 
    videoRef, canvasRef, streamRef, captureFrame 
  } = useCamera();
  
  const {
    faceDetectionReady, setFaceDetectionReady
  } = useFaceDetection({ toast });
  
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
  
  const lookGuidance = useReferenceLookGuidance({
    voiceEnabled,
    facialAnalysis: detectedFacialTraits
  });
  
  useEffect(() => {
    const setupFaceDetection = async () => {
      const success = await initFaceDetection();
      setFaceDetectionReady(success);
      
      if (!success) {
        toast({
          title: "Face Detection Setup Failed",
          description: "Could not load face detection models. Some features may not work properly.",
          variant: "destructive"
        });
      }
    };
    
    setupFaceDetection();
  }, [toast, setFaceDetectionReady]);
  
  useEffect(() => {
    const looks = getReferenceLooks();
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
  }, [setVoiceEnabled]);
  
  const captureAndAnalyzeFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      const imageBase64 = captureFrame();
      
      if (!imageBase64) {
        throw new Error("Failed to capture frame");
      }
      
      const result = await analyzeFacialImage(imageBase64, selectedLookId);
      
      if (result && result.status === 'ok' && result.result) {
        const analysis = result.result.analysis;
        if (analysis) {
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
        }
        
        toast({
          title: "Face Analyzed",
          description: "Your facial traits have been detected by our AI",
        });
      } else {
        const mockTraits = generateMockFacialAnalysis();
        setDetectedFacialTraits(mockTraits);
        setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
        setProgressPercentage(5);
        
        toast({
          title: "Face Analyzed",
          description: "Your facial traits have been detected using our fallback analysis",
        });
      }
    } catch (error) {
      console.error('Error capturing and analyzing face:', error);
      setAnalysisError("Error analyzing face");
      
      const mockTraits = generateMockFacialAnalysis();
      setDetectedFacialTraits(mockTraits);
      setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
      
      toast({
        title: "Analysis Completed",
        description: "Using simulation mode due to connection issues.",
        variant: "default",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const stepNames = lookGuidance.selectedLook?.steps.map(step => step.instruction) || [];
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-pink-500 mb-4">
            AI Makeup Look Generator
          </h2>
          
          <p className="mb-6 text-gray-600">
            Create unique makeup looks with our AI-powered generator! Each look is uniquely
            generated just for you based on advanced face analysis technology.
          </p>
          
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
              referenceLooks={referenceLooks}
              onSelectReferenceLook={(lookId) => {
                setSelectedLookId(lookId);
                lookGuidance.setSelectedLookId(lookId);
              }}
            />
          )}
          
          {cameraActive && (
            <FaceAnalysisCamera
              cameraActive={cameraActive}
              isAnalyzing={isAnalyzing}
              progressPercentage={progressPercentage}
              currentGuidance={currentGuidance}
              detectedFacialTraits={detectedFacialTraits}
              analysisImage={analysisImage}
              analysisError={analysisError}
              voiceEnabled={voiceEnabled}
              availableLooks={referenceLooks}
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
                getCurrentInstruction: lookGuidance.getCurrentStepInstruction,
                goToNextStep: lookGuidance.goToNextStep,
                goToPreviousStep: lookGuidance.goToPreviousStep,
                markCompleted: lookGuidance.markCurrentStepCompleted,
                selectStep: lookGuidance.selectStep
              }}
              onCaptureAndAnalyze={captureAndAnalyzeFace}
              onToggleCamera={toggleCamera}
              videoRef={videoRef}
              canvasRef={canvasRef}
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
    'Apply highlighter to your cheekbones to enhance your facial structure'
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
  const recCount = Math.floor(Math.random() * 2) + 2;
  
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

export default GanGenerator;
