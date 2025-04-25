
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, RefreshCw, Share2, ShieldCheck, ThumbsUp } from 'lucide-react';
import VideoDisplay from '@/components/camera/VideoDisplay';
import VideoDisplayAR from '@/components/camera/VideoDisplayAR'; 
import FaceTraitsDisplay from './FaceTraitsDisplay';
import MakeupLookCard from './MakeupLookCard';
import VirtualMakeupControls from './VirtualMakeupControls';
import VoiceAssistant from '@/ai/voice/VoiceAssistant';
import Face3DModelView from './Face3DModelView';
import { generate3DFaceModel, applyVirtualMakeup } from '@/lib/face3dModeling';

interface FaceAnalysisCameraProps {
  cameraActive: boolean;
  isAnalyzing: boolean;
  progressPercentage: number;
  currentGuidance: string;
  detectedFacialTraits: any;
  analysisImage: string | null;
  analysisError: string | null;
  voiceEnabled: boolean;
  onVoiceEnabledChange: (enabled: boolean) => void;
  availableLooks: any[];
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
  faceDetected: boolean;
  movementData: { x: number; y: number; magnitude: number };
  lastActivity: string | null;
  nearbyObjects: Array<{ type: string; position: { x: number; y: number } }>;
  detectedMakeupTools: Array<{ type: string; confidence: number }>;
  modelingEnabled?: boolean;
  voiceInteractionEnabled?: boolean;
  retryFaceDetection?: () => void;
}

const FaceAnalysisCamera: React.FC<FaceAnalysisCameraProps> = ({
  cameraActive,
  isAnalyzing,
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
  canvasRef,
  faceDetected,
  movementData,
  lastActivity,
  nearbyObjects,
  detectedMakeupTools,
  modelingEnabled = false,
  voiceInteractionEnabled = false,
  retryFaceDetection
}) => {
  const [activeTab, setActiveTab] = useState('live');
  const [showAR, setShowAR] = useState(false);
  const [faceModel, setFaceModel] = useState<any>(null);
  const [makeupConfig, setMakeupConfig] = useState({
    lipstick: { color: '#ff6b81', opacity: 0.8 },
    eyeshadow: { color: '#9966cc', intensity: 0.6 },
    foundation: { color: '#ffdbac', coverage: 0.9 },
    blush: { color: '#ff9999', intensity: 0.5, position: { x: 0, y: 0 } }
  });
  
  const handleCapture = async () => {
    onCaptureAndAnalyze();
    
    // If 3D modeling is enabled, generate a 3D face model
    if (modelingEnabled && videoRef.current) {
      try {
        const model = await generate3DFaceModel(videoRef.current);
        if (model) {
          setFaceModel(model.faceModel);
        }
      } catch (error) {
        console.error('Error generating 3D face model:', error);
      }
    }
  };
  
  const handleApplyMakeup = async (config: any) => {
    setMakeupConfig({...makeupConfig, ...config});
    
    if (modelingEnabled && faceModel) {
      try {
        const updatedModel = await applyVirtualMakeup(faceModel, {...makeupConfig, ...config});
        if (updatedModel) {
          setFaceModel(updatedModel);
        }
      } catch (error) {
        console.error('Error applying virtual makeup:', error);
      }
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Tabs defaultValue="live" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full mb-2">
              <TabsTrigger value="live" className="flex-1">Live Camera</TabsTrigger>
              <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
              {modelingEnabled && (
                <TabsTrigger value="3d" className="flex-1">3D Model</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="live" className="mt-0">
              {activeTab === 'live' && (
                showAR ? (
                  <VideoDisplayAR
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    isStreamActive={cameraActive}
                    faceDetected={faceDetected}
                    retryFaceDetection={retryFaceDetection}
                    showAREffects={true}
                    detectedTools={detectedMakeupTools}
                  />
                ) : (
                  <VideoDisplay
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    isStreamActive={cameraActive}
                    faceDetected={faceDetected}
                    retryFaceDetection={retryFaceDetection}
                    guidanceHighlight={faceDetected ? { 
                      x: 50 + (movementData.x * 10), 
                      y: 50 + (movementData.y * 10),
                      radius: 30 
                    } : undefined}
                    showAREffects={false}
                  />
                )
              )}
              
              <div className="flex justify-between mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCapture}
                  disabled={!cameraActive || isAnalyzing}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture & Analyze
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAR(!showAR)}
                >
                  {showAR ? 'Hide AR Effects' : 'Show AR Effects'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="analysis" className="mt-0">
              <Card>
                <CardContent className="p-4">
                  {analysisImage ? (
                    <div className="space-y-4">
                      <img 
                        src={analysisImage} 
                        alt="Face Analysis Result" 
                        className="w-full h-64 object-cover rounded-md"
                      />
                      
                      <div>
                        <h3 className="text-lg font-medium">Analysis Complete</h3>
                        <FaceTraitsDisplay facialTraits={detectedFacialTraits} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="h-8 w-8 animate-spin text-pink-500" />
                          <p>Analyzing your face...</p>
                          <Progress value={progressPercentage} className="w-full" />
                        </>
                      ) : (
                        <Button 
                          variant="default" 
                          onClick={handleCapture}
                          disabled={!cameraActive}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capture & Analyze Face
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {modelingEnabled && (
              <TabsContent value="3d" className="mt-0">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center">
                      <Face3DModelView 
                        faceModel={faceModel}
                        makeupConfig={makeupConfig}
                        width={400} 
                        height={300} 
                        className="mb-4"
                        rotateModel={true}
                      />
                      
                      <VirtualMakeupControls 
                        onApplyMakeup={handleApplyMakeup} 
                        currentMakeup={makeupConfig}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-lg mb-2">Makeup Looks</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableLooks.map(look => (
                  <MakeupLookCard 
                    key={look.id}
                    look={look}
                    isSelected={selectedLookId === look.id}
                    onClick={() => onSelectLook(look.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {currentGuidance && (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <ShieldCheck className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-purple-800">AI Guidance</h3>
                    <p className="text-sm text-purple-700">{currentGuidance}</p>
                  </div>
                </div>
                
                {lookGuidance.currentStep > 0 && lookGuidance.totalSteps > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-purple-600">
                      <span>Step {lookGuidance.currentStep} of {lookGuidance.totalSteps}</span>
                      <span>{Math.round((lookGuidance.completedSteps.length / lookGuidance.totalSteps) * 100)}% Complete</span>
                    </div>
                    <Progress value={(lookGuidance.currentStep / lookGuidance.totalSteps) * 100} className="mt-1" />
                    
                    <div className="flex justify-between mt-2 space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={lookGuidance.goToPreviousStep}
                        disabled={lookGuidance.currentStep <= 1}
                        className="flex-1"
                      >
                        Previous
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          lookGuidance.markCompleted();
                          lookGuidance.goToNextStep();
                        }}
                        disabled={lookGuidance.currentStep >= lookGuidance.totalSteps}
                        className="flex-1"
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Complete &amp; Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {voiceInteractionEnabled && (
            <Card>
              <CardContent className="p-4">
                <VoiceAssistant
                  enabled={voiceEnabled}
                  onToggle={() => onVoiceEnabledChange(!voiceEnabled)}
                  faceDetected={faceDetected}
                  currentStep={currentGuidance || ""}
                  detectedTools={detectedMakeupTools}
                  movementData={movementData}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceAnalysisCamera;
