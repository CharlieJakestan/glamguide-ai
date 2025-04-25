import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { setApiKey } from '@/services/speechService';
import { analyzeFacialImage } from '@/services/ganService';
import SetupStatusPanel from '@/components/makeup/SetupStatusPanel';
import ReadyToUsePanel from '@/components/makeup/ReadyToUsePanel';
import FaceAnalysisCamera from '@/components/makeup/FaceAnalysisCamera';
import { getReferenceLooks } from '@/services/lookReferenceService';
import { useReferenceLookGuidance } from '@/hooks/useReferenceLookGuidance';
import { initFaceDetection } from '@/lib/faceDetection';
import { init3DFaceModeling } from '@/lib/face3dModeling';
import { initVoiceInteraction, startListening, processCommand } from '@/services/voiceInteractionService';
import MakeupTips from '@/components/makeup/MakeupTips';
import { useSetupStatus } from '@/hooks/useSetupStatus';
import { useCamera } from '@/hooks/useCamera';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useAnalysisSetup } from '@/hooks/useAnalysisSetup';
import { useMakeupObjectDetection } from '@/hooks/useMakeupObjectDetection';
import { Loader2, Mic, MicOff } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { MovementData, DetectedObject } from '@/types/facial-analysis';
import { Button } from '@/components/ui/button';

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
    faceDetectionReady, setFaceDetectionReady,
    faceDetected,
    facePosition,
    movementData,
    lastActivity,
    detectionConfidence
  } = useFaceDetection({ 
    toast, 
    videoRef, 
    enabled: cameraActive 
  });
  
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

  const [face3dModelingReady, setFace3dModelingReady] = useState(false);
  const [voiceInteractionReady, setVoiceInteractionReady] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string | null>(null);
  
  useEffect(() => {
    const setupFaceDetection = async () => {
      try {
        const success = await initFaceDetection();
        setFaceDetectionReady(success);
        
        if (!success) {
          toast({
            title: "Face Detection Setup",
            description: "Using simplified face detection mode. Some advanced features may be limited.",
            variant: "default"
          });
        } else {
          console.log('Face detection models loaded successfully');
        }
      } catch (error) {
        console.error('Error setting up face detection:', error);
        setFaceDetectionReady(false);
        toast({
          title: "Face Detection Setup Failed",
          description: "Could not load face detection models. Using simplified mode.",
          variant: "default"
        });
      }
    };
    
    setupFaceDetection();
  }, [toast, setFaceDetectionReady]);
  
  useEffect(() => {
    const setup3DFaceModeling = async () => {
      try {
        const success = await init3DFaceModeling();
        setFace3dModelingReady(success);
        
        if (!success) {
          toast({
            title: "3D Modeling Setup",
            description: "Could not initialize 3D face modeling. Some advanced features will be limited.",
            variant: "default"
          });
        } else {
          console.log('3D face modeling initialized successfully');
        }
      } catch (error) {
        console.error('Error setting up 3D face modeling:', error);
        setFace3dModelingReady(false);
      }
    };
    
    setup3DFaceModeling();
  }, [toast]);
  
  useEffect(() => {
    const setupVoiceInteraction = () => {
      try {
        const handleVoiceCommand = (command: string) => {
          console.log('Voice command received:', command);
          setLastVoiceCommand(command);
          
          processCommand(command).then(response => {
            console.log('AI response:', response);
            
            if (command.includes('camera') && !cameraActive) {
              toggleCamera();
            } else if (command.includes('capture') && cameraActive) {
              captureAndAnalyzeFace();
            } else if (command.includes('look') && referenceLooks.length > 0) {
              const randomLook = referenceLooks[Math.floor(Math.random() * referenceLooks.length)];
              setSelectedLookId(randomLook.id);
              lookGuidance.setSelectedLookId(randomLook.id);
            }
          });
        };
        
        const success = initVoiceInteraction(handleVoiceCommand);
        setVoiceInteractionReady(success);
        
        if (success) {
          console.log('Voice interaction initialized successfully');
          startListening();
          setIsVoiceListening(true);
        } else {
          console.warn('Voice interaction initialization failed');
        }
      } catch (error) {
        console.error('Error setting up voice interaction:', error);
        setVoiceInteractionReady(false);
      }
    };
    
    setupVoiceInteraction();
  }, [toggleCamera, cameraActive, referenceLooks]);
  
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
  
  const [autoAnalysisInterval, setAutoAnalysisInterval] = useState<number | null>(null);
  
  useEffect(() => {
    if (cameraActive && faceDetected && !detectedFacialTraits && !isAnalyzing) {
      const timer = window.setTimeout(() => {
        captureAndAnalyzeFace();
      }, 2000);
      
      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [cameraActive, faceDetected, detectedFacialTraits, isAnalyzing]);
  
  useEffect(() => {
    if (cameraActive && faceDetected) {
      if (autoAnalysisInterval === null) {
        const interval = window.setInterval(() => {
          if (!isAnalyzing && detectedFacialTraits) {
            console.log('Running periodic analysis update');
            captureAndAnalyzeFace();
          }
        }, 30000);
        
        setAutoAnalysisInterval(interval);
      }
    } else {
      if (autoAnalysisInterval !== null) {
        window.clearInterval(autoAnalysisInterval);
        setAutoAnalysisInterval(null);
      }
    }
    
    return () => {
      if (autoAnalysisInterval !== null) {
        window.clearInterval(autoAnalysisInterval);
      }
    };
  }, [cameraActive, faceDetected, isAnalyzing, detectedFacialTraits]);
  
  const captureAndAnalyzeFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      const imageBase64 = captureFrame();
      
      if (!imageBase64) {
        throw new Error("Failed to capture frame");
      }
      
      try {
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
          throw new Error("Edge function returned invalid data");
        }
      } catch (error) {
        console.warn('Edge function failed, using mock data:', error);
        
        const mockTraits = generateMockFacialAnalysis();
        setDetectedFacialTraits(mockTraits);
        setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
        setProgressPercentage(5);
        
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
  
  const toggleVoiceListening = () => {
    if (isVoiceListening) {
      stopListening();
      setIsVoiceListening(false);
    } else {
      startListening();
      setIsVoiceListening(true);
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto mt-10">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <h2 className="text-xl font-medium text-gray-800">Loading AI Makeup System</h2>
            <p className="text-gray-600 mt-2">Initializing face detection models...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-pink-500">
              AI Makeup Look Generator
            </h2>
            
            {voiceInteractionReady && (
              <Button 
                variant={isVoiceListening ? "destructive" : "outline"}
                size="sm"
                onClick={toggleVoiceListening}
                className="flex items-center gap-2"
              >
                {isVoiceListening ? <MicOff size={16} /> : <Mic size={16} />}
                {isVoiceListening ? "Disable Voice" : "Enable Voice"} 
              </Button>
            )}
          </div>
          
          <p className="mb-6 text-gray-600">
            Create unique makeup looks with our AI-powered generator! Each look is uniquely
            generated just for you based on advanced face analysis technology.
          </p>
          
          {lastVoiceCommand && (
            <Alert variant="default" className="mb-4 bg-purple-50 border-purple-200">
              <AlertTitle>Voice Command Detected</AlertTitle>
              <AlertDescription>
                "{lastVoiceCommand}"
              </AlertDescription>
            </Alert>
          )}
          
          {!faceDetectionReady && (
            <Alert variant="default" className="mb-4">
              <AlertTitle>Limited Face Detection</AlertTitle>
              <AlertDescription>
                Using simplified face detection mode. Some advanced features may be limited, 
                but basic functionality will still work.
              </AlertDescription>
            </Alert>
          )}
          
          {!face3dModelingReady && (
            <Alert variant="default" className="mb-4">
              <AlertTitle>Limited 3D Face Modeling</AlertTitle>
              <AlertDescription>
                3D face modeling features are not available. Virtual makeup application will use 2D techniques instead.
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
              onVoiceEnabledChange={setVoiceEnabled}
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
              faceDetected={faceDetected}
              movementData={movementData ? {
                x: movementData.headPose?.yaw || 0,
                y: movementData.headPose?.pitch || 0,
                magnitude: movementData.headPose?.roll || 0
              } : { x: 0, y: 0, magnitude: 0 }}
              lastActivity={lastActivity}
              nearbyObjects={detectedObjects.map(obj => ({
                type: obj.type,
                position: { x: obj.confidence || 0, y: obj.confidence || 0 }
              }))}
              detectedMakeupTools={detectedMakeupTools}
              modelingEnabled={face3dModelingReady}
              voiceInteractionEnabled={voiceInteractionReady}
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

export default GanGenerator;
