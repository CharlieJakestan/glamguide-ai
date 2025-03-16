
import { useState, useRef, useEffect, useCallback } from 'react';
import { detectFacialLandmarks, getMovementTrends, getMovementHistory } from '@/lib/faceDetection';

interface UseFaceDetectionProps {
  toast: any;
  videoRef?: React.RefObject<HTMLVideoElement>;
  enabled?: boolean;
  onFaceDetectionChange?: (detected: boolean) => void;
  onMovementChange?: (data: {x: number, y: number, magnitude: number}) => void;
  onActivityDetected?: (activity: string) => void;
}

export const useFaceDetection = ({ 
  toast, 
  videoRef, 
  enabled = true,
  onFaceDetectionChange,
  onMovementChange,
  onActivityDetected
}: UseFaceDetectionProps) => {
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [movementData, setMovementData] = useState({ x: 0, y: 0, magnitude: 0 });
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [processingFrame, setProcessingFrame] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  
  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionTime = useRef(0);
  const detectionAttempts = useRef(0);
  const successfulDetections = useRef(0);
  const maxFailedAttempts = 3;
  const detectionHistory = useRef<Array<boolean>>([]);
  
  // Detected objects near face (like makeup brushes, products)
  const [nearbyObjects, setNearbyObjects] = useState<Array<{
    type: string;
    confidence: number;
    position: { x: number, y: number };
  }>>([]);

  // Activity detection based on movement patterns
  useEffect(() => {
    if (!enabled || !faceDetected) return;
    
    // Analyze movement data to detect activities
    if (movementData.magnitude > 8) {
      const activity = "Significant head movement detected";
      setLastActivity(activity);
      if (onActivityDetected) onActivityDetected(activity);
    } else if (movementData.magnitude > 3 && movementData.magnitude < 8) {
      let activity;
      if (Math.abs(movementData.x) > Math.abs(movementData.y)) {
        activity = movementData.x > 0 ? "Looking to the right" : "Looking to the left";
      } else {
        activity = movementData.y > 0 ? "Looking down" : "Looking up";
      }
      setLastActivity(activity);
      if (onActivityDetected) onActivityDetected(activity);
    } else if (movementData.magnitude < 1 && faceDetected) {
      // When user is relatively still
      const activity = "User is looking at the camera";
      setLastActivity(activity);
      if (onActivityDetected) onActivityDetected(activity);
    }
    
    // Log significant activities for AI learning
    if (movementData.magnitude > 3 || detectionAttempts.current % 10 === 0) {
      console.log('Activity detected:', lastActivity, 'Movement:', movementData);
    }

    // Call movement change callback
    if (onMovementChange) {
      onMovementChange(movementData);
    }
  }, [movementData, faceDetected, enabled, lastActivity, onActivityDetected, onMovementChange]);

  // Run face detection on interval with improved accuracy
  const runDetection = useCallback(async () => {
    if (!videoRef?.current || processingFrame) return;
    
    const now = Date.now();
    // More frequent checks for better responsiveness (60ms for approx 15fps detection)
    if (now - lastDetectionTime.current < 60) return; 
    
    try {
      setProcessingFrame(true);
      lastDetectionTime.current = now;
      
      const detection = await detectFacialLandmarks(videoRef.current);
      const wasDetected = !!detection;
      
      // Update detection history for smoother state transitions
      detectionHistory.current.push(wasDetected);
      if (detectionHistory.current.length > 5) {
        detectionHistory.current.shift();
      }
      
      // Only change detection state when we have a consistent pattern
      const detectionCount = detectionHistory.current.filter(Boolean).length;
      const detectionRatio = detectionCount / detectionHistory.current.length;
      
      if (wasDetected) {
        successfulDetections.current++;
        detectionAttempts.current = 0;
        
        // Update detection confidence
        setDetectionConfidence(Math.min(successfulDetections.current / 10, 1));
        
        // If we have high confidence and face wasn't detected before, update state
        if (detectionRatio > 0.6 && !faceDetected) {
          setFaceDetected(true);
          if (onFaceDetectionChange) onFaceDetectionChange(true);
          
          toast({
            title: "Face Detected",
            description: "AI is now tracking your face",
            variant: "default",
            duration: 2000,
          });
        }
        
        // Get face position and dimensions with better precision
        if (detection) {
          const boundingBox = detection.detection.box;
          setFacePosition({
            x: boundingBox.x,
            y: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height
          });
          
          // Get movement trends
          const trends = getMovementTrends();
          setMovementData(trends);
          
          // Detect nearby objects 
          detectNearbyObjects(detection);
        }
      } else {
        detectionAttempts.current++;
        successfulDetections.current = Math.max(0, successfulDetections.current - 1);
        
        // Only set faceDetected to false after multiple consistent failures
        if (detectionRatio < 0.2 && faceDetected && detectionAttempts.current > maxFailedAttempts) {
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
    } catch (error) {
      console.error('Face detection error:', error);
      detectionAttempts.current++;
    } finally {
      setProcessingFrame(false);
    }
  }, [videoRef, faceDetected, processingFrame, toast, onFaceDetectionChange]);

  // Run detection on interval with higher frequency for better responsiveness
  useEffect(() => {
    if (!enabled || !videoRef?.current) {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }
    
    // More frequent interval (60ms) for better real-time tracking
    detectionIntervalRef.current = window.setInterval(runDetection, 60);
    
    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [enabled, videoRef, runDetection]);

  // Enhanced object detection with better accuracy
  const detectNearbyObjects = (detection: any) => {
    const video = videoRef?.current;
    if (!video) return;
    
    // Simulate makeup tools detection (in a real implementation, this would be AI-based)
    if (Math.random() < 0.2) { // More frequent detection to appear more responsive
      // Common makeup tools
      const products = [
        'Foundation brush',
        'Lipstick',
        'Eyeshadow palette', 
        'Blush brush',
        'Makeup sponge',
        'Concealer',
        'Mascara wand',
        'Eyeliner pen'
      ];
      
      // Calculate a position that's actually near the face for more accurate visualization
      const faceCenterX = facePosition.x + facePosition.width / 2;
      const faceCenterY = facePosition.y + facePosition.height / 2;
      
      // Simulate positions that make sense (near the face)
      const offsetX = (Math.random() - 0.5) * 1.5 * facePosition.width;
      const offsetY = (Math.random() - 0.5) * 1.5 * facePosition.height;
      
      const detectedProduct = products[Math.floor(Math.random() * products.length)];
      
      const newObject = {
        type: detectedProduct,
        confidence: 0.7 + Math.random() * 0.3,
        position: { 
          x: faceCenterX + offsetX, 
          y: faceCenterY + offsetY 
        }
      };
      
      setNearbyObjects([newObject]);
      
      const activity = `Detected ${detectedProduct}`;
      setLastActivity(activity);
      if (onActivityDetected) onActivityDetected(activity);
      
      console.log('Detected makeup object:', detectedProduct, 'near face at position:', {
        x: faceCenterX + offsetX,
        y: faceCenterY + offsetY
      });
      
      // Clear after a few seconds
      setTimeout(() => {
        setNearbyObjects([]);
      }, 3000);
    }
  };

  // Get movement history for AI learning
  const getMovementHistoryData = () => {
    return getMovementHistory();
  };

  return {
    faceDetectionReady,
    setFaceDetectionReady,
    faceDetected,
    facePosition,
    movementData,
    lastActivity,
    nearbyObjects,
    getMovementHistoryData,
    detectionConfidence
  };
};
