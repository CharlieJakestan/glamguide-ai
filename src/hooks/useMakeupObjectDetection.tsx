
import { useState, useRef, useEffect } from 'react';

interface MakeupObject {
  type: string;
  confidence: number;
  position: { x: number, y: number };
  lastSeen: number;
}

export const useMakeupObjectDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean
) => {
  const [detectedObjects, setDetectedObjects] = useState<MakeupObject[]>([]);
  const [currentActivity, setCurrentActivity] = useState<string | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const objectsRef = useRef<MakeupObject[]>([]);
  
  // Makeup products and tools that can be detected
  const makeupItems = [
    { name: 'Foundation brush', category: 'tool', relatedTo: 'foundation' },
    { name: 'Makeup sponge', category: 'tool', relatedTo: 'foundation' },
    { name: 'Foundation bottle', category: 'product', relatedTo: 'foundation' },
    { name: 'Lipstick', category: 'product', relatedTo: 'lips' },
    { name: 'Lip liner', category: 'product', relatedTo: 'lips' },
    { name: 'Lip gloss', category: 'product', relatedTo: 'lips' },
    { name: 'Eyeshadow palette', category: 'product', relatedTo: 'eyes' },
    { name: 'Eyeshadow brush', category: 'tool', relatedTo: 'eyes' },
    { name: 'Eyeliner', category: 'product', relatedTo: 'eyes' },
    { name: 'Mascara', category: 'product', relatedTo: 'eyes' },
    { name: 'Blush brush', category: 'tool', relatedTo: 'cheeks' },
    { name: 'Blush compact', category: 'product', relatedTo: 'cheeks' },
    { name: 'Powder brush', category: 'tool', relatedTo: 'face' },
    { name: 'Setting powder', category: 'product', relatedTo: 'face' },
    { name: 'Highlighter', category: 'product', relatedTo: 'cheeks' },
    { name: 'Contour stick', category: 'product', relatedTo: 'face' },
    { name: 'Brow pencil', category: 'product', relatedTo: 'brows' },
    { name: 'Makeup mirror', category: 'tool', relatedTo: 'general' }
  ];
  
  // Detect makeup objects (simulation for now)
  useEffect(() => {
    if (!enabled || !videoRef.current) {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }
    
    // Simulate random object detection
    detectionIntervalRef.current = window.setInterval(() => {
      // Randomly detect a makeup item (2% chance per interval)
      if (Math.random() < 0.02) {
        const randomItem = makeupItems[Math.floor(Math.random() * makeupItems.length)];
        
        // Create random position near center of frame
        const position = {
          x: 0.5 + (Math.random() - 0.5) * 0.3, // 0.35 - 0.65 range (normalized)
          y: 0.5 + (Math.random() - 0.5) * 0.3  // 0.35 - 0.65 range (normalized)
        };
        
        // Simulate varying confidence levels
        const confidence = 0.7 + Math.random() * 0.3;
        
        // Create new detected object
        const newObject: MakeupObject = {
          type: randomItem.name,
          confidence,
          position,
          lastSeen: Date.now()
        };
        
        // Update objects ref
        const updatedObjects = [...objectsRef.current, newObject];
        objectsRef.current = updatedObjects;
        setDetectedObjects(updatedObjects);
        
        // Generate activity description
        const action = randomItem.category === 'tool' ? 'using' : 'applying';
        const newActivity = `${action} ${randomItem.name.toLowerCase()}`;
        setCurrentActivity(newActivity);
        
        // Log for AI learning
        console.log('Detected makeup object:', randomItem.name, 'Confidence:', confidence.toFixed(2));
        
        // Clean up after 5 seconds
        setTimeout(() => {
          setCurrentActivity(null);
          
          // Remove old objects
          const now = Date.now();
          const filteredObjects = objectsRef.current.filter(obj => now - obj.lastSeen < 5000);
          objectsRef.current = filteredObjects;
          setDetectedObjects(filteredObjects);
        }, 5000);
      }
    }, 2000);
    
    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [enabled, videoRef, makeupItems]);
  
  // Get makeup recommendations based on current step
  const getMakeupRecommendation = (currentStep: string | null): string | null => {
    if (!currentStep) return null;
    
    // Extract the area being worked on from the step description
    const step = currentStep.toLowerCase();
    let area = null;
    
    if (step.includes('foundation') || step.includes('concealer')) {
      area = 'foundation';
    } else if (step.includes('eye') || step.includes('shadow') || step.includes('mascara')) {
      area = 'eyes';
    } else if (step.includes('lip')) {
      area = 'lips';
    } else if (step.includes('blush') || step.includes('cheek')) {
      area = 'cheeks';
    } else if (step.includes('contour') || step.includes('highlight')) {
      area = 'face';
    } else if (step.includes('brow')) {
      area = 'brows';
    }
    
    if (!area) return null;
    
    // Find relevant products and tools
    const relevantItems = makeupItems.filter(item => item.relatedTo === area);
    
    if (relevantItems.length === 0) return null;
    
    // Select a random item to recommend
    const recommendedItem = relevantItems[Math.floor(Math.random() * relevantItems.length)];
    const recommendationAction = recommendedItem.category === 'tool' ? 'Use' : 'Apply';
    
    return `${recommendationAction} ${recommendedItem.name.toLowerCase()} for this step`;
  };
  
  return {
    detectedObjects,
    currentActivity,
    getMakeupRecommendation
  };
};
