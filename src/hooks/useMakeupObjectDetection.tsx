
import { useState, useEffect, useRef } from 'react';
import { detectMakeupTools } from '@/lib/faceDetection';

export interface DetectedObject {
  type: string;
  confidence: number;
  position: { x: number, y: number };
}

interface UseMakeupObjectDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  facePosition: { x: number; y: number; width: number; height: number } | null;
  enabled: boolean;
  onObjectDetected?: (objects: DetectedObject[]) => void;
}

export const useMakeupObjectDetection = ({
  videoRef,
  facePosition,
  enabled = true,
  onObjectDetected
}: UseMakeupObjectDetectionProps) => {
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionTime = useRef<number>(0);
  
  // Tools that we've seen so far (for UI display)
  const [detectedMakeupTools, setDetectedMakeupTools] = useState<Array<{
    type: string;
    confidence: number;
    lastSeen: number;
  }>>([]);
  
  // Initialize detection setup
  useEffect(() => {
    const checkSetup = async () => {
      try {
        // Create a dummy canvas to test detection
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        
        // Test if detection can be initialized
        // Pass an HTMLVideoElement or create a compatible object for testing
        const mockVideoElement = {
          videoWidth: 10,
          videoHeight: 10
        } as unknown as HTMLVideoElement;
        
        // Use the mock video element for testing instead of canvas
        const testResult = await detectMakeupTools(mockVideoElement, { x: 0, y: 0, width: 10, height: 10 });
        
        // If we get here without error, setup is complete
        setSetupComplete(true);
        console.log('Makeup object detection initialized successfully');
      } catch (error) {
        console.error('Error initializing makeup object detection:', error);
        setSetupComplete(false);
      }
    };
    
    checkSetup();
  }, []);
  
  // Detect makeup objects near the face
  const detectObjects = async () => {
    if (!enabled || !videoRef.current || isDetecting || !facePosition) return;
    
    const now = Date.now();
    // Don't detect too frequently to avoid performance issues
    if (now - lastDetectionTime.current < 500) return;
    
    try {
      setIsDetecting(true);
      lastDetectionTime.current = now;
      
      const objects = await detectMakeupTools(videoRef.current, facePosition);
      
      if (objects.length > 0) {
        console.log('Detected makeup objects:', objects);
        setDetectedObjects(objects);
        
        // Update the makeup tools list
        const updatedTools = [...detectedMakeupTools];
        
        objects.forEach(obj => {
          const existingToolIndex = updatedTools.findIndex(
            tool => tool.type.toLowerCase() === obj.type.toLowerCase()
          );
          
          if (existingToolIndex >= 0) {
            // Update existing tool
            updatedTools[existingToolIndex] = {
              ...updatedTools[existingToolIndex],
              confidence: Math.max(updatedTools[existingToolIndex].confidence, obj.confidence),
              lastSeen: now
            };
          } else {
            // Add new tool
            updatedTools.push({
              type: obj.type,
              confidence: obj.confidence,
              lastSeen: now
            });
          }
        });
        
        // Remove tools that haven't been seen in a while (10 seconds)
        const filteredTools = updatedTools.filter(tool => now - tool.lastSeen < 10000);
        setDetectedMakeupTools(filteredTools);
        
        if (onObjectDetected) {
          onObjectDetected(objects);
        }
      } else {
        // Clear detected objects, but keep the makeup tools list
        setDetectedObjects([]);
      }
    } catch (error) {
      console.error('Error detecting makeup objects:', error);
    } finally {
      setIsDetecting(false);
    }
  };
  
  // Set up detection interval
  useEffect(() => {
    if (!enabled || !setupComplete) {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }
    
    detectionIntervalRef.current = window.setInterval(detectObjects, 500);
    
    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [enabled, facePosition, setupComplete]);
  
  return {
    detectedObjects,
    isDetecting,
    detectedMakeupTools,
    setupComplete
  };
};
