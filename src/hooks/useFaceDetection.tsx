
import { useState, useRef, useEffect } from 'react';
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
  
  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionTime = useRef(0);
  
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
    }
    
    // Log significant activities for AI learning
    if (movementData.magnitude > 3) {
      console.log('Activity detected:', lastActivity, 'Movement:', movementData);
    }
  }, [movementData, faceDetected, enabled, lastActivity]);

  // Run face detection on interval
  useEffect(() => {
    if (!enabled || !videoRef?.current) {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }
    
    detectionIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current) return;
      
      try {
        const now = Date.now();
        // Limit detection frequency to avoid performance issues
        if (now - lastDetectionTime.current < 300) return;
        lastDetectionTime.current = now;
        
        const detection = await detectFacialLandmarks(videoRef.current);
        const wasDetected = !!detection;
        
        // Only update state if detection status changed to avoid rerenders
        if (wasDetected !== faceDetected) {
          setFaceDetected(wasDetected);
        }
        
        if (wasDetected && detection) {
          // Get face position and dimensions
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
          
          // Mock object detection for now (would be replaced with real AI object detection)
          simulateObjectDetection();
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }, 500);
    
    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [enabled, videoRef, faceDetected]);

  // Simulate makeup object detection (this would be replaced with actual AI detection)
  const simulateObjectDetection = () => {
    // Randomly simulate detecting a makeup product every 10 seconds or so
    if (Math.random() < 0.1) {
      const products = [
        'Foundation brush',
        'Lipstick',
        'Eyeshadow palette', 
        'Blush brush',
        'Makeup sponge'
      ];
      
      const detectedProduct = products[Math.floor(Math.random() * products.length)];
      setNearbyObjects([{
        type: detectedProduct,
        confidence: 0.7 + Math.random() * 0.3,
        position: { 
          x: Math.random() * 100, 
          y: Math.random() * 100 
        }
      }]);
      
      setLastActivity(`Detected ${detectedProduct}`);
      
      // Clear after a few seconds
      setTimeout(() => {
        setNearbyObjects([]);
      }, 5000);
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
