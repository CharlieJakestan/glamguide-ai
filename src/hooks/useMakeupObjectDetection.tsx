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
  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionTime = useRef<number>(0);
  
  // Tools that we've seen so far (for UI display)
  const [detectedMakeupTools, setDetectedMakeupTools] = useState<Array<{
    type: string;
    confidence: number;
    lastSeen: number;
  }>>([]);
  
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
    if (!enabled) {
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
  }, [enabled, facePosition]);
  
  return {
    detectedObjects,
    isDetecting,
    detectedMakeupTools
  };
};
