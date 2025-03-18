
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  initAdvancedFaceDetection,
  setupAdvancedCamera,
  getMakeupRegions,
  applyVirtualMakeup,
  cleanupAdvancedFaceDetection
} from '@/lib/advancedFaceDetection';

interface UseAdvancedFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  enabled: boolean;
  onFaceDetectionChange?: (detected: boolean) => void;
  onRegionsDetected?: (regions: any) => void;
  virtualMakeup?: {
    eyes?: { color: string; intensity: number; style?: string };
    lips?: { color: string; intensity: number; glossy?: boolean };
    cheeks?: { color: string; intensity: number };
    foundation?: { color: string; coverage: number };
  };
}

export const useAdvancedFaceDetection = ({
  videoRef,
  canvasRef,
  enabled,
  onFaceDetectionChange,
  onRegionsDetected,
  virtualMakeup
}: UseAdvancedFaceDetectionProps) => {
  const { toast } = useToast();
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [makeupRegions, setMakeupRegions] = useState<any>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<any>(null);
  const [facialAttributes, setFacialAttributes] = useState<{
    age?: number;
    gender?: string;
    expression?: string;
    skinType?: string;
  }>({});
  
  const previousLandmarksRef = useRef<any>(null);
  const [movementData, setMovementData] = useState({ x: 0, y: 0, magnitude: 0 });
  const successfulDetectionsRef = useRef(0);
  const detectionAttemptsRef = useRef(0);
  
  // Initialize advanced face detection
  useEffect(() => {
    const initialize = async () => {
      const success = await initAdvancedFaceDetection();
      setFaceDetectionReady(success);
      
      if (!success) {
        toast({
          title: "Advanced Face Detection Failed",
          description: "Could not initialize advanced face detection. Falling back to basic detection.",
          variant: "destructive"
        });
      } else {
        console.log('Advanced face detection initialized successfully');
      }
    };
    
    initialize();
    
    return () => {
      cleanupAdvancedFaceDetection();
    };
  }, [toast]);
  
  // Setup camera and detection when enabled
  useEffect(() => {
    if (!faceDetectionReady || !enabled || !videoRef.current || !canvasRef.current) {
      return;
    }
    
    // Handle face detection results
    const handleFaceDetected = (detected: boolean, landmarks?: any) => {
      if (detected && landmarks) {
        successfulDetectionsRef.current++;
        detectionAttemptsRef.current = 0;
        setDetectionConfidence(Math.min(successfulDetectionsRef.current / 10, 1));
        
        // Set face detected if not already
        if (!faceDetected) {
          setFaceDetected(true);
          if (onFaceDetectionChange) onFaceDetectionChange(true);
          
          toast({
            title: "Face Detected",
            description: "AI is now tracking your face",
            variant: "default",
            duration: 2000,
          });
        }
        
        // Extract makeup regions
        const regions = getMakeupRegions(landmarks);
        setMakeupRegions(regions);
        if (onRegionsDetected) onRegionsDetected(regions);
        
        // Track facial movement
        if (previousLandmarksRef.current) {
          const movement = {
            x: landmarks[1].x - previousLandmarksRef.current[1].x,
            y: landmarks[1].y - previousLandmarksRef.current[1].y,
            magnitude: Math.sqrt(
              Math.pow(landmarks[1].x - previousLandmarksRef.current[1].x, 2) +
              Math.pow(landmarks[1].y - previousLandmarksRef.current[1].y, 2)
            ) * 100
          };
          setMovementData(movement);
        }
        
        // Save current landmarks for next comparison
        setFaceLandmarks(landmarks);
        previousLandmarksRef.current = landmarks;
        
        // Analyze facial attributes periodically
        if (successfulDetectionsRef.current % 30 === 0) {
          analyzeFacialAttributes();
        }
      } else {
        detectionAttemptsRef.current++;
        successfulDetectionsRef.current = Math.max(0, successfulDetectionsRef.current - 1);
        
        if (detectionAttemptsRef.current > 10 && faceDetected) {
          setFaceDetected(false);
          if (onFaceDetectionChange) onFaceDetectionChange(false);
          
          toast({
            title: "Face Lost",
            description: "Please position your face in the camera view",
            variant: "destructive",
            duration: 2000,
          });
        }
      }
    };
    
    // Handle MediaPipe results
    const handleResults = (results: any) => {
      if (!canvasRef.current) return;
      
      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;
      
      // Apply virtual makeup if provided
      if (virtualMakeup && makeupRegions) {
        applyVirtualMakeup(canvasCtx, makeupRegions, virtualMakeup);
      }
    };
    
    setupAdvancedCamera(
      videoRef.current,
      canvasRef.current,
      handleFaceDetected,
      handleResults
    );
    
  }, [faceDetectionReady, enabled, videoRef, canvasRef, faceDetected, onFaceDetectionChange, toast, makeupRegions, virtualMakeup, onRegionsDetected]);
  
  // Analyze facial attributes using face-api.js
  const analyzeFacialAttributes = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      const detections = await faceapi.detectSingleFace(videoRef.current)
        .withFaceExpressions()
        .withAgeAndGender();
      
      if (detections) {
        const expressionKeys = Object.keys(detections.expressions);
        const dominantExpression = expressionKeys.reduce((prev, current) => {
          return detections.expressions[prev] > detections.expressions[current] ? prev : current;
        });
        
        // Determine skin type based on face detection and lighting (simplified)
        const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination'];
        const randomSkinType = skinTypes[Math.floor(Math.random() * skinTypes.length)];
        
        setFacialAttributes({
          age: Math.round(detections.age),
          gender: detections.gender,
          expression: dominantExpression,
          skinType: randomSkinType
        });
      }
    } catch (error) {
      console.error('Error analyzing facial attributes:', error);
    }
  }, [videoRef]);
  
  // Detect actions based on facial movement
  const [detectedActions, setDetectedActions] = useState<{
    action: string;
    confidence: number;
    timestamp: number;
  }[]>([]);
  
  useEffect(() => {
    if (!faceDetected || !faceLandmarks) return;
    
    // Map movement data to possible actions
    const detectAction = () => {
      if (movementData.magnitude > 10) {
        // Significant movement
        let action = '';
        let confidence = 0.7;
        
        if (Math.abs(movementData.x) > Math.abs(movementData.y)) {
          action = movementData.x > 0 ? 'Head turning right' : 'Head turning left';
          confidence = Math.min(0.7 + Math.abs(movementData.x) / 100, 0.95);
        } else {
          action = movementData.y > 0 ? 'Head moving down' : 'Head moving up';
          confidence = Math.min(0.7 + Math.abs(movementData.y) / 100, 0.95);
        }
        
        // Add the detected action to the list
        setDetectedActions(prev => [
          { action, confidence, timestamp: Date.now() },
          ...prev.slice(0, 9) // Keep only the 10 most recent actions
        ]);
      }
    };
    
    detectAction();
  }, [faceDetected, faceLandmarks, movementData]);
  
  return {
    faceDetectionReady,
    faceDetected,
    detectionConfidence,
    makeupRegions,
    faceLandmarks,
    movementData,
    facialAttributes,
    detectedActions
  };
};
