
import * as faceapi from 'face-api.js';

// Last detected landmarks for movement tracking
let lastDetectedLandmarks: faceapi.FaceLandmarks68 | null = null;
let movementHistory: Array<{x: number, y: number}> = [];
const MAX_HISTORY = 10; // Keep track of last 10 movements

// Movement threshold for detection (in pixels)
const MOVEMENT_THRESHOLD = 3;

// Updated model loading with CDN fallback
export const initFaceDetection = async (maxRetries = 3): Promise<boolean> => {
  let retries = 0;
  
  // Define both local and CDN paths
  const modelPaths = [
    'https://justadudewhohacks.github.io/face-api.js/models', // Primary path - start with CDN
    '/models'  // Local fallback
  ];
  
  let currentPathIndex = 0;
  let success = false;
  
  // Try loading from each path with retries
  while (!success && currentPathIndex < modelPaths.length) {
    const currentPath = modelPaths[currentPathIndex];
    console.log(`Attempting to load models from: ${currentPath}`);
    
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(currentPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(currentPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(currentPath),
        ]);
        console.log(`Face detection models loaded successfully from ${currentPath}`);
        return true;
      } catch (error) {
        console.error(`Error loading face detection models from ${currentPath}:`, error);
        return false;
      }
    };
    
    // First attempt with current path
    success = await loadModels();
    
    // Retry logic with the same path if needed
    retries = 0;
    while (!success && retries < maxRetries) {
      console.log(`Retrying face detection model loading from ${currentPath} (${retries + 1}/${maxRetries})...`);
      // Small delay before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      success = await loadModels();
      retries++;
    }
    
    // If still not successful, try next path
    if (!success) {
      currentPathIndex++;
    }
  }
  
  // Verify the models are actually loaded
  const modelsLoaded = 
    faceapi.nets.tinyFaceDetector.isLoaded && 
    faceapi.nets.faceLandmark68Net.isLoaded && 
    faceapi.nets.faceRecognitionNet.isLoaded;
    
  console.log('Face detection models loaded status:', modelsLoaded);
  return modelsLoaded;
};

// Enhanced face detection with improved parameters for reliability and movement tracking
export const detectFacialLandmarks = async (video: HTMLVideoElement) => {
  if (!video) return null;
  
  try {
    // More sensitive detection parameters for better accuracy
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.2  // Lower threshold for better detection in challenging conditions
    });
    
    const detections = await faceapi
      .detectSingleFace(video, options)
      .withFaceLandmarks();
    
    if (detections) {
      // Track movement between detections
      if (lastDetectedLandmarks) {
        const movement = detectMovement(lastDetectedLandmarks, detections.landmarks);
        if (movement) {
          // Add to movement history
          movementHistory.push(movement);
          if (movementHistory.length > MAX_HISTORY) {
            movementHistory.shift(); // Remove oldest entry
          }
          
          // Log significant movements for AI learning
          if (Math.abs(movement.x) > MOVEMENT_THRESHOLD || Math.abs(movement.y) > MOVEMENT_THRESHOLD) {
            console.log('Significant face movement detected:', movement);
          }
        }
      }
      
      // Update last detected landmarks
      lastDetectedLandmarks = detections.landmarks;
      
      return detections;
    } else {
      // Try again with even more lenient parameters if initial detection fails
      const fallbackOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224, // Smaller input size for faster detection
        scoreThreshold: 0.1 // Very lenient threshold
      });
      
      const fallbackDetections = await faceapi
        .detectSingleFace(video, fallbackOptions)
        .withFaceLandmarks();
        
      if (fallbackDetections) {
        console.log('Face detected with fallback parameters');
        
        // Update last detected landmarks
        lastDetectedLandmarks = fallbackDetections.landmarks;
        return fallbackDetections;
      } else {
        // Clear last landmarks if face is lost
        lastDetectedLandmarks = null;
        return null;
      }
    }
  } catch (error) {
    console.error('Error detecting facial landmarks:', error);
    return null;
  }
};

// Detect movement between two sets of landmarks
const detectMovement = (
  previous: faceapi.FaceLandmarks68, 
  current: faceapi.FaceLandmarks68
): {x: number, y: number} | null => {
  try {
    // Compare nose position as central reference point
    const prevNose = previous.getNose()[0]; // Nose tip
    const currNose = current.getNose()[0];
    
    // Calculate smoother movement by considering the average of multiple points
    const prevEyes = previous.getLeftEye()[0];
    const currEyes = current.getLeftEye()[0];
    
    // Weight the movement of nose and eyes for more stable tracking
    return {
      x: (currNose.x - prevNose.x) * 0.7 + (currEyes.x - prevEyes.x) * 0.3,
      y: (currNose.y - prevNose.y) * 0.7 + (currEyes.y - prevEyes.y) * 0.3
    };
  } catch (error) {
    console.error('Error detecting movement:', error);
    return null;
  }
};

// Get current movement trends from history with enhanced smoothing
export const getMovementTrends = () => {
  if (movementHistory.length < 2) return { x: 0, y: 0, magnitude: 0 };
  
  // Calculate weighted average - more recent movements have higher weights
  let totalWeight = 0;
  let weightedSumX = 0;
  let weightedSumY = 0;
  
  for (let i = 0; i < movementHistory.length; i++) {
    const weight = (i + 1) / movementHistory.length; // More recent = higher weight
    weightedSumX += movementHistory[i].x * weight;
    weightedSumY += movementHistory[i].y * weight;
    totalWeight += weight;
  }
  
  const avgX = weightedSumX / totalWeight;
  const avgY = weightedSumY / totalWeight;
  
  // Calculate magnitude of movement
  const magnitude = Math.sqrt(avgX * avgX + avgY * avgY);
  
  return { x: avgX, y: avgY, magnitude };
};

// Apply virtual makeup based on detected landmarks with improved rendering
export const applyVirtualMakeup = (
  canvas: HTMLCanvasElement,
  landmarks: faceapi.FaceLandmarks68,
  products: Array<{type: string, color: string, intensity: number}>
) => {
  if (!canvas || !landmarks) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply each product with improved blending
  products.forEach(product => {
    switch (product.type.toLowerCase()) {
      case 'lipstick':
        applyLipstick(ctx, landmarks, product.color, product.intensity);
        break;
      case 'blush':
        applyBlush(ctx, landmarks, product.color, product.intensity);
        break;
      case 'eyeshadow':
        applyEyeshadow(ctx, landmarks, product.color, product.intensity);
        break;
      case 'foundation':
        applyFoundation(ctx, landmarks, product.color, product.intensity);
        break;
      case 'highlighter':
        applyHighlighter(ctx, landmarks, product.color, product.intensity);
        break;
      // Support for more product types
    }
  });
};

// Helper functions for applying specific makeup products with improved realism
const applyLipstick = (
  ctx: CanvasRenderingContext2D,
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
) => {
  const mouth = landmarks.getMouth();
  
  ctx.beginPath();
  ctx.moveTo(mouth[0].x, mouth[0].y);
  
  // Draw upper lip with smoother curve
  for (let i = 1; i < 7; i++) {
    const cp1x = mouth[i-1].x + (mouth[i].x - mouth[i-1].x) * 0.5;
    const cp1y = mouth[i-1].y + (mouth[i].y - mouth[i-1].y) * 0.2;
    ctx.quadraticCurveTo(cp1x, cp1y, mouth[i].x, mouth[i].y);
  }
  
  // Draw lower lip with smoother curve
  for (let i = 6; i < 12; i++) {
    const cp1x = mouth[i].x + (mouth[i+1 >= mouth.length ? 0 : i+1].x - mouth[i].x) * 0.5;
    const cp1y = mouth[i].y + (mouth[i+1 >= mouth.length ? 0 : i+1].y - mouth[i].y) * 0.2;
    ctx.quadraticCurveTo(cp1x, cp1y, mouth[i+1 >= mouth.length ? 0 : i+1].x, mouth[i+1 >= mouth.length ? 0 : i+1].y);
  }
  
  ctx.closePath();
  
  // Apply color with intensity and better alpha blending for realism
  const alphaHex = Math.round(Math.min(intensity, 1) * 255).toString(16).padStart(2, '0');
  ctx.fillStyle = `${color}${alphaHex}`;
  ctx.fill();
  
  // Add subtle highlight for glossiness
  if (intensity > 0.6) {
    ctx.beginPath();
    ctx.moveTo(mouth[3].x, mouth[3].y);
    ctx.quadraticCurveTo(
      (mouth[3].x + mouth[4].x) / 2, 
      (mouth[3].y + mouth[4].y) / 2 - 2,
      mouth[4].x, mouth[4].y
    );
    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.4})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
};

const applyBlush = (
  ctx: CanvasRenderingContext2D,
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
) => {
  const jawline = landmarks.getJawOutline();
  const nose = landmarks.getNose();
  
  // Left cheek - more accurate positioning based on face shape
  const leftCheekX = (jawline[2].x + nose[0].x) / 2;
  const leftCheekY = (jawline[2].y + nose[0].y) / 2;
  
  // Right cheek - more accurate positioning based on face shape
  const rightCheekX = (jawline[14].x + nose[0].x) / 2;
  const rightCheekY = (jawline[14].y + nose[0].y) / 2;
  
  // Calculate appropriate radius based on face size
  const faceWidth = Math.max(jawline[16].x - jawline[0].x, 50);
  const blushRadius = faceWidth * 0.15; // Proportional to face width
  
  // Create radial gradient for more realistic blush
  const leftGradient = ctx.createRadialGradient(
    leftCheekX, leftCheekY, 0,
    leftCheekX, leftCheekY, blushRadius
  );
  
  const alphaHex = Math.round(Math.min(intensity, 1) * 255).toString(16).padStart(2, '0');
  leftGradient.addColorStop(0, `${color}${alphaHex}`);
  leftGradient.addColorStop(1, `${color}00`);
  
  // Apply blush to left cheek with gradient
  ctx.beginPath();
  ctx.arc(leftCheekX, leftCheekY, blushRadius, 0, 2 * Math.PI);
  ctx.fillStyle = leftGradient;
  ctx.fill();
  
  // Repeat for right cheek
  const rightGradient = ctx.createRadialGradient(
    rightCheekX, rightCheekY, 0,
    rightCheekX, rightCheekY, blushRadius
  );
  
  rightGradient.addColorStop(0, `${color}${alphaHex}`);
  rightGradient.addColorStop(1, `${color}00`);
  
  ctx.beginPath();
  ctx.arc(rightCheekX, rightCheekY, blushRadius, 0, 2 * Math.PI);
  ctx.fillStyle = rightGradient;
  ctx.fill();
};

const applyEyeshadow = (
  ctx: CanvasRenderingContext2D,
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
) => {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  
  // Enhanced eyeshadow application with gradient effect
  const applyToEye = (eye: any[]) => {
    // Calculate center and dimensions of eye
    let sumX = 0, sumY = 0;
    eye.forEach(point => {
      sumX += point.x;
      sumY += point.y;
    });
    const centerX = sumX / eye.length;
    const centerY = sumY / eye.length;
    
    // Find eye dimensions
    let minX = eye[0].x, maxX = eye[0].x, minY = eye[0].y, maxY = eye[0].y;
    eye.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Create extended path for eyeshadow (larger than just the eye)
    ctx.beginPath();
    ctx.moveTo(eye[0].x, eye[0].y - height * 0.5);
    
    // Upper lid with extension
    for (let i = 1; i < eye.length / 2; i++) {
      ctx.lineTo(eye[i].x, eye[i].y - height * 0.5);
    }
    
    // Lower lid
    for (let i = Math.floor(eye.length / 2); i < eye.length; i++) {
      ctx.lineTo(eye[i].x, eye[i].y);
    }
    ctx.closePath();
    
    // Create gradient for realistic eyeshadow
    const gradient = ctx.createRadialGradient(
      centerX, centerY - height * 0.2, 0,
      centerX, centerY - height * 0.2, width * 1.2
    );
    
    const alphaHex = Math.round(Math.min(intensity, 1) * 255).toString(16).padStart(2, '0');
    gradient.addColorStop(0, `${color}${alphaHex}`);
    gradient.addColorStop(1, `${color}00`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
  };
  
  // Apply to both eyes
  applyToEye(leftEye);
  applyToEye(rightEye);
};

const applyFoundation = (
  ctx: CanvasRenderingContext2D,
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
) => {
  const jawline = landmarks.getJawOutline();
  
  // Create a path around the face
  ctx.beginPath();
  ctx.moveTo(jawline[0].x, jawline[0].y);
  
  // Draw along jawline
  jawline.forEach(point => {
    ctx.lineTo(point.x, point.y);
  });
  
  // Connect to forehead
  const foreheadY = Math.min(...landmarks.positions.map(p => p.y)) - 10;
  ctx.lineTo(jawline[jawline.length - 1].x, foreheadY);
  ctx.lineTo(jawline[0].x, foreheadY);
  ctx.closePath();
  
  // Apply foundation with correct intensity
  const alphaHex = Math.round(Math.min(intensity * 0.7, 0.7) * 255).toString(16).padStart(2, '0');
  ctx.fillStyle = `${color}${alphaHex}`;
  ctx.fill();
};

const applyHighlighter = (
  ctx: CanvasRenderingContext2D,
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
) => {
  const nose = landmarks.getNose();
  const noseTip = nose[3]; // Tip of nose
  
  // Apply to nose bridge
  const gradient = ctx.createLinearGradient(
    noseTip.x, noseTip.y - 20,
    noseTip.x, noseTip.y
  );
  
  const alphaHex = Math.round(Math.min(intensity, 1) * 255).toString(16).padStart(2, '0');
  gradient.addColorStop(0, `${color}${alphaHex}`);
  gradient.addColorStop(1, `${color}00`);
  
  ctx.beginPath();
  ctx.ellipse(noseTip.x, noseTip.y - 10, 5, 10, 0, 0, 2 * Math.PI);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Apply to cheekbones
  const jawline = landmarks.getJawOutline();
  const leftCheekboneX = (jawline[3].x + nose[0].x) / 2;
  const leftCheekboneY = (jawline[3].y + nose[0].y) / 2;
  
  const rightCheekboneX = (jawline[13].x + nose[0].x) / 2;
  const rightCheekboneY = (jawline[13].y + nose[0].y) / 2;
  
  // Left cheekbone
  const leftGradient = ctx.createRadialGradient(
    leftCheekboneX, leftCheekboneY, 0,
    leftCheekboneX, leftCheekboneY, 15
  );
  
  leftGradient.addColorStop(0, `${color}${alphaHex}`);
  leftGradient.addColorStop(1, `${color}00`);
  
  ctx.beginPath();
  ctx.arc(leftCheekboneX, leftCheekboneY, 15, 0, 2 * Math.PI);
  ctx.fillStyle = leftGradient;
  ctx.fill();
  
  // Right cheekbone
  const rightGradient = ctx.createRadialGradient(
    rightCheekboneX, rightCheekboneY, 0,
    rightCheekboneX, rightCheekboneY, 15
  );
  
  rightGradient.addColorStop(0, `${color}${alphaHex}`);
  rightGradient.addColorStop(1, `${color}00`);
  
  ctx.beginPath();
  ctx.arc(rightCheekboneX, rightCheekboneY, 15, 0, 2 * Math.PI);
  ctx.fillStyle = rightGradient;
  ctx.fill();
};

// Export movement history for AI learning
export const getMovementHistory = () => [...movementHistory];

// Reset tracking (e.g., when session ends)
export const resetTracking = () => {
  lastDetectedLandmarks = null;
  movementHistory = [];
};

// Add object detection function for AI to recognize makeup tools
export const detectMakeupObjects = (videoElement: HTMLVideoElement): Promise<Array<{
  type: string;
  confidence: number;
  position: { x: number, y: number };
}>> => {
  return new Promise((resolve) => {
    // This is a placeholder for a real AI-based object detection
    // In a production app, this would use a real ML model to detect makeup tools
    
    // Simulated detection for testing UI
    setTimeout(() => {
      // 30% chance to detect an object
      if (Math.random() < 0.3) {
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
        
        const detectedProduct = products[Math.floor(Math.random() * products.length)];
        
        resolve([{
          type: detectedProduct,
          confidence: 0.7 + Math.random() * 0.3,
          position: { 
            x: Math.random() * videoElement.videoWidth, 
            y: Math.random() * videoElement.videoHeight
          }
        }]);
      } else {
        resolve([]);
      }
    }, 300);
  });
};
