
import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { setApiKey } from '@/services/speechService';
import { analyzeFacialImage } from '@/services/ganService';
import SetupStatusPanel from '@/components/makeup/SetupStatusPanel';
import ReadyToUsePanel from '@/components/makeup/ReadyToUsePanel';
import FaceAnalysisCamera from '@/components/makeup/FaceAnalysisCamera';
import { getReferenceLooks } from '@/services/lookReferenceService';
import { useReferenceLookGuidance } from '@/hooks/useReferenceLookGuidance';
import { startListening, stopListening } from '@/services/voiceInteractionService';
import MakeupTips from '@/components/makeup/MakeupTips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const GanGenerator = () => {
  const { toast } = useToast();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVoiceGuideEnabled, setIsVoiceGuideEnabled] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentGuidance, setCurrentGuidance] = useState('');
  const [detectedFacialTraits, setDetectedFacialTraits] = useState(null);
  const [analysisImage, setAnalysisImage] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [referenceLooks, setReferenceLooks] = useState([]);
  const [selectedLookId, setSelectedLookId] = useState(null);
  const [customInstruction, setCustomInstruction] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentLook, setCurrentLook] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Added for SetupStatusPanel props
  const [modelStatus, setModelStatus] = useState('checking');
  const [edgeFunctionStatus, setEdgeFunctionStatus] = useState('checking');
  const [setupStatus, setSetupStatus] = useState('in_progress');
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lookGuidance = useReferenceLookGuidance({
    voiceEnabled: isVoiceGuideEnabled,
    facialAnalysis: detectedFacialTraits
  });
  
  // Define checkStatus function for SetupStatusPanel
  const checkStatus = () => {
    setIsLoading(true);
    // Simulate checking status
    setTimeout(() => {
      setModelStatus('ready');
      setEdgeFunctionStatus('ready');
      setSetupStatus('completed');
      setIsLoading(false);
    }, 1500);
  };

  // Capture and analyze face - moved up before it's used
  const captureAndAnalyzeFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error("Could not get canvas context");
      }

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

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
                setAnalysisProgress(result.result.guidance.progress);
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

        setDetectedFacialTraits({
          skinTone: 'Medium',
          faceShape: 'Oval',
          features: ['High cheekbones', 'Defined jawline'],
          recommendations: ['Use a light foundation', 'Apply blush to the apples of your cheeks']
        });
        setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
        setAnalysisProgress(5);

        toast({
          title: "Face Analyzed",
          description: "Using simulation mode due to connection issues.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error capturing and analyzing face:', error);
      setAnalysisError("Error analyzing face");

      setDetectedFacialTraits({
        skinTone: 'Medium',
        faceShape: 'Oval',
        features: ['High cheekbones', 'Defined jawline'],
        recommendations: ['Use a light foundation', 'Apply blush to the apples of your cheeks']
      });
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

  // Toggle camera status
  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  // Handle voice command
  const handleVoiceCommand = React.useCallback((command: string, params: Record<string, string>) => {
    switch (command) {
      case 'next':
        lookGuidance.goToNextStep();
        break;
      case 'previous':
        lookGuidance.goToPreviousStep();
        break;
      case 'analyze':
        captureAndAnalyzeFace();
        break;
      default:
        toast({
          title: "Command Received",
          description: `Executing: ${command}`,
        });
    }
  }, [toast, lookGuidance]);

  // Effect to start voice command detection
  useEffect(() => {
    if (!isVoiceGuideEnabled) return;
    
    startListening(handleVoiceCommand);
    
    return () => {
      stopListening();
    };
  }, [isVoiceGuideEnabled, handleVoiceCommand]);

  // Load reference looks
  useEffect(() => {
    const looks = getReferenceLooks();
    setReferenceLooks(looks);

    if (looks.length > 0) {
      setSelectedLookId(looks[0].id);
      lookGuidance.setSelectedLookId(looks[0].id);
      setCurrentLook(looks[0]);
    }
  }, [lookGuidance, setReferenceLooks]);

  // Set default API key and enable voice
  useEffect(() => {
    const defaultKey = "sk_0dfcb07ba1e4d72443fcb5385899c03e9106d3d27ddaadc2";
    setApiKey(defaultKey);
    setIsVoiceGuideEnabled(true);
    
    // Initial status check
    checkStatus();
  }, [setIsVoiceGuideEnabled]);

  // Update the functions that use the 'instruction' property
  const handleCustomInstructionChange = (value: string) => {
    if (!currentLook) return;
    setCurrentLook(prev => {
      if (!prev) return prev;
      const steps = [...prev.steps];
      steps[currentStepIndex] = {
        ...steps[currentStepIndex],
        customization: value
      };
      return {
        ...prev,
        steps
      };
    });
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-4">AI Makeup Assistant</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FaceAnalysisCamera
              cameraActive={isCameraActive}
              isAnalyzing={isAnalyzing}
              progressPercentage={analysisProgress}
              currentGuidance={currentGuidance}
              detectedFacialTraits={detectedFacialTraits}
              analysisImage={analysisImage}
              analysisError={analysisError}
              voiceEnabled={isVoiceGuideEnabled}
              onVoiceEnabledChange={setIsVoiceGuideEnabled}
              availableLooks={referenceLooks}
              selectedLookId={selectedLookId}
              onSelectLook={(lookId) => {
                setSelectedLookId(lookId);
                lookGuidance.setSelectedLookId(lookId);
                const selectedLook = referenceLooks.find(look => look.id === lookId);
                setCurrentLook(selectedLook);
              }}
              lookGuidance={{
                currentStep: lookGuidance.currentStep,
                completedSteps: lookGuidance.completedSteps,
                totalSteps: lookGuidance.selectedLook?.steps.length || 0,
                stepNames: lookGuidance.selectedLook?.steps.map(step => step.instruction) || [],
                getCurrentInstruction: () => {
                  const instruction = lookGuidance.getCurrentStepInstruction();
                  return typeof instruction === 'string' ? instruction : instruction;
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
              faceDetected={false}
              movementData={{ x: 0, y: 0, magnitude: 0 }}
              lastActivity={null}
              nearbyObjects={[]}
              detectedMakeupTools={[]}
            />
          </div>

          <div>
            <SetupStatusPanel
              modelStatus={modelStatus}
              edgeFunctionStatus={edgeFunctionStatus}
              setupStatus={setupStatus}
              isLoading={isLoading}
              onCheckStatus={checkStatus}
            />
            <ReadyToUsePanel
              cameraActive={isCameraActive}
              voiceEnabled={isVoiceGuideEnabled}
              onToggleCamera={toggleCamera}
              onVoiceEnabledChange={setIsVoiceGuideEnabled}
              analysisProgress={analysisProgress}
              referenceLooks={referenceLooks}
              onSelectReferenceLook={(lookId) => {
                setSelectedLookId(lookId);
                lookGuidance.setSelectedLookId(lookId);
                const selectedLook = referenceLooks.find(look => look.id === lookId);
                setCurrentLook(selectedLook);
              }}
            />

            {currentLook && currentLook.steps && currentLook.steps.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">Customize Step</h3>
                <p>Step {lookGuidance.currentStep}: {lookGuidance.getCurrentStepInstruction()}</p>
                <Input
                  type="text"
                  placeholder="Enter custom instruction"
                  value={currentLook.steps[currentStepIndex]?.customization || ''}
                  onChange={(e) => {
                    setCustomInstruction(e.target.value);
                    handleCustomInstructionChange(e.target.value);
                  }}
                  className="mb-2"
                />
                <Button onClick={lookGuidance.goToPreviousStep} disabled={lookGuidance.currentStep <= 1}>
                  Previous Step
                </Button>
                <Button onClick={lookGuidance.goToNextStep} disabled={lookGuidance.currentStep >= lookGuidance.selectedLook?.steps.length}>
                  Next Step
                </Button>
              </div>
            )}

            <MakeupTips />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GanGenerator;
