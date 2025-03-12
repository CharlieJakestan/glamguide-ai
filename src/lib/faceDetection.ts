
import * as faceapi from 'face-api.js';

// Enhanced model loading with retries
export const initFaceDetection = async (maxRetries = 3): Promise<boolean> => {
  let retries = 0;
  
  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      console.log('Face detection models loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading face detection models:', error);
      return false;
    }
  };
  
  // First attempt
  let success = await loadModels();
  
  // Retry logic if needed
  while (!success && retries < maxRetries) {
    console.log(`Retrying face detection model loading (${retries + 1}/${maxRetries})...`);
    // Small delay before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    success = await loadModels();
    retries++;
  }
  
  // Verify the models are actually loaded
  const modelsLoaded = 
    faceapi.nets.tinyFaceDetector.isLoaded && 
    faceapi.nets.faceLandmark68Net.isLoaded && 
    faceapi.nets.faceRecognitionNet.isLoaded;
    
  console.log('Face detection models loaded status:', modelsLoaded);
  return modelsLoaded;
};

// Enhanced face detection with improved parameters for reliability
export const detectFacialLandmarks = async (video: HTMLVideoElement) => {
  if (!video) return null;
  
  try {
    // Using more forgiving detection parameters
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,  // Lower for better performance
      scoreThreshold: 0.3  // Lower threshold for better detection in challenging conditions
    });
    
    const detections = await faceapi
      .detectSingleFace(video, options)
      .withFaceLandmarks();
    
    if (detections) {
      console.log('Face detected successfully');
      return detections;
    } else {
      // Try again with even more lenient parameters if initial detection fails
      const fallbackOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 256,
        scoreThreshold: 0.2
      });
      
      const fallbackDetections = await faceapi
        .detectSingleFace(video, fallbackOptions)
        .withFaceLandmarks();
        
      if (fallbackDetections) {
        console.log('Face detected with fallback parameters');
      }
      
      return fallbackDetections;
    }
  } catch (error) {
    console.error('Error detecting facial landmarks:', error);
    return null;
  }
};

// Apply virtual makeup based on detected landmarks
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
  
  // Apply each product
  products.forEach(product => {
    switch (product.type) {
      case 'lipstick':
        applyLipstick(ctx, landmarks, product.color, product.intensity);
        break;
      case 'blush':
        applyBlush(ctx, landmarks, product.color, product.intensity);
        break;
      case 'eyeshadow':
        applyEyeshadow(ctx, landmarks, product.color, product.intensity);
        break;
      // Add more product types as needed
    }
  });
};

// Helper functions for applying specific makeup products
const applyLipstick = (
  ctx: CanvasRenderingContext2D,
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
) => {
  const mouth = landmarks.getMouth();
  
  ctx.beginPath();
  ctx.moveTo(mouth[0].x, mouth[0].y);
  
  // Draw upper lip
  for (let i = 1; i < 7; i++) {
    ctx.lineTo(mouth[i].x, mouth[i].y);
  }
  
  // Draw lower lip
  for (let i = 6; i < 12; i++) {
    ctx.lineTo(mouth[i].x, mouth[i].y);
  }
  
  ctx.closePath();
  
  // Apply color with intensity
  const alpha = Math.min(intensity, 1).toFixed(1);
  ctx.fillStyle = `${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`;
  ctx.fill();
};

const applyBlush = (
  ctx: CanvasRenderingContext2D,
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
) => {
  const jawline = landmarks.getJawOutline();
  const nose = landmarks.getNose();
  
  // Left cheek
  const leftCheekX = (jawline[2].x + nose[0].x) / 2;
  const leftCheekY = (jawline[2].y + nose[0].y) / 2;
  
  // Right cheek
  const rightCheekX = (jawline[14].x + nose[0].x) / 2;
  const rightCheekY = (jawline[14].y + nose[0].y) / 2;
  
  // Apply blush to left cheek
  ctx.beginPath();
  ctx.arc(leftCheekX, leftCheekY, 30, 0, 2 * Math.PI);
  ctx.fillStyle = `${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`;
  ctx.fill();
  
  // Apply blush to right cheek
  ctx.beginPath();
  ctx.arc(rightCheekX, rightCheekY, 30, 0, 2 * Math.PI);
  ctx.fillStyle = `${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`;
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
  
  // Apply eyeshadow to left eye
  ctx.beginPath();
  ctx.moveTo(leftEye[0].x, leftEye[0].y);
  
  for (let i = 1; i < leftEye.length; i++) {
    ctx.lineTo(leftEye[i].x, leftEye[i].y);
  }
  
  ctx.closePath();
  ctx.fillStyle = `${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`;
  ctx.fill();
  
  // Apply eyeshadow to right eye
  ctx.beginPath();
  ctx.moveTo(rightEye[0].x, rightEye[0].y);
  
  for (let i = 1; i < rightEye.length; i++) {
    ctx.lineTo(rightEye[i].x, rightEye[i].y);
  }
  
  ctx.closePath();
  ctx.fillStyle = `${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`;
  ctx.fill();
};
