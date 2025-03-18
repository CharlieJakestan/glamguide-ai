
import React, { useEffect, useState } from 'react';
import { Camera, CameraOff, Sparkles, Zap, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VideoDisplay from '@/components/camera/VideoDisplay';
import FacialAnalysisDisplay from './FacialAnalysisDisplay';
import LookStepNavigation from './LookStepNavigation';
import AdvancedAIAssistant from '@/ai/AdvancedAIAssistant';
import { useAdvancedFaceDetection } from '@/hooks/useAdvancedFaceDetection';

interface AdvancedFaceAnalysisCameraProps {
  cameraActive: boolean;
  isAnalyzing?: boolean;
  progressPercentage: number;
  currentGuidance: string;
  detectedFacialTraits: any;
  analysisImage: string | null;
  analysisError: string | null;
  voiceEnabled: boolean;
  onVoiceEnabledChange: (enabled: boolean) => void;
  availableLooks: Array<any>;
  selectedLookId: string;
  onSelectLook: (lookId: string) => void;
  lookGuidance: {
    currentStep: number;
    completedSteps: number[];
    totalSteps: number;
    stepNames: string[];
    getCurrentInstruction: () => string;
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    markCompleted: () => void;
    selectStep: (step: number) => void;
  };
  onCaptureAndAnalyze: () => void;
  onToggleCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const AdvancedFaceAnalysisCamera: React.FC<AdvancedFaceAnalysisCameraProps> = ({
  cameraActive,
  isAnalyzing = false,
  progressPercentage,
  currentGuidance,
  detectedFacialTraits,
  analysisImage,
  analysisError,
  voiceEnabled,
  onVoiceEnabledChange,
  availableLooks,
  selectedLookId,
  onSelectLook,
  lookGuidance,
  onCaptureAndAnalyze,
  onToggleCamera,
  videoRef,
  canvasRef
}) => {
  const [virtualMakeup, setVirtualMakeup] = useState<any>({
    lips: { color: 'rgba(220, 80, 120, 0.7)', intensity: 0.7, glossy: true },
    eyes: { color: 'rgba(120, 100, 180, 0.6)', intensity: 0.5 },
    cheeks: { color: 'rgba(240, 120, 120, 0.5)', intensity: 0.4 },
    foundation: { color: 'rgba(245, 222, 179, 0.3)', coverage: 0.3 }
  });
  
  const [showAREffects, setShowAREffects] = useState(true);
  
  // Use the advanced face detection hook
  const {
    faceDetectionReady,
    faceDetected,
    detectionConfidence,
    makeupRegions,
    faceLandmarks,
    movementData,
    facialAttributes,
    detectedActions
  } = useAdvancedFaceDetection({
    videoRef,
    canvasRef,
    enabled: cameraActive,
    virtualMakeup: showAREffects ? virtualMakeup : undefined
  });
  
  // Update makeup look based on selected look (would connect to a database of looks in a real app)
  useEffect(() => {
    if (selectedLookId) {
      // Find the selected look
      const selectedLook = availableLooks.find(look => look.id === selectedLookId);
      
      if (selectedLook) {
        // Each look would have associated makeup colors and styles
        // This is a simplified example - in a real app you would have more detailed makeup information
        if (selectedLook.name.toLowerCase().includes('natural')) {
          setVirtualMakeup({
            lips: { color: 'rgba(220, 150, 150, 0.5)', intensity: 0.5, glossy: true },
            eyes: { color: 'rgba(180, 160, 140, 0.4)', intensity: 0.4 },
            cheeks: { color: 'rgba(230, 180, 160, 0.4)', intensity: 0.3 },
            foundation: { color: 'rgba(245, 222, 190, 0.2)', coverage: 0.2 }
          });
        } else if (selectedLook.name.toLowerCase().includes('glam')) {
          setVirtualMakeup({
            lips: { color: 'rgba(220, 50, 90, 0.8)', intensity: 0.8, glossy: false },
            eyes: { color: 'rgba(60, 60, 80, 0.7)', intensity: 0.7 },
            cheeks: { color: 'rgba(250, 120, 120, 0.6)', intensity: 0.6 },
            foundation: { color: 'rgba(245, 222, 179, 0.4)', coverage: 0.4 }
          });
        } else if (selectedLook.name.toLowerCase().includes('bold')) {
          setVirtualMakeup({
            lips: { color: 'rgba(180, 30, 60, 0.9)', intensity: 0.9, glossy: false },
            eyes: { color: 'rgba(80, 40, 100, 0.8)', intensity: 0.8 },
            cheeks: { color: 'rgba(240, 100, 100, 0.7)', intensity: 0.6 },
            foundation: { color: 'rgba(245, 222, 179, 0.5)', coverage: 0.5 }
          });
        } else {
          // Default makeup
          setVirtualMakeup({
            lips: { color: 'rgba(220, 80, 120, 0.7)', intensity: 0.7, glossy: true },
            eyes: { color: 'rgba(120, 100, 180, 0.6)', intensity: 0.5 },
            cheeks: { color: 'rgba(240, 120, 120, 0.5)', intensity: 0.4 },
            foundation: { color: 'rgba(245, 222, 179, 0.3)', coverage: 0.3 }
          });
        }
      }
    }
  }, [selectedLookId, availableLooks]);
  
  // Detecting makeup tools (simplified mock implementation)
  const [detectedTools, setDetectedTools] = useState<Array<{ type: string; confidence: number }>>([]);
  
  useEffect(() => {
    if (!faceDetected) return;
    
    // Mock tool detection based on movement and random intervals
    const detectTools = () => {
      if (Math.random() < 0.2) { // 20% chance to detect a tool
        const makeupTools = [
          'Foundation Brush', 'Blush Brush', 'Eyeshadow Brush', 
          'Lipstick', 'Mascara Wand', 'Beauty Blender',
          'Contour Brush', 'Eyebrow Pencil', 'Eyeliner'
        ];
        
        const randomTool = makeupTools[Math.floor(Math.random() * makeupTools.length)];
        const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence
        
        setDetectedTools([{ type: randomTool, confidence }]);
        
        // Clear after a few seconds
        setTimeout(() => {
          setDetectedTools([]);
        }, 5000);
      }
    };
    
    const toolDetectionInterval = setInterval(detectTools, 8000);
    
    return () => {
      clearInterval(toolDetectionInterval);
    };
  }, [faceDetected]);
  
  // Handle applying virtual makeup from AI commands
  const handleApplyVirtualMakeup = (makeup: any) => {
    setVirtualMakeup(prev => ({
      ...prev,
      ...makeup
    }));
  };
  
  // Execute commands from the AI assistant
  const handleExecuteCommand = (command: string, params: Record<string, string>) => {
    switch (command) {
      case 'next':
        lookGuidance.goToNextStep();
        break;
      case 'previous':
        lookGuidance.goToPreviousStep();
        break;
      case 'analyze':
        onCaptureAndAnalyze();
        break;
      case 'selectLook':
        if (params.lookName) {
          const look = availableLooks.find(l => 
            l.name.toLowerCase().includes(params.lookName.toLowerCase())
          );
          if (look) {
            onSelectLook(look.id);
          }
        }
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="mt-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-7/12 space-y-4">
          <Card className="overflow-hidden border-purple-200">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 flex justify-between items-center">
              <div className="flex items-center">
                <Camera className="h-5 w-5 text-purple-700 mr-2" />
                <h3 className="font-medium text-purple-900">Advanced Face Analysis</h3>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-purple-200"
                  onClick={() => setShowAREffects(!showAREffects)}
                >
                  {showAREffects ? (
                    <><Eye className="h-4 w-4 mr-1" /> Hide AR</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-1" /> Show AR</>
                  )}
                </Button>
                
                <Button 
                  variant={cameraActive ? "destructive" : "default"}
                  size="sm"
                  onClick={onToggleCamera}
                >
                  {cameraActive ? (
                    <><CameraOff className="h-4 w-4 mr-1" /> Stop Camera</>
                  ) : (
                    <><Camera className="h-4 w-4 mr-1" /> Start Camera</>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <VideoDisplay
                videoRef={videoRef}
                canvasRef={canvasRef}
                isStreamActive={cameraActive}
                faceDetected={faceDetected}
                retryFaceDetection={() => {
                  // Reload the video stream
                  if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Toggle camera off and on
                    onToggleCamera();
                    setTimeout(() => onToggleCamera(), 500);
                  }
                }}
                showAREffects={showAREffects}
                detectedTools={detectedTools}
              />
              
              {cameraActive && !faceDetectionReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="bg-white p-4 rounded-lg shadow-lg text-center">
                    <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2 animate-pulse" />
                    <h3 className="text-lg font-medium">Initializing Face Detection</h3>
                    <p className="text-gray-600 mt-1">Please wait while we load the advanced models...</p>
                    <Progress className="mt-3" value={30} />
                  </div>
                </div>
              )}
              
              {cameraActive && faceDetectionReady && !faceDetected && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
                    No face detected. Please position your face in the frame.
                  </Badge>
                </div>
              )}
              
              {cameraActive && faceDetected && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-100 text-green-800 flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    Face Detected
                  </Badge>
                </div>
              )}
            </div>
            
            {isAnalyzing && (
              <div className="p-3 bg-purple-50">
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 text-purple-600 animate-spin mr-2" />
                  <span className="text-purple-700 text-sm">Analyzing facial features...</span>
                </div>
                <Progress value={progressPercentage} className="mt-2" />
              </div>
            )}
          </Card>
          
          {cameraActive && faceDetectionReady && (
            <FacialAnalysisDisplay
              detectedFacialTraits={detectedFacialTraits}
              voiceEnabled={voiceEnabled}
              analysisImage={analysisImage}
              movementData={movementData}
              lastActivity={detectedActions.length > 0 ? detectedActions[0].action : null}
              onReanalyze={onCaptureAndAnalyze}
              isAnalyzing={isAnalyzing}
              faceDetectionConfidence={detectionConfidence}
              detectedMakeupTools={detectedTools}
              facialAttributes={facialAttributes}
            />
          )}
          
          {analysisError && (
            <Alert variant="destructive">
              <AlertDescription>{analysisError}</AlertDescription>
            </Alert>
          )}
          
          {cameraActive && faceDetectionReady && (
            <LookStepNavigation
              currentStep={lookGuidance.currentStep}
              totalSteps={lookGuidance.totalSteps}
              completedSteps={lookGuidance.completedSteps}
              stepNames={lookGuidance.stepNames}
              currentInstruction={lookGuidance.getCurrentInstruction()}
              onNext={lookGuidance.goToNextStep}
              onPrevious={lookGuidance.goToPreviousStep}
              onMarkCompleted={lookGuidance.markCompleted}
              onSelectStep={lookGuidance.selectStep}
              availableLooks={availableLooks}
              selectedLookId={selectedLookId}
              onSelectLook={onSelectLook}
            />
          )}
        </div>
        
        <div className="md:w-5/12">
          <AdvancedAIAssistant
            facialTraits={detectedFacialTraits}
            currentStep={lookGuidance.getCurrentInstruction()}
            faceDetected={faceDetected}
            detectedTools={detectedTools}
            movementData={movementData}
            facialAttributes={facialAttributes}
            detectedActions={detectedActions}
            makeupRegions={makeupRegions}
            onExecuteCommand={handleExecuteCommand}
            onApplyVirtualMakeup={handleApplyVirtualMakeup}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvancedFaceAnalysisCamera;
