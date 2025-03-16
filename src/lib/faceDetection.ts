
// Enhanced face detection with better accuracy and performance
import * as faceapi from '@vladmandic/face-api';

// Track model loading state
let modelsLoaded = false;
let modelLoadingPromise: Promise<boolean> | null = null;

// Store movement data for analysis
const movementHistory: Array<{x: number, y: number, magnitude: number, timestamp: number}> = [];
const MAX_HISTORY_LENGTH = 30;

// Initialize the face detection models
export const initFaceDetection = async (timeout?: number): Promise<boolean> => {
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

// Adding this function to fix the error in Camera.tsx
export const applyVirtualMakeup = (
  canvas: HTMLCanvasElement,
  landmarks: faceapi.FaceLandmarks68,
  makeupProducts: Array<{type: string, color: string, intensity: number}>
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // This is a simplified implementation
  // In a real implementation, you would apply different makeup effects based on the product type
  makeupProducts.forEach(product => {
    if (product.type === 'lipstick') {
      applyLipstick(ctx, landmarks, product.color, product.intensity);
    } else if (product.type === 'eyeshadow') {
      applyEyeshadow(ctx, landmarks, product.color, product.intensity);
    } else if (product.type === 'blush') {
      applyBlush(ctx, landmarks, product.color, product.intensity);
    }
  });
};

// Helper functions for virtual makeup application
const applyLipstick = (
  ctx: CanvasRenderingContext2D,
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
) => {
  // Get lip landmarks
  const lipPoints = landmarks.positions.slice(48, 60);
  
  // Draw lips
  ctx.beginPath();
  ctx.moveTo(lipPoints[0].x, lipPoints[0].y);
  
  for (let i = 1; i < lipPoints.length; i++) {
    ctx.lineTo(lipPoints[i].x, lipPoints[i].y);
  }
  
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = intensity / 100; // Adjust opacity based on intensity
  ctx.fill();
  ctx.globalAlpha = 1.0; // Reset opacity
};

const applyEyeshadow = (
  ctx: CanvasRenderingContext2D,
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
) => {
  // Left eye
  const leftEyePoints = landmarks.positions.slice(36, 42);
  ctx.beginPath();
  ctx.moveTo(leftEyePoints[0].x, leftEyePoints[0].y);
  
  for (let i = 1; i < leftEyePoints.length; i++) {
    ctx.lineTo(leftEyePoints[i].x, leftEyePoints[i].y);
  }
  
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = intensity / 100;
  ctx.fill();
  
  // Right eye
  const rightEyePoints = landmarks.positions.slice(42, 48);
  ctx.beginPath();
  ctx.moveTo(rightEyePoints[0].x, rightEyePoints[0].y);
  
  for (let i = 1; i < rightEyePoints.length; i++) {
    ctx.lineTo(rightEyePoints[i].x, rightEyePoints[i].y);
  }
  
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1.0; // Reset opacity
};

const applyBlush = (
  ctx: CanvasRenderingContext2D,
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
) => {
  // Left cheek
  const leftCheekCenter = {
    x: (landmarks.positions[1].x + landmarks.positions[2].x) / 2,
    y: (landmarks.positions[1].y + landmarks.positions[2].y) / 2
  };
  
  // Right cheek
  const rightCheekCenter = {
    x: (landmarks.positions[15].x + landmarks.positions[16].x) / 2,
    y: (landmarks.positions[15].y + landmarks.positions[16].y) / 2
  };
  
  // Apply blush to both cheeks
  const radius = landmarks.positions[16].x - landmarks.positions[0].x;
  
  ctx.beginPath();
  ctx.arc(leftCheekCenter.x, leftCheekCenter.y, radius / 4, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.globalAlpha = intensity / 100;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(rightCheekCenter.x, rightCheekCenter.y, radius / 4, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1.0; // Reset opacity
};
