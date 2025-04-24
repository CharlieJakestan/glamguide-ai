
import * as faceapi from '@vladmandic/face-api';
import { supabase } from '@/lib/supabase';

let modelsLoaded = false;
const MODEL_URL = '/models';

export const initFaceDetection = async (timeout = 0): Promise<boolean> => {
  try {
    if (modelsLoaded) {
      console.log('Face detection models already loaded');
      return true;
    }

    console.log('Initializing face detection with Face API');
    
    // First, try to load models from our edge function
    try {
      const { data, error } = await supabase.functions.invoke('ai-makeup-manager', {
        body: { 
          action: 'get-model',
          modelType: 'face-detection'
        },
      });
      
      if (!error && data && data.modelUrl) {
        console.log('Loading face detection model from AI Makeup Manager:', data.modelUrl);
        
        // In a real implementation, we would load from the URL
        // But for now, we'll fall back to the local/CDN models as face-api
        // requires specific format for the model files
      } else {
        console.warn('Failed to get face detection model from AI Makeup Manager, falling back to local models');
      }
    } catch (e) {
      console.warn('Error getting face models from edge function:', e);
    }
    
    // Try to load from local path
    try {
      await faceapi.nets.tinyFaceDetector.load(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.load(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.load(MODEL_URL);
      await faceapi.nets.faceExpressionNet.load(MODEL_URL);
      
      console.log('Face detection models loaded from local path');
      modelsLoaded = true;
      return true;
    } catch (localError) {
      console.warn('Failed to load models from local path:', localError);
      
      // Fall back to CDN
      try {
        console.log('Falling back to CDN for face detection models');
        
        // Load from CDN
        await faceapi.nets.tinyFaceDetector.load('/');
        await faceapi.nets.faceLandmark68Net.load('/');
        await faceapi.nets.faceRecognitionNet.load('/');
        await faceapi.nets.faceExpressionNet.load('/');
        
        console.log('Face detection models loaded from CDN');
        modelsLoaded = true;
        return true;
      } catch (cdnError) {
        console.error('Failed to load models from CDN:', cdnError);
        modelsLoaded = false;
        return false;
      }
    }
  } catch (error) {
    console.error('Error initializing face detection:', error);
    modelsLoaded = false;
    return false;
  }
};

export const detectFaces = async (
  video: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<faceapi.WithFaceLandmarks<{
  detection: faceapi.FaceDetection;
  expressions: faceapi.FaceExpressions;
}>[]> => {
  try {
    if (!modelsLoaded) {
      console.warn('Face detection models not loaded, trying to initialize');
      const success = await initFaceDetection();
      if (!success) {
        throw new Error('Failed to initialize face detection models');
      }
    }

    // Run face detection
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    return detections;
  } catch (error) {
    console.error('Error detecting faces:', error);
    throw error;
  }
};

export const detectFacialLandmarks = async (
  video: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<faceapi.WithFaceLandmarks<{
  detection: faceapi.FaceDetection;
  expressions: faceapi.FaceExpressions;
}> | null> => {
  try {
    const detections = await detectFaces(video);
    if (detections.length > 0) {
      return detections[0]; // Return the first face detected
    }
    return null;
  } catch (error) {
    console.error('Error detecting facial landmarks:', error);
    return null;
  }
};

export const applyVirtualMakeup = (
  canvas: HTMLCanvasElement,
  landmarks: faceapi.FaceLandmarks68,
  makeupItems: Array<{type: string, color: string, intensity: number}>
): void => {
  if (!canvas || !landmarks) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.save();
  
  // Apply different makeup based on type
  makeupItems.forEach(item => {
    switch (item.type) {
      case 'lipstick':
        applyLipstick(ctx, landmarks, item.color, item.intensity);
        break;
      case 'blush':
        applyBlush(ctx, landmarks, item.color, item.intensity);
        break;
      case 'eyeshadow':
        applyEyeshadow(ctx, landmarks, item.color, item.intensity);
        break;
      case 'eyeliner':
        applyEyeliner(ctx, landmarks, item.color, item.intensity);
        break;
      case 'foundation':
        applyFoundation(ctx, landmarks, item.color, item.intensity);
        break;
      case 'contour':
        applyContour(ctx, landmarks, item.color, item.intensity);
        break;
      case 'highlighter':
        applyHighlighter(ctx, landmarks, item.color, item.intensity);
        break;
      default:
        break;
    }
  });
  
  ctx.restore();
};

function applyLipstick(
  ctx: CanvasRenderingContext2D, 
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
): void {
  // Get lip landmarks (points 48-68)
  const lipPoints = landmarks.positions.slice(48, 60);
  
  ctx.beginPath();
  ctx.moveTo(lipPoints[0].x, lipPoints[0].y);
  for (let i = 1; i < lipPoints.length; i++) {
    ctx.lineTo(lipPoints[i].x, lipPoints[i].y);
  }
  ctx.closePath();
  
  const alphaValue = Math.min(0.9, intensity);
  ctx.fillStyle = convertToRGBA(color, alphaValue);
  ctx.fill();
}

function applyBlush(
  ctx: CanvasRenderingContext2D, 
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
): void {
  // Left cheek (simplified)
  const leftCheekCenter = landmarks.positions[1]; // Approximation
  
  // Right cheek (simplified)
  const rightCheekCenter = landmarks.positions[15]; // Approximation
  
  const blushRadius = intensity * 30;
  const alphaValue = Math.min(0.4, intensity * 0.5);
  
  // Apply left cheek blush
  ctx.beginPath();
  ctx.arc(leftCheekCenter.x, leftCheekCenter.y, blushRadius, 0, 2 * Math.PI);
  const gradientLeft = ctx.createRadialGradient(
    leftCheekCenter.x, leftCheekCenter.y, 0,
    leftCheekCenter.x, leftCheekCenter.y, blushRadius
  );
  gradientLeft.addColorStop(0, convertToRGBA(color, alphaValue));
  gradientLeft.addColorStop(1, convertToRGBA(color, 0));
  ctx.fillStyle = gradientLeft;
  ctx.fill();
  
  // Apply right cheek blush
  ctx.beginPath();
  ctx.arc(rightCheekCenter.x, rightCheekCenter.y, blushRadius, 0, 2 * Math.PI);
  const gradientRight = ctx.createRadialGradient(
    rightCheekCenter.x, rightCheekCenter.y, 0,
    rightCheekCenter.x, rightCheekCenter.y, blushRadius
  );
  gradientRight.addColorStop(0, convertToRGBA(color, alphaValue));
  gradientRight.addColorStop(1, convertToRGBA(color, 0));
  ctx.fillStyle = gradientRight;
  ctx.fill();
}

function applyEyeshadow(
  ctx: CanvasRenderingContext2D, 
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
): void {
  // Simplified eyeshadow for each eye
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  
  const alphaValue = Math.min(0.7, intensity);
  
  // Left eye shadow
  ctx.beginPath();
  ctx.moveTo(leftEye[0].x, leftEye[0].y);
  for (let i = 1; i < leftEye.length; i++) {
    ctx.lineTo(leftEye[i].x, leftEye[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = convertToRGBA(color, alphaValue);
  ctx.fill();
  
  // Right eye shadow
  ctx.beginPath();
  ctx.moveTo(rightEye[0].x, rightEye[0].y);
  for (let i = 1; i < rightEye.length; i++) {
    ctx.lineTo(rightEye[i].x, rightEye[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = convertToRGBA(color, alphaValue);
  ctx.fill();
}

function applyEyeliner(
  ctx: CanvasRenderingContext2D, 
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
): void {
  // Simplified eyeliner for upper eyelid
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  
  const lineWidth = intensity * 3;
  
  // Left eye liner
  ctx.beginPath();
  ctx.moveTo(leftEye[0].x, leftEye[0].y);
  for (let i = 1; i < 4; i++) {
    ctx.lineTo(leftEye[i].x, leftEye[i].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  
  // Right eye liner
  ctx.beginPath();
  ctx.moveTo(rightEye[0].x, rightEye[0].y);
  for (let i = 1; i < 4; i++) {
    ctx.lineTo(rightEye[i].x, rightEye[i].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function applyFoundation(
  ctx: CanvasRenderingContext2D, 
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
): void {
  // Simplified foundation over the entire face
  const jawline = landmarks.getJawOutline();
  const nose = landmarks.getNose();
  
  ctx.beginPath();
  ctx.moveTo(jawline[0].x, jawline[0].y);
  
  // Draw around the face following jawline
  for (let i = 1; i < jawline.length; i++) {
    ctx.lineTo(jawline[i].x, jawline[i].y);
  }
  
  // Connect to the forehead (approximation)
  ctx.lineTo(jawline[jawline.length - 1].x, jawline[0].y - 50);
  ctx.lineTo(jawline[0].x, jawline[0].y - 50);
  ctx.closePath();
  
  const alphaValue = Math.min(0.3, intensity * 0.4);
  ctx.fillStyle = convertToRGBA(color, alphaValue);
  ctx.fill();
}

function applyContour(
  ctx: CanvasRenderingContext2D, 
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
): void {
  const jawline = landmarks.getJawOutline();
  const alphaValue = Math.min(0.3, intensity * 0.4);
  
  // Contour along jawline
  ctx.beginPath();
  ctx.moveTo(jawline[0].x, jawline[0].y);
  for (let i = 1; i < jawline.length; i++) {
    ctx.lineTo(jawline[i].x, jawline[i].y);
  }
  ctx.lineWidth = 10 * intensity;
  ctx.strokeStyle = convertToRGBA(color, alphaValue);
  ctx.stroke();
  
  // Contour sides of nose (simplified)
  const nose = landmarks.getNose();
  ctx.beginPath();
  ctx.moveTo(nose[0].x - 10, nose[0].y + 10);
  ctx.lineTo(nose[3].x - 10, nose[3].y);
  ctx.lineWidth = 5 * intensity;
  ctx.strokeStyle = convertToRGBA(color, alphaValue);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(nose[0].x + 10, nose[0].y + 10);
  ctx.lineTo(nose[3].x + 10, nose[3].y);
  ctx.lineWidth = 5 * intensity;
  ctx.strokeStyle = convertToRGBA(color, alphaValue);
  ctx.stroke();
}

function applyHighlighter(
  ctx: CanvasRenderingContext2D, 
  landmarks: faceapi.FaceLandmarks68,
  color: string,
  intensity: number
): void {
  const nose = landmarks.getNose();
  const alphaValue = Math.min(0.7, intensity);
  
  // Highlight nose bridge
  ctx.beginPath();
  ctx.moveTo(nose[0].x, nose[0].y);
  ctx.lineTo(nose[3].x, nose[3].y);
  ctx.lineWidth = 5 * intensity;
  ctx.strokeStyle = convertToRGBA(color, alphaValue);
  ctx.stroke();
  
  // Highlight cheekbones (simplified)
  const leftCheek = landmarks.positions[1];
  const rightCheek = landmarks.positions[15];
  
  ctx.beginPath();
  ctx.arc(leftCheek.x + 10, leftCheek.y - 10, 5 * intensity, 0, 2 * Math.PI);
  ctx.fillStyle = convertToRGBA(color, alphaValue);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(rightCheek.x - 10, rightCheek.y - 10, 5 * intensity, 0, 2 * Math.PI);
  ctx.fillStyle = convertToRGBA(color, alphaValue);
  ctx.fill();
}

function convertToRGBA(color: string, alpha: number): string {
  // Simple conversion from hex or css color to rgba
  const tempDiv = document.createElement('div');
  tempDiv.style.color = color;
  document.body.appendChild(tempDiv);
  const computedColor = getComputedStyle(tempDiv).color;
  document.body.removeChild(tempDiv);
  
  // Parse rgb components
  const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }
  
  // If parsing fails, use the original color with alpha
  if (color.startsWith('#')) {
    return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  }
  
  return `rgba(0, 0, 0, ${alpha})`;  // Default fallback
}

export const isModelsLoaded = (): boolean => {
  return modelsLoaded;
};

export const resetModelsLoaded = (): void => {
  modelsLoaded = false;
};
