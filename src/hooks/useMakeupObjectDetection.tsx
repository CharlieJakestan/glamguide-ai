
import { useState, useRef, useEffect, useCallback } from 'react';
import { detectMakeupObjects } from '@/lib/faceDetection';

export interface DetectedObject {
  type: string;
  confidence: number;
  position: { x: number, y: number };
}

interface UseMakeupObjectDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  enabled: boolean;
  faceDetected: boolean;
  currentStep?: string;
}

export const useMakeupObjectDetection = ({
  videoRef,
  enabled,
  faceDetected,
  currentStep = ''
}: UseMakeupObjectDetectionProps) => {
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [lastDetectedObject, setLastDetectedObject] = useState<DetectedObject | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [relevantToStep, setRelevantToStep] = useState(false);
  
  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionTime = useRef(0);
  const detectionHistoryRef = useRef<Map<string, number>>(new Map());
  
  // Clear old objects from history 
  const cleanupHistory = useCallback(() => {
    const now = Date.now();
    const MAX_AGE = 60000; // 1 minute
    
    for (const [type, timestamp] of detectionHistoryRef.current.entries()) {
      if (now - timestamp > MAX_AGE) {
        detectionHistoryRef.current.delete(type);
      }
    }
  }, []);
  
  // Check if an object is relevant to the current makeup step
  const checkRelevance = useCallback((objectType: string, step: string) => {
    const relevanceMap: Record<string, string[]> = {
      'foundation': ['foundation', 'primer', 'base', 'sponge'],
      'concealer': ['concealer', 'sponge', 'brush'],
      'powder': ['powder', 'brush', 'puff'],
      'contour': ['contour', 'brush', 'bronzer'],
      'blush': ['blush', 'brush', 'cheek'],
      'highlight': ['highlight', 'highlighter', 'brush', 'glow'],
      'eyeshadow': ['eyeshadow', 'palette', 'eye', 'brush', 'shadow'],
      'eyeliner': ['eyeliner', 'liner', 'eye', 'pencil'],
      'mascara': ['mascara', 'lash', 'wand'],
      'lipstick': ['lipstick', 'lip', 'gloss', 'liner']
    };
    
    const lowerType = objectType.toLowerCase();
    const lowerStep = step.toLowerCase();
    
    // Check if any keywords from the step are in our relevance map
    for (const [key, keywords] of Object.entries(relevanceMap)) {
      if (lowerStep.includes(key)) {
        // Check if the detected object type contains any relevant keywords
        return keywords.some(keyword => lowerType.includes(keyword));
      }
    }
    
    return false;
  }, []);
  
  // Run detection logic
  const runDetection = useCallback(async () => {
    if (!videoRef.current || !enabled || !faceDetected || isProcessing) return;
    
    const now = Date.now();
    // Limit detection frequency
    if (now - lastDetectionTime.current < 1000) return;
    
    try {
      setIsProcessing(true);
      lastDetectionTime.current = now;
      
      const objects = await detectMakeupObjects(videoRef.current);
      
      if (objects.length > 0) {
        setDetectedObjects(objects);
        
        // Update detection history
        objects.forEach(obj => {
          detectionHistoryRef.current.set(obj.type, now);
        });
        
        // Set last detected object
        const highestConfidence = objects.reduce((prev, current) => 
          (prev.confidence > current.confidence) ? prev : current
        );
        
        setLastDetectedObject(highestConfidence);
        
        // Check if object is relevant to current step
        if (currentStep) {
          const isRelevant = checkRelevance(highestConfidence.type, currentStep);
          setRelevantToStep(isRelevant);
          
          console.log(`Detected ${highestConfidence.type} - Relevant to step "${currentStep}": ${isRelevant}`);
        }
      }
      
      // Clean up old entries
      cleanupHistory();
    } catch (error) {
      console.error('Error in makeup object detection:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [videoRef, enabled, faceDetected, isProcessing, currentStep, checkRelevance, cleanupHistory]);
  
  // Set up detection interval
  useEffect(() => {
    if (!enabled || !videoRef.current) {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }
    
    // Run detection every 2 seconds
    detectionIntervalRef.current = window.setInterval(runDetection, 2000);
    
    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [enabled, videoRef, runDetection]);
  
  // Get recent detection history
  const getRecentDetections = () => {
    return Array.from(detectionHistoryRef.current.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by most recent
      .map(([type]) => type);
  };
  
  return {
    detectedObjects,
    lastDetectedObject,
    relevantToStep,
    getRecentDetections
  };
};
