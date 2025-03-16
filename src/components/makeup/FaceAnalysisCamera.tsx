
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, Volume2, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Camera, Zap, Activity, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GanOutput from './GanOutput';
import { Progress } from '@/components/ui/progress';
import LookProgressTracker from './LookProgressTracker';
import LookDetailsPanel from './LookDetailsPanel';
import { detectFacialLandmarks, getMovementTrends } from '@/lib/faceDetection';
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
      
      // Draw face tracking indicator
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * pulseScale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200, 100, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add crosshair lines
      ctx.beginPath();
      ctx.moveTo(centerX - radius * 1.2, centerY);
      ctx.lineTo(centerX + radius * 1.2, centerY);
      ctx.moveTo(centerX, centerY - radius * 1.2);
      ctx.lineTo(centerX, centerY + radius * 1.2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw highlighted regions based on current guidance
      if (highlightedRegion) {
        let regionX = centerX;
        let regionY = centerY;
        let regionRadius = radius * 0.4;
        
        switch (highlightedRegion.toLowerCase()) {
          case 'eyes':
            regionY = centerY - radius * 0.3;
            break;
          case 'lips':
            regionY = centerY + radius * 0.5;
            break;
          case 'cheeks':
            regionX = centerX + (Math.random() > 0.5 ? 1 : -1) * radius * 0.6;
            regionY = centerY;
            break;
          case 'forehead':
            regionY = centerY - radius * 0.7;
            break;
          case 'jawline':
            regionY = centerY + radius * 0.7;
            break;
        }
        
        // Draw highlighted region with pulsing effect
        const glowScale = 1 + Math.sin(Date.now() * 0.006) * 0.3;
        
        // Create gradient glow
        const gradient = ctx.createRadialGradient(
          regionX, regionY, 0,
          regionX, regionY, regionRadius * glowScale
        );
        gradient.addColorStop(0, 'rgba(255, 100, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 100, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(regionX, regionY, regionRadius * glowScale, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add label
        ctx.font = '14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(highlightedRegion, regionX, regionY - regionRadius * 1.2);
      }
      
      // Draw makeup tool indicators if detected
      if (nearbyObjects.length > 0) {
        nearbyObjects.forEach(obj => {
          // Normalize position to canvas coordinates
          const normalizedX = obj.position.x / videoRef.current!.videoWidth * canvas.width;
          const normalizedY = obj.position.y / videoRef.current!.videoHeight * canvas.height;
          
          // Draw object highlight
          ctx.beginPath();
          ctx.arc(normalizedX, normalizedY, 20, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw label
          ctx.font = '12px Arial';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText(obj.type, normalizedX, normalizedY - 25);
          ctx.fillText(`${Math.round(obj.confidence * 100)}%`, normalizedX, normalizedY - 10);
        });
      }
      
      // Draw current guidance instruction
      if (lookGuidance.currentStep >= 0) {
        const instruction = lookGuidance.getCurrentInstruction();
        if (instruction) {
          const textY = canvas.height - 40;
          
          // Create background for text
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(10, textY - 20, canvas.width - 20, 30);
          
          // Draw text
          ctx.font = '14px Arial';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText(
            instruction.instruction.length > 60 
              ? instruction.instruction.substring(0, 60) + '...' 
              : instruction.instruction, 
            canvas.width / 2, 
            textY
          );
        }
      }
    } catch (error) {
      console.error('Error drawing canvas overlays:', error);
    }
  }, [canvasRef, videoRef, faceDetected, highlightedRegion, nearbyObjects, lookGuidance]);
  
  // Setup canvas context and animation loop
  useEffect(() => {
    if (!canvasRef.current) return;
    
    canvasContextRef.current = canvasRef.current.getContext('2d');
    
    let animationFrameId: number;
    
    // Animation loop for smooth canvas rendering
    const animate = () => {
      drawOverlay();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    if (cameraActive) {
      animate();
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [canvasRef, cameraActive, drawOverlay]);
  
  // Update highlighted region based on guidance
  useEffect(() => {
    if (!currentGuidance) return;
    
    const guidance = currentGuidance.toLowerCase();
    
    if (guidance.includes('eye')) setHighlightedRegion('eyes');
    else if (guidance.includes('lip')) setHighlightedRegion('lips');
    else if (guidance.includes('cheek') || guidance.includes('blush')) setHighlightedRegion('cheeks');
    else if (guidance.includes('forehead')) setHighlightedRegion('forehead');
    else if (guidance.includes('jaw')) setHighlightedRegion('jawline');
    else if (guidance.includes('foundation') || guidance.includes('face')) setHighlightedRegion('face');
    else setHighlightedRegion(null);
    
  }, [currentGuidance]);
  
  // Make canvas visible for real-time overlay
  useEffect(() => {
    if (canvasRef.current && videoRef.current && cameraActive) {
      canvasRef.current.style.display = 'block';
      canvasRef.current.style.position = 'absolute';
      canvasRef.current.style.top = '0';
      canvasRef.current.style.left = '0';
      canvasRef.current.width = videoRef.current.videoWidth || 640;
      canvasRef.current.height = videoRef.current.videoHeight || 480;
    }
  }, [canvasRef, videoRef, cameraActive]);
  
  // Get current step instruction
  const currentInstruction = lookGuidance.getCurrentInstruction();
  
  // Toggle overlay visibility
  const toggleOverlay = () => {
    setOverlayVisible(prev => !prev);
  };
  
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-3/5">
          <div className="relative bg-black rounded-lg overflow-hidden" ref={cameraContainerRef}>
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              className="w-full h-64 object-cover"
            />
            <canvas 
              ref={canvasRef} 
              className={`absolute top-0 left-0 w-full h-full pointer-events-none z-10 ${overlayVisible ? 'opacity-100' : 'opacity-30'}`}
            />
            
            {/* Toggle overlay button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleOverlay}
              className="absolute top-2 right-2 bg-black/30 text-white z-20 hover:bg-black/50"
            >
              {overlayVisible ? 'Hide Overlay' : 'Show Overlay'}
            </Button>
            
            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                <div className="text-white text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Analyzing your face...</p>
                </div>
              </div>
            )}
            
            {!faceDetected && cameraActive && !isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                <div className="text-white text-center bg-red-900/70 p-4 rounded-lg max-w-xs">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                  <p>No face detected. Please position your face in the frame.</p>
                </div>
              </div>
            )}
            
            {/* Real-time detected objects overlay */}
            {nearbyObjects.length > 0 && (
              <div className="absolute top-12 left-2 right-2 bg-blue-900/70 text-white text-sm p-2 rounded z-20 animate-pulse">
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-yellow-300" />
                  <span>
                    Detected: {nearbyObjects[0].type} 
                    ({Math.round(nearbyObjects[0].confidence * 100)}% confidence)
                  </span>
                </div>
              </div>
            )}
            
            {/* Activity indicator */}
            {lastActivity && (
              <div className="absolute bottom-12 left-2 right-2 bg-purple-900/70 text-white text-sm p-2 rounded-md z-20">
                <p className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-purple-300" />
                  {lastActivity}
                </p>
              </div>
            )}
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 z-20">
              <Progress 
                value={progressPercentage}
                className="rounded-none"
              />
            </div>
          </div>
          
          {/* Step navigation controls */}
          {cameraActive && selectedLookId && (
            <div className="mt-4 flex justify-between items-center">
              <Button 
                onClick={lookGuidance.goToPreviousStep}
                variant="ghost"
                size="sm"
                disabled={lookGuidance.currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <Button
                onClick={lookGuidance.markCompleted}
                variant="outline"
                size="sm"
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
              
              <Button 
                onClick={lookGuidance.goToNextStep}
                variant="ghost"
                size="sm"
                disabled={lookGuidance.currentStep === lookGuidance.totalSteps - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
          
          {/* Capture button */}
          {!detectedFacialTraits && (
            <div className="flex justify-center mt-4">
              <Button 
                onClick={onCaptureAndAnalyze}
                disabled={isAnalyzing || !faceDetected}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {isAnalyzing ? "Analyzing..." : "Analyze Facial Features"}
              </Button>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-2/5">
          {/* Enhanced voice guidance with more data */}
          {showGuidance && (
            <VoiceGuidance
              enabled={voiceEnabled}
              onEnabledChange={onVoiceEnabledChange}
              currentInstruction={currentInstruction?.instruction}
              progress={progressPercentage}
              faceDetected={faceDetected}
              lastActivity={lastActivity}
              currentMakeupStep={lookGuidance.stepNames[lookGuidance.currentStep] || ""}
              detectedObjects={nearbyObjects}
              movementData={movementData}
              detectedMakeupTools={detectedMakeupTools}
            />
          )}
          
          {selectedLookId && availableLooks.length > 0 && (
            <div className="mt-4">
              {/* Step progress tracker */}
              <LookProgressTracker 
                currentStep={lookGuidance.currentStep}
                totalSteps={lookGuidance.totalSteps}
                completedSteps={lookGuidance.completedSteps}
                stepNames={lookGuidance.stepNames}
                onSelectStep={lookGuidance.selectStep}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Current step guidance with AI feedback */}
      {currentInstruction && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-start">
            <Volume2 className={`h-5 w-5 ${voiceEnabled ? 'text-purple-600' : 'text-gray-400'} mr-2 mt-0.5`} />
            <div className="flex-1">
              <p className="text-purple-800 font-medium">{currentInstruction.instruction}</p>
              {currentInstruction.customization && (
                <p className="text-purple-600 text-sm mt-1 italic">{currentInstruction.customization}</p>
              )}
              
              {/* AI dynamic feedback based on detected actions */}
              {lastActivity && (
                <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-700 text-sm">
                    {lastActivity.includes("Detected") 
                      ? `I noticed you're using ${lastActivity.replace("Detected ", "").toLowerCase()}.` 
                      : `I observed: ${lastActivity}`}
                    {lastActivity.includes("correctly") 
                      ? " Great job! Continue with this technique." 
                      : ` Make sure to follow the current step: ${currentInstruction.instruction}`}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Movement guidance */}
              {movementData && movementData.magnitude > 5 && (
                <Alert className="mt-2 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700 text-sm">
                    I notice you're moving quite a bit. For more precise makeup application, try to keep your head relatively still.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Facial Analysis Display with more data */}
      {detectedFacialTraits && (
        <FacialAnalysisDisplay
          detectedFacialTraits={detectedFacialTraits}
          voiceEnabled={voiceEnabled}
          analysisImage={analysisImage}
          movementData={movementData}
          lastActivity={lastActivity || undefined}
          onReanalyze={onCaptureAndAnalyze}
          nearbyObjects={nearbyObjects}
          faceDetectionConfidence={faceDetected ? 0.8 : 0}
          detectedMakeupTools={detectedMakeupTools}
        />
      )}
      
      {/* Look details */}
      {selectedLookId && availableLooks.length > 0 && (
        <div className="mt-4">
          <LookDetailsPanel 
            look={availableLooks.find(look => look.id === selectedLookId)!}
            personalizedRecommendations={detectedFacialTraits?.recommendations}
          />
        </div>
      )}
      
      {/* Enhanced GAN Output with more visual feedback */}
      {analysisImage && !detectedFacialTraits && (
        <GanOutput
          imageUrl={analysisImage}
          isLoading={isAnalyzing}
          error={analysisError || undefined}
          className="w-full h-64"
          facialAnalysis={detectedFacialTraits ?? undefined}
          onRegenerate={onCaptureAndAnalyze}
          progressPercentage={progressPercentage}
          faceDetected={faceDetected}
        />
      )}
    </div>
  );
};

export default FaceAnalysisCamera;
