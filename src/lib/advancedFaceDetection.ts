
import * as faceapi from '@vladmandic/face-api';
import * as facemesh from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors } from '@mediapipe/drawing_utils';

// Track model loading state
let modelsLoaded = false;
let mediapipeLoaded = false;
let faceMeshInstance: facemesh.FaceMesh | null = null;
let cameraInstance: Camera | null = null;

// Store movement data for analysis
const movementHistory: Array<{x: number, y: number, magnitude: number, timestamp: number}> = [];
const MAX_HISTORY_LENGTH = 30;

// Initialize the advanced face detection models
export const initAdvancedFaceDetection = async (): Promise<boolean> => {
  if (modelsLoaded && mediapipeLoaded) return true;
  
  try {
    // Load face-api.js models first
    if (!modelsLoaded) {
      console.log('Loading face-api.js models from CDN...');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
        faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
        faceapi.nets.ageGenderNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
        faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model')
      ]);
      modelsLoaded = true;
      console.log('Face-api.js models loaded successfully');
    }
    
    // Initialize MediaPipe FaceMesh
    if (!mediapipeLoaded) {
      faceMeshInstance = new facemesh.FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });
      
      faceMeshInstance.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      mediapipeLoaded = true;
      console.log('MediaPipe FaceMesh initialized successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing advanced face detection:', error);
    return false;
  }
};

// Setup the camera with MediaPipe for continuous detection
export const setupAdvancedCamera = (
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  onFaceDetected: (detected: boolean, landmarks?: any) => void,
  onResults: (results: facemesh.Results) => void
): void => {
  if (!faceMeshInstance) {
    console.error('FaceMesh not initialized');
    return;
  }
  
  faceMeshInstance.onResults((results) => {
    const canvasCtx = canvasElement.getContext('2d');
    if (!canvasCtx) return;
    
    // Clear the canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw the video frame
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      // Face detected
      onFaceDetected(true, results.multiFaceLandmarks[0]);
      
      // Draw a green border around the face instead of the mesh
      const landmarks = results.multiFaceLandmarks[0];
      
      // Calculate bounding box
      let minX = Number.MAX_VALUE;
      let minY = Number.MAX_VALUE;
      let maxX = 0;
      let maxY = 0;
      
      for (const landmark of landmarks) {
        minX = Math.min(minX, landmark.x * canvasElement.width);
        minY = Math.min(minY, landmark.y * canvasElement.height);
        maxX = Math.max(maxX, landmark.x * canvasElement.width);
        maxY = Math.max(maxY, landmark.y * canvasElement.height);
      }
      
      // Add padding
      const padding = 20;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvasElement.width, maxX + padding);
      maxY = Math.min(canvasElement.height, maxY + padding);
      
      // Draw the border
      canvasCtx.strokeStyle = '#00FF00';
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      
      // Add glow effect
      canvasCtx.shadowColor = '#00FF00';
      canvasCtx.shadowBlur = 15;
      canvasCtx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      
      // Reset shadow
      canvasCtx.shadowBlur = 0;
      
      // Call the results callback
      onResults(results);
    } else {
      // No face detected
      onFaceDetected(false);
    }
  });
  
  if (!cameraInstance) {
    cameraInstance = new Camera(videoElement, {
      onFrame: async () => {
        if (faceMeshInstance) {
          await faceMeshInstance.send({image: videoElement});
        }
      },
      width: 640,
      height: 480
    });
  }
  
  cameraInstance.start();
};

// Get makeup regions based on face landmarks
export const getMakeupRegions = (landmarks: any) => {
  if (!landmarks) return null;
  
  const width = 640; // Standard width
  const height = 480; // Standard height
  
  // Convert normalized coordinates to pixel coordinates
  const getPixelCoords = (landmark: any) => {
    return {
      x: Math.floor(landmark.x * width),
      y: Math.floor(landmark.y * height)
    };
  };
  
  // Define makeup regions based on landmark indices
  // MediaPipe FaceMesh has 468 landmarks
  
  // Eyes region (landmarks around eyes)
  const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
  const rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
  
  // Lips region
  const lipsIndices = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0];
  
  // Cheeks region
  const leftCheekIndices = [116, 123, 147, 187, 207, 216];
  const rightCheekIndices = [346, 345, 376, 411, 427, 436];
  
  // Forehead region
  const foreheadIndices = [10, 8, 6, 191, 251, 284, 332, 297, 338];
  
  // Extract coordinates for each region
  const extractRegion = (indices: number[]) => {
    return indices.map(idx => getPixelCoords(landmarks[idx]));
  };
  
  return {
    eyes: {
      left: extractRegion(leftEyeIndices),
      right: extractRegion(rightEyeIndices),
    },
    lips: extractRegion(lipsIndices),
    cheeks: {
      left: extractRegion(leftCheekIndices),
      right: extractRegion(rightCheekIndices),
    },
    forehead: extractRegion(foreheadIndices),
    // For virtual makeup application
    eyebrows: {
      left: [landmarks[282], landmarks[295], landmarks[300], landmarks[293], landmarks[334]],
      right: [landmarks[52], landmarks[65], landmarks[70], landmarks[63], landmarks[105]]
    }
  };
};

// Apply virtual makeup to specific regions
export const applyVirtualMakeup = (
  canvasContext: CanvasRenderingContext2D,
  regions: any,
  makeup: {
    eyes?: { color: string; intensity: number; style?: string },
    lips?: { color: string; intensity: number; glossy?: boolean },
    cheeks?: { color: string; intensity: number },
    foundation?: { color: string; coverage: number }
  }
) => {
  if (!regions) return;
  
  // Apply foundation if specified
  if (makeup.foundation) {
    const { color, coverage } = makeup.foundation;
    canvasContext.save();
    canvasContext.fillStyle = color;
    canvasContext.globalAlpha = coverage * 0.3; // Subtle foundation effect
    
    // Create a path encompassing the whole face
    canvasContext.beginPath();
    
    // Use forehead, cheeks, and chin points to create face outline
    const facePoints = [
      ...regions.forehead,
      ...regions.cheeks.right,
      ...regions.cheeks.left
    ];
    
    if (facePoints.length > 0) {
      canvasContext.moveTo(facePoints[0].x, facePoints[0].y);
      for (let i = 1; i < facePoints.length; i++) {
        canvasContext.lineTo(facePoints[i].x, facePoints[i].y);
      }
      canvasContext.closePath();
      canvasContext.fill();
    }
    
    canvasContext.restore();
  }
  
  // Apply eye makeup
  if (makeup.eyes && regions.eyes) {
    const { color, intensity, style } = makeup.eyes;
    
    canvasContext.save();
    canvasContext.fillStyle = color;
    canvasContext.globalAlpha = intensity * 0.7;
    
    // Left eye shadow
    if (regions.eyes.left.length > 0) {
      canvasContext.beginPath();
      canvasContext.moveTo(regions.eyes.left[0].x, regions.eyes.left[0].y);
      
      for (let i = 1; i < regions.eyes.left.length; i++) {
        canvasContext.lineTo(regions.eyes.left[i].x, regions.eyes.left[i].y);
      }
      
      canvasContext.closePath();
      canvasContext.fill();
    }
    
    // Right eye shadow
    if (regions.eyes.right.length > 0) {
      canvasContext.beginPath();
      canvasContext.moveTo(regions.eyes.right[0].x, regions.eyes.right[0].y);
      
      for (let i = 1; i < regions.eyes.right.length; i++) {
        canvasContext.lineTo(regions.eyes.right[i].x, regions.eyes.right[i].y);
      }
      
      canvasContext.closePath();
      canvasContext.fill();
    }
    
    canvasContext.restore();
  }
  
  // Apply lip makeup
  if (makeup.lips && regions.lips) {
    const { color, intensity, glossy } = makeup.lips;
    
    canvasContext.save();
    canvasContext.fillStyle = color;
    canvasContext.globalAlpha = intensity * 0.8;
    
    if (regions.lips.length > 0) {
      canvasContext.beginPath();
      canvasContext.moveTo(regions.lips[0].x, regions.lips[0].y);
      
      for (let i = 1; i < regions.lips.length; i++) {
        canvasContext.lineTo(regions.lips[i].x, regions.lips[i].y);
      }
      
      canvasContext.closePath();
      canvasContext.fill();
      
      // Add glossy effect if enabled
      if (glossy) {
        canvasContext.globalAlpha = 0.3;
        canvasContext.fillStyle = "#ffffff";
        canvasContext.fill();
      }
    }
    
    canvasContext.restore();
  }
  
  // Apply blush to cheeks
  if (makeup.cheeks && regions.cheeks) {
    const { color, intensity } = makeup.cheeks;
    
    canvasContext.save();
    canvasContext.fillStyle = color;
    canvasContext.globalAlpha = intensity * 0.4;
    
    // Left cheek
    if (regions.cheeks.left.length > 0) {
      canvasContext.beginPath();
      
      // Calculate center of left cheek
      let leftCheekX = 0, leftCheekY = 0;
      regions.cheeks.left.forEach(point => {
        leftCheekX += point.x;
        leftCheekY += point.y;
      });
      leftCheekX /= regions.cheeks.left.length;
      leftCheekY /= regions.cheeks.left.length;
      
      // Draw a radial gradient for more realistic blush
      const leftGradient = canvasContext.createRadialGradient(
        leftCheekX, leftCheekY, 5,
        leftCheekX, leftCheekY, 30
      );
      leftGradient.addColorStop(0, color);
      leftGradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      canvasContext.fillStyle = leftGradient;
      canvasContext.arc(leftCheekX, leftCheekY, 30, 0, Math.PI * 2);
      canvasContext.fill();
    }
    
    // Right cheek
    if (regions.cheeks.right.length > 0) {
      canvasContext.beginPath();
      
      // Calculate center of right cheek
      let rightCheekX = 0, rightCheekY = 0;
      regions.cheeks.right.forEach(point => {
        rightCheekX += point.x;
        rightCheekY += point.y;
      });
      rightCheekX /= regions.cheeks.right.length;
      rightCheekY /= regions.cheeks.right.length;
      
      // Draw a radial gradient for more realistic blush
      const rightGradient = canvasContext.createRadialGradient(
        rightCheekX, rightCheekY, 5,
        rightCheekX, rightCheekY, 30
      );
      rightGradient.addColorStop(0, color);
      rightGradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      canvasContext.fillStyle = rightGradient;
      canvasContext.arc(rightCheekX, rightCheekY, 30, 0, Math.PI * 2);
      canvasContext.fill();
    }
    
    canvasContext.restore();
  }
};

// Track movement for animation and analysis
export const trackFacialMovement = (currentLandmarks: any, previousLandmarks: any) => {
  if (!currentLandmarks || !previousLandmarks) return { x: 0, y: 0, magnitude: 0 };
  
  // Use nose tip as reference point (landmark 1)
  const currentNose = currentLandmarks[1];
  const previousNose = previousLandmarks[1];
  
  const deltaX = currentNose.x - previousNose.x;
  const deltaY = currentNose.y - previousNose.y;
  const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 100;
  
  return { x: deltaX * 100, y: deltaY * 100, magnitude };
};

// Clean up resources
export const cleanupAdvancedFaceDetection = () => {
  if (cameraInstance) {
    cameraInstance.stop();
    cameraInstance = null;
  }
  
  faceMeshInstance = null;
};
