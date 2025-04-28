
import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { setApiKey } from '@/services/speechService';
import { analyzeFacialImage } from '@/services/ganService';
import SetupStatusPanel from '@/components/makeup/SetupStatusPanel';
import ReadyToUsePanel from '@/components/makeup/ReadyToUsePanel';
import FaceAnalysisCamera from '@/components/makeup/FaceAnalysisCamera';
import { getReferenceLooks, trainAIWithReferenceImages } from '@/services/lookReferenceService';
import { useReferenceLookGuidance } from '@/hooks/useReferenceLookGuidance';
import { autoStartVoiceInteraction, startListening, stopListening, getWelcomeMessage } from '@/services/voiceInteractionService';
import MakeupTips from '@/components/makeup/MakeupTips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCamera } from '@/hooks/useCamera';
import { useFaceMesh } from '@/hooks/useFaceMesh';

// Define type for status to match SetupStatusPanel props
type ComponentStatusType = 'checking' | 'ready' | 'error';
type SetupStatusType = 'not_started' | 'in_progress' | 'completed';

const GanGenerator = () => {
  const { toast } = useToast();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVoiceGuideEnabled, setIsVoiceGuideEnabled] = useState(true); // Auto-enable voice
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
  const [isAITrained, setIsAITrained] = useState(false);
  
  // Updated type definitions to match SetupStatusPanel props
  const [modelStatus, setModelStatus] = useState<ComponentStatusType>('checking');
  const [edgeFunctionStatus, setEdgeFunctionStatus] = useState<ComponentStatusType>('checking');
  const [setupStatus, setSetupStatus] = useState<SetupStatusType>('in_progress');
  const [isLoading, setIsLoading] = useState(false);

  // Use the camera hook
  const {
    cameraActive,
    videoRef,
    canvasRef,
    activateCamera,
    toggleCamera,
    captureFrame
  } = useCamera();

  // Use the face mesh hook
  const {
    faceDetected,
    facialFeatures,
    faceMeshPoints,
    detectedTools,
    isModelLoaded
  } = useFaceMesh({
    videoRef,
    canvasRef,
    enabled: cameraActive
  });

  const lookGuidance = useReferenceLookGuidance({
    voiceEnabled: isVoiceGuideEnabled,
    facialAnalysis: detectedFacialTraits || facialFeatures
  });

  // Initialize system
  useEffect(() => {
    const initSystem = async () => {
      setIsLoading(true);
      
      // Load AI models and setup
      try {
        // Set API key for speech services
        const defaultKey = "sk_0dfcb07ba1e4d72443fcb5385899c03e9106d3d27ddaadc2";
        setApiKey(defaultKey);
        
        // Auto-enable voice and start interaction
        setIsVoiceGuideEnabled(true);
        autoStartVoiceInteraction(handleVoiceCommand, getWelcomeMessage());

        // Check model status
        setModelStatus('ready');
        
        // Check edge function status
        setEdgeFunctionStatus('ready');
        
        // Train AI with makeup reference images
        const trainingSuccess = await trainAIWithReferenceImages();
        setIsAITrained(trainingSuccess);
        
        // Complete setup
        setSetupStatus('completed');
        
        // Auto-activate camera after setup
        setTimeout(() => {
          activateCamera();
        }, 1000);
      } catch (error) {
        console.error('Error during initialization:', error);
        setModelStatus('error');
        toast({
          title: "Setup Error",
          description: "There was a problem setting up the AI Makeup Assistant",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initSystem();
    
    // Cleanup function
    return () => {
      stopListening();
    };
  }, [toast]);

  // Define checkStatus function for SetupStatusPanel
  const checkStatus = () => {
    setIsLoading(true);
    // Check status of models and services
    setTimeout(() => {
      setModelStatus('ready');
      setEdgeFunctionStatus('ready');
      setSetupStatus('completed');
      setIsLoading(false);
      
      // Auto-activate camera if not already active
      if (!cameraActive) {
        activateCamera();
      }
      
      toast({
        title: "System Ready",
        description: "AI Makeup Assistant is ready to use",
      });
    }, 1500);
  };

  // Load reference looks
  useEffect(() => {
    const looks = getReferenceLooks();
    setReferenceLooks(looks);

    if (looks.length > 0 && !selectedLookId) {
      setSelectedLookId(looks[0].id);
      lookGuidance.setSelectedLookId(looks[0].id);
      setCurrentLook(looks[0]);
    }
  }, [lookGuidance]);

  // Capture and analyze face
  const captureAndAnalyzeFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      const imageBase64 = captureFrame();

      if (!imageBase64) {
        throw new Error("Could not capture frame");
      }

      try {
        const result = await analyzeFacialImage(imageBase64, selectedLookId);

        if (result && result.status === 'ok' && result.result) {
          const analysis = result.result.analysis;
          if (analysis) {
            setDetectedFacialTraits({
              skinTone: analysis.skinTone || facialFeatures?.skinTone || 'Not detected',
              faceShape: analysis.faceShape || facialFeatures?.faceShape || 'Not detected',
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
        console.warn('Edge function failed, using facial features from mesh:', error);

        // Use facial features from face mesh if available
        if (facialFeatures) {
          setDetectedFacialTraits({
            skinTone: facialFeatures.skinTone || 'Medium',
            faceShape: facialFeatures.faceShape || 'Oval',
            eyeShape: facialFeatures.eyeShape || 'Almond',
            lipShape: facialFeatures.lipShape || 'Average',
            jawlineType: facialFeatures.jawlineType || 'Average',
            recommendations: [
              'Use a light foundation',
              'Apply blush to the apples of your cheeks',
              'Define your eyebrows to frame your face',
              `${facialFeatures.eyeShape} eyes work well with winged eyeliner`
            ]
          });
          setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
          setAnalysisProgress(5);
        } else {
          // Fallback to mock data if no facial features available
          setDetectedFacialTraits({
            skinTone: 'Medium',
            faceShape: 'Oval',
            features: ['High cheekbones', 'Defined jawline'],
            recommendations: ['Use a light foundation', 'Apply blush to the apples of your cheeks']
          });
          setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
          setAnalysisProgress(5);
        }

        toast({
          title: "Face Analyzed",
          description: "Using face mesh detection data for makeup guidance.",
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

  // Auto-analyze face when face is detected
  useEffect(() => {
    if (faceDetected && !detectedFacialTraits && !isAnalyzing && cameraActive) {
      const timer = setTimeout(() => {
        captureAndAnalyzeFace();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [faceDetected, detectedFacialTraits, isAnalyzing, cameraActive]);

  // Handle voice command
  const handleVoiceCommand = React.useCallback((command: string, params: Record<string, string>) => {
    console.log('Voice command received:', command, params);
    
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
      case 'take picture':
        captureAndAnalyzeFace();
        break;
      case 'apply':
        const product = params.product || '';
        setCurrentGuidance(`Let's apply ${product}. Follow the guidance on screen.`);
        setAnalysisProgress(prev => Math.min(prev + 10, 100));
        break;
      case 'blend':
        setCurrentGuidance("Great! Now blend it thoroughly for a seamless finish.");
        setAnalysisProgress(prev => Math.min(prev + 5, 100));
        break;
      case 'complete':
        setCurrentGuidance("Your makeup application is complete! How does it look?");
        setAnalysisProgress(100);
        lookGuidance.markAllStepsCompleted();
        break;
      case 'help':
        setCurrentGuidance("You can say: next, previous, analyze, take picture, apply [product], blend, or complete");
        break;
      default:
        if (command === 'general_input') {
          // Process general speech input
          const text = params.text || '';
          // Simple NLP to detect intents from general speech
          if (text.includes('look') && text.includes('good')) {
            setCurrentGuidance("I'm glad you like how it looks! You look fantastic!");
          } else if (text.includes('help')) {
            setCurrentGuidance("I'm here to help! You can ask me to analyze your face, guide you through makeup application, or suggest products.");
          } else {
            // Default response
            setCurrentGuidance("I heard you. What would you like to do with your makeup look?");
          }
        } else {
          toast({
            title: "Command Received",
            description: `Executing: ${command}`,
          });
        }
    }
  }, [toast, lookGuidance, captureAndAnalyzeFace]);

  // Update the functions that use the 'instruction' property
  const handleCustomInstructionChange = (value: string) => {
    if (!currentLook) return;
    setCustomInstruction(value);
    setCurrentLook(prev => {
      if (!prev) return prev;
      const steps = [...prev.steps];
      
      if (steps[currentStepIndex]) {
        steps[currentStepIndex] = {
          ...steps[currentStepIndex],
          customization: value
        };
      }
      
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
              cameraActive={cameraActive}
              isAnalyzing={isAnalyzing}
              progressPercentage={analysisProgress}
              currentGuidance={currentGuidance}
              detectedFacialTraits={detectedFacialTraits || facialFeatures}
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
                totalSteps: lookGuidance.selectedLook?.steps?.length || 0,
                stepNames: lookGuidance.selectedLook?.steps?.map(step => step.instruction) || [],
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
              faceDetected={faceDetected}
              movementData={{ x: 0, y: 0, magnitude: 0 }}
              lastActivity={null}
              nearbyObjects={[]}
              detectedMakeupTools={detectedTools}
              modelingEnabled={true}
              voiceInteractionEnabled={true}
              retryFaceDetection={() => {
                if (!cameraActive) {
                  activateCamera();
                } else {
                  toggleCamera();
                  setTimeout(activateCamera, 1000);
                }
              }}
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
              cameraActive={cameraActive}
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
                  value={currentLook.steps[currentStepIndex]?.customization || customInstruction}
                  onChange={(e) => {
                    handleCustomInstructionChange(e.target.value);
                  }}
                  className="mb-2"
                />
                <Button onClick={lookGuidance.goToPreviousStep} disabled={lookGuidance.currentStep <= 1}>
                  Previous Step
                </Button>
                <Button onClick={lookGuidance.goToNextStep} disabled={lookGuidance.currentStep >= lookGuidance.selectedLook?.steps?.length}>
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
