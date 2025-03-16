
// Enhanced face detection with better accuracy and performance
import * as faceapi from '@vladmandic/face-api';

// Track model loading state
let modelsLoaded = false;
let modelLoadingPromise: Promise<boolean> | null = null;

// Store movement data for analysis
const movementHistory: Array<{x: number, y: number, magnitude: number, timestamp: number}> = [];
const MAX_HISTORY_LENGTH = 30;

// Initialize the face detection models
export const initFaceDetection = async (): Promise<boolean> => {
  if (modelsLoaded) return true;
  if (modelLoadingPromise) return modelLoadingPromise;

  try {
    modelLoadingPromise = new Promise(async (resolve) => {
      // Load models from public directory
      await faceapi.nets.tinyFaceDetector.load('/models');
      await faceapi.nets.faceLandmark68Net.load('/models');
      await faceapi.nets.faceExpressionNet.load('/models');
      
      console.log('Face detection models loaded successfully');
      modelsLoaded = true;
      resolve(true);
    });
    
    return modelLoadingPromise;
  } catch (error) {
    console.error('Failed to load face detection models:', error);
    return false;
  }
};

// Get movement trends from historical data
export const getMovementTrends = (): {x: number, y: number, magnitude: number} => {
  if (movementHistory.length < 2) {
    return { x: 0, y: 0, magnitude: 0 };
  }
  
  // Calculate average movement over the last few samples
  const recentHistory = movementHistory.slice(-5);
  const avgX = recentHistory.reduce((sum, item) => sum + item.x, 0) / recentHistory.length;
  const avgY = recentHistory.reduce((sum, item) => sum + item.y, 0) / recentHistory.length;
  const avgMagnitude = recentHistory.reduce((sum, item) => sum + item.magnitude, 0) / recentHistory.length;
  
  return { 
    x: parseFloat(avgX.toFixed(2)), 
    y: parseFloat(avgY.toFixed(2)), 
    magnitude: parseFloat(avgMagnitude.toFixed(2)) 
  };
};

// Get the full movement history for AI learning
export const getMovementHistory = () => [...movementHistory];

// Detect facial landmarks with improved accuracy
export const detectFacialLandmarks = async (
  videoElement: HTMLVideoElement
): Promise<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68> | null> => {
  if (!modelsLoaded) {
    console.warn('Face detection models not loaded yet');
    return null;
  }

  try {
    // Detect with more accurate parameters
    const options = new faceapi.TinyFaceDetectorOptions({ 
      inputSize: 320,
      scoreThreshold: 0.5
    });
    
    const result = await faceapi
      .detectSingleFace(videoElement, options)
      .withFaceLandmarks()
      .withFaceExpressions();
    
    if (result) {
      // Update movement history when we detect a face
      const detection = result.detection;
      const faceBox = detection.box;
      const centerX = faceBox.x + faceBox.width / 2;
      const centerY = faceBox.y + faceBox.height / 2;
      
      // Get face position relative to video dimensions
      const relX = centerX / videoElement.videoWidth;
      const relY = centerY / videoElement.videoHeight;
      
      // Calculate movement based on previous position
      let deltaX = 0;
      let deltaY = 0;
      let magnitude = 0;
      
      if (movementHistory.length > 0) {
        const lastPosition = movementHistory[movementHistory.length - 1];
        deltaX = relX - lastPosition.x;
        deltaY = relY - lastPosition.y;
        magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 100; // Scale for better UX
      }
      
      // Add to history
      movementHistory.push({
        x: relX,
        y: relY,
        magnitude,
        timestamp: Date.now()
      });
      
      // Limit history size
      while (movementHistory.length > MAX_HISTORY_LENGTH) {
        movementHistory.shift();
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in face detection:', error);
    return null;
  }
};

// Get bounding box for visualization
export const getFaceBoundingBox = (detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>): {
  x: number;
  y: number;
  width: number;
  height: number;
} => {
  const box = detection.detection.box;
  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height
  };
};

// Detect makeup tools near the face
export const detectMakeupTools = async (
  videoElement: HTMLVideoElement, 
  faceBoundingBox: { x: number, y: number, width: number, height: number } | null
): Promise<Array<{
  type: string;
  confidence: number;
  position: { x: number, y: number };
}>> => {
  // Mock implementation - in a real app, you would use a trained model here
  // This simulates detecting makeup tools with a focus near the face area
  if (!faceBoundingBox) return [];
  
  // Tools that might be detected
  const possibleTools = [
    'Foundation brush', 'Lipstick', 'Eyeshadow palette', 
    'Blush brush', 'Makeup sponge', 'Concealer',
    'Mascara wand', 'Eyeliner pen'
  ];
  
  // Randomly decide if we detect anything (30% chance)
  if (Math.random() > 0.7) {
    const toolIndex = Math.floor(Math.random() * possibleTools.length);
    const tool = possibleTools[toolIndex];
    
    // Place detection near the face area for realism
    const faceCenter = {
      x: faceBoundingBox.x + faceBoundingBox.width / 2,
      y: faceBoundingBox.y + faceBoundingBox.height / 2
    };
    
    // Random offset from face center
    const offsetX = (Math.random() - 0.5) * faceBoundingBox.width * 1.5;
    const offsetY = (Math.random() - 0.5) * faceBoundingBox.height * 1.5;
    
    return [{
      type: tool,
      confidence: 0.7 + Math.random() * 0.3, // 70-100% confidence
      position: {
        x: faceCenter.x + offsetX,
        y: faceCenter.y + offsetY
      }
    }];
  }
  
  return []; // No tools detected
};
