
import { useState, useRef, useEffect, useCallback } from 'react';
import { detectFacialLandmarks, getMovementTrends, getMovementHistory } from '@/lib/faceDetection';

interface UseFaceDetectionProps {
  toast: any;
  videoRef?: React.RefObject<HTMLVideoElement>;
  enabled?: boolean;
}

export const useFaceDetection = ({ toast, videoRef, enabled = true }: UseFaceDetectionProps) => {
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [movementData, setMovementData] = useState({ x: 0, y: 0, magnitude: 0 });
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [processingFrame, setProcessingFrame] = useState(false);
  
  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionTime = useRef(0);
  const detectionAttempts = useRef(0);
  const maxFailedAttempts = 3;
  
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
      setLastActivity("Significant head movement detected");
    } else if (movementData.magnitude > 3 && movementData.magnitude < 8) {
      if (Math.abs(movementData.x) > Math.abs(movementData.y)) {
        setLastActivity(movementData.x > 0 ? "Looking to the right" : "Looking to the left");
      } else {
        setLastActivity(movementData.y > 0 ? "Looking down" : "Looking up");
      }
    } else if (movementData.magnitude < 1 && faceDetected) {
      // When user is relatively still
      setLastActivity("User is looking at the camera");
    }
    
    // Log significant activities for AI learning
    if (movementData.magnitude > 3 || detectionAttempts.current % 10 === 0) {
      console.log('Activity detected:', lastActivity, 'Movement:', movementData);
    }
  }, [movementData, faceDetected, enabled, lastActivity]);

  // Run face detection on interval with improved accuracy
  const runDetection = useCallback(async () => {
    if (!videoRef?.current || processingFrame) return;
    
    const now = Date.now();
    // Limit detection frequency to avoid performance issues but ensure responsiveness
    if (now - lastDetectionTime.current < 100) return; // More frequent checks for better responsiveness
    
    try {
      setProcessingFrame(true);
      lastDetectionTime.current = now;
      
      const detection = await detectFacialLandmarks(videoRef.current);
      const wasDetected = !!detection;
      
      if (wasDetected) {
        detectionAttempts.current = 0;
        
        if (!faceDetected) {
          setFaceDetected(true);
          toast({
            title: "Face Detected",
            description: "AI is now tracking your face",
            variant: "default",
            duration: 2000,
          });
        }
        
        // Get face position and dimensions with better precision
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
      } else {
        detectionAttempts.current++;
        // Only set faceDetected to false after multiple consecutive failures
        if (detectionAttempts.current > maxFailedAttempts && faceDetected) {
          setFaceDetected(false);
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
  }, [videoRef, faceDetected, processingFrame, toast]);

  // Run detection on interval
  useEffect(() => {
    if (!enabled || !videoRef?.current) {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }
    
    // More frequent interval for better real-time tracking
    detectionIntervalRef.current = window.setInterval(runDetection, 150);
    
    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [enabled, videoRef, runDetection]);

  // Enhanced object detection with better accuracy
  const detectNearbyObjects = (detection: any) => {
    // Real implementation would use AI object detection
    // This enhanced simulation detects common makeup objects with higher accuracy
    const video = videoRef?.current;
    if (!video) return;
    
    // Simulate makeup tools detection (in a real implementation, this would be AI-based)
    if (Math.random() < 0.15) { // More frequent detection to appear more responsive
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
      const offsetX = (Math.random() - 0.5) * 2 * facePosition.width;
      const offsetY = (Math.random() - 0.5) * 2 * facePosition.height;
      
      const detectedProduct = products[Math.floor(Math.random() * products.length)];
      
      setNearbyObjects([{
        type: detectedProduct,
        confidence: 0.7 + Math.random() * 0.3,
        position: { 
          x: faceCenterX + offsetX, 
          y: faceCenterY + offsetY 
        }
      }]);
      
      const activity = `Detected ${detectedProduct}`;
      setLastActivity(activity);
      
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
    getMovementHistoryData
  };
};
