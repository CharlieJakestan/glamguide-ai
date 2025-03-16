
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, Volume2, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Camera, Zap, Activity, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GanOutput from './GanOutput';
import { Progress } from '@/components/ui/progress';
import LookProgressTracker from './LookProgressTracker';
import LookDetailsPanel from './LookDetailsPanel';
import { detectFacialLandmarks, getMovementTrends, getFaceBoundingBox } from '@/lib/faceDetection';
import FacialAnalysisDisplay from './FacialAnalysisDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import VoiceGuidance from './VoiceGuidance';
import { DetectedObject } from '@/hooks/useMakeupObjectDetection';

interface FaceAnalysisCameraProps {
  cameraActive: boolean;
  isAnalyzing: boolean;
  progressPercentage: number;
  currentGuidance: string | null;
  detectedFacialTraits: {
    skinTone: string;
    faceShape: string;
    features: string[];
    recommendations: string[];
  } | null;
  analysisImage: string | null;
  analysisError: string | null;
  voiceEnabled: boolean;
  onVoiceEnabledChange: (enabled: boolean) => void;
  availableLooks: any[];
  selectedLookId: string | null;
  onSelectLook: (lookId: string) => void;
  lookGuidance: {
    currentStep: number;
    completedSteps: number[];
    totalSteps: number;
    stepNames: string[];
    getCurrentInstruction: () => { instruction: string; customization?: string } | null;
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    markCompleted: () => void;
    selectStep: (index: number) => void;
  };
  onCaptureAndAnalyze: () => void;
  onToggleCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  faceDetected?: boolean;
  onFaceDetectionChange?: (detected: boolean) => void;
  movementData?: {x: number, y: number, magnitude: number};
  lastActivity?: string | null;
  nearbyObjects?: DetectedObject[];
  detectedMakeupTools?: Array<{type: string, confidence: number}>;
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
  faceDetected = false,
  onFaceDetectionChange,
  movementData = { x: 0, y: 0, magnitude: 0 },
  lastActivity = null,
  nearbyObjects = [],
  detectedMakeupTools = []
}) => {
  const [showGuidance, setShowGuidance] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [highlightedRegion, setHighlightedRegion] = useState<string | null>(null);
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  
  // Draw guide overlay on canvas for real-time feedback
  const drawOverlay = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || !canvasContextRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvasContextRef.current;
    
    // Set canvas dimensions to match video
    if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
    }
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!faceDetected) return;
    
    // Add more dynamic and responsive overlays
    try {
      // Face tracking circle
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.2;
      
      // Pulsing effect for tracking circle
      const pulseScale = 1 + Math.sin(Date.now() * 0.003) * 0.05;
      
      // Draw face tracking indicator - basic version
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * pulseScale, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(120, 90, 220, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw cross-hairs
      const crosshairSize = radius * 0.2;
      ctx.beginPath();
      ctx.moveTo(centerX - crosshairSize, centerY);
      ctx.lineTo(centerX + crosshairSize, centerY);
      ctx.moveTo(centerX, centerY - crosshairSize);
      ctx.lineTo(centerX, centerY + crosshairSize);
      ctx.strokeStyle = 'rgba(120, 90, 220, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Highlight region of focus if specified
      if (highlightedRegion) {
        let regionX = centerX;
        let regionY = centerY;
        let regionRadius = radius * 0.5;
        
        // Adjust position based on region
        if (highlightedRegion === 'eyes') {
          regionY = centerY - radius * 0.3;
          regionRadius = radius * 0.4;
        } else if (highlightedRegion === 'lips') {
          regionY = centerY + radius * 0.4;
          regionRadius = radius * 0.3;
        } else if (highlightedRegion === 'cheeks') {
          regionX = centerX + (Math.sin(Date.now() * 0.001) > 0 ? 1 : -1) * radius * 0.5;
          regionY = centerY;
          regionRadius = radius * 0.3;
        }
        
        // Draw highlighted region
        ctx.beginPath();
        ctx.arc(regionX, regionY, regionRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 100, 180, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 100, 180, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw nearby detected objects
      if (nearbyObjects && nearbyObjects.length > 0) {
        nearbyObjects.forEach(obj => {
          const objX = obj.position.x;
          const objY = obj.position.y;
          
          // Draw object indicator
          ctx.beginPath();
          ctx.arc(objX, objY, 15, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(50, 200, 120, 0.2)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(50, 200, 120, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw line connecting to face
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(objX, objY);
          ctx.strokeStyle = 'rgba(50, 200, 120, 0.4)';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Draw label
          ctx.font = '12px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.textAlign = 'center';
          ctx.fillText(obj.type, objX, objY + 25);
        });
      }
      
      // Display movement indicator
      if (movementData && movementData.magnitude > 1) {
        const movX = centerX + movementData.x * canvas.width * 0.5;
        const movY = centerY + movementData.y * canvas.height * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(movX, movY);
        ctx.strokeStyle = 'rgba(255, 150, 50, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(movX, movY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 150, 50, 0.8)';
        ctx.fill();
      }
    } catch (error) {
      console.error('Error drawing overlay:', error);
    }
  }, [canvasRef, videoRef, faceDetected, highlightedRegion, nearbyObjects, movementData]);
  
  // Set up canvas context and render loop
  useEffect(() => {
    if (!canvasRef.current) return;
    
    canvasContextRef.current = canvasRef.current.getContext('2d');
    
    if (!canvasContextRef.current) {
      console.error('Failed to get canvas context');
      return;
    }
    
    let animationFrame: number;
    
    const renderLoop = () => {
      drawOverlay();
      animationFrame = requestAnimationFrame(renderLoop);
    };
    
    animationFrame = requestAnimationFrame(renderLoop);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [canvasRef, drawOverlay]);
  
  // Update highlighted region based on guidance
  useEffect(() => {
    if (!currentGuidance) return;
    
    const guidanceLower = currentGuidance.toLowerCase();
    
    if (guidanceLower.includes('eye') || guidanceLower.includes('brow')) {
      setHighlightedRegion('eyes');
    } else if (guidanceLower.includes('lip') || guidanceLower.includes('mouth')) {
      setHighlightedRegion('lips');
    } else if (guidanceLower.includes('cheek') || guidanceLower.includes('blush')) {
      setHighlightedRegion('cheeks');
    } else if (guidanceLower.includes('foundation') || guidanceLower.includes('contour')) {
      setHighlightedRegion('face');
    } else {
      setHighlightedRegion(null);
    }
  }, [currentGuidance]);
  
  const getCurrentMakeupStep = (): string => {
    const instruction = lookGuidance.getCurrentInstruction();
    return instruction ? instruction.instruction : '';
  };
  
  return (
    <div className="space-y-4 mb-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Camera container */}
        <div ref={cameraContainerRef} className="relative aspect-video bg-gray-900">
          {/* Video element for camera feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${!faceDetected ? 'opacity-60' : ''}`}
          />
          
          {/* Canvas overlay for drawing face tracking */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
          
          {/* Guidance overlay */}
          {showGuidance && faceDetected && currentGuidance && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg text-white">
              <div className="flex items-start space-x-2">
                <div>
                  <p className="text-sm font-medium">{currentGuidance}</p>
                  <div className="flex items-center mt-2 space-x-1 text-xs">
                    <Badge className="bg-purple-500">
                      {lookGuidance.currentStep + 1}/{lookGuidance.totalSteps}
                    </Badge>
                    <span>{lookGuidance.stepNames[lookGuidance.currentStep]}</span>
                  </div>
                </div>
              </div>
              <Progress value={progressPercentage} className="mt-2 h-1" />
            </div>
          )}
          
          {/* Face detection indicator */}
          <div 
            className={`absolute top-4 right-4 px-2 py-1 rounded transition-colors ${
              faceDetected 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            <div className="flex items-center text-xs">
              {faceDetected ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>Face Detected</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>No Face Detected</span>
                </>
              )}
            </div>
          </div>
          
          {/* Controls overlay */}
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-black/30 border-gray-400 text-white hover:bg-black/50 hover:text-white"
              onClick={onToggleCamera}
            >
              <Camera className="h-3 w-3 mr-1" />
              {cameraActive ? 'Stop Camera' : 'Start Camera'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-black/30 border-gray-400 text-white hover:bg-black/50 hover:text-white"
              onClick={() => setOverlayVisible(!overlayVisible)}
            >
              <Zap className="h-3 w-3 mr-1" />
              {overlayVisible ? 'Hide Overlay' : 'Show Overlay'}
            </Button>
          </div>
          
          {/* Loading indicator during analysis */}
          {isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="bg-white p-4 rounded-lg flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
                <p className="text-purple-800 font-medium">Analyzing your face...</p>
                <Progress value={progressPercentage} className="w-40 mt-2" />
              </div>
            </div>
          )}
        </div>
        
        {/* Look control buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {lookGuidance.currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={lookGuidance.goToPreviousStep}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous Step
                </Button>
              )}
              
              <Button
                variant="default"
                size="sm"
                onClick={onCaptureAndAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-1" />
                    Capture & Analyze
                  </>
                )}
              </Button>
              
              {lookGuidance.currentStep < lookGuidance.totalSteps - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={lookGuidance.goToNextStep}
                >
                  Next Step
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            
            <Button
              variant={lookGuidance.completedSteps.includes(lookGuidance.currentStep) ? "ghost" : "outline"}
              size="sm"
              onClick={lookGuidance.markCompleted}
              className={lookGuidance.completedSteps.includes(lookGuidance.currentStep) ? "bg-green-50 text-green-600" : ""}
            >
              {lookGuidance.completedSteps.includes(lookGuidance.currentStep) ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  Completed
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark as Complete
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Look details and progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <LookDetailsPanel
            looks={availableLooks}
            selectedLookId={selectedLookId}
            onSelectLook={onSelectLook}
            showRecommendations={!!detectedFacialTraits}
          />
          
          {/* Facial analysis results */}
          {detectedFacialTraits && (
            <FacialAnalysisDisplay
              detectedFacialTraits={detectedFacialTraits}
              voiceEnabled={voiceEnabled}
              analysisImage={analysisImage}
              onReanalyze={onCaptureAndAnalyze}
              isAnalyzing={isAnalyzing}
              movementData={movementData}
              lastActivity={lastActivity || undefined}
              nearbyObjects={nearbyObjects}
              faceDetectionConfidence={faceDetected ? 0.8 : 0.1}
              detectedMakeupTools={detectedMakeupTools}
            />
          )}
        </div>
        
        <div>
          {/* Voice guidance system */}
          <VoiceGuidance
            enabled={voiceEnabled}
            onEnabledChange={onVoiceEnabledChange}
            currentInstruction={currentGuidance || undefined}
            progress={progressPercentage}
            onGenerateMockData={onCaptureAndAnalyze}
            faceDetected={faceDetected}
            lastActivity={lastActivity}
            currentMakeupStep={getCurrentMakeupStep()}
            detectedObjects={nearbyObjects}
            movementData={movementData}
            detectedMakeupTools={detectedMakeupTools}
          />
          
          {/* Look progress tracker */}
          <div className="mt-4">
            <LookProgressTracker
              currentStep={lookGuidance.currentStep}
              completedSteps={lookGuidance.completedSteps}
              totalSteps={lookGuidance.totalSteps}
              stepNames={lookGuidance.stepNames}
              onSelectStep={lookGuidance.selectStep}
            />
          </div>
          
          {/* Error display */}
          {analysisError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{analysisError}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceAnalysisCamera;
