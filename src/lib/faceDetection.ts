
import * as faceapi from '@vladmandic/face-api';

// Track loading state
let modelsLoaded = false;
let loadingPromise: Promise<boolean> | null = null;
let attemptCount = 0;
const MAX_ATTEMPTS = 3;

// Model paths - use CDN directly since local models aren't available
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
const FALLBACK_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';

export const isModelsLoaded = () => modelsLoaded;

export const initFaceDetection = async (): Promise<boolean> => {
  if (modelsLoaded) return true;
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise(async (resolve) => {
    try {
      console.log('Initializing face detection models...');
      
      // Try to load from primary CDN
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.load(MODEL_URL),
          faceapi.nets.faceLandmark68Net.load(MODEL_URL),
          faceapi.nets.faceRecognitionNet.load(MODEL_URL),
          faceapi.nets.faceExpressionNet.load(MODEL_URL)
        ]);
        
        console.log('Face detection models loaded successfully from primary CDN.');
        modelsLoaded = true;
        resolve(true);
        return;
      } catch (primaryError) {
        console.warn('Failed to load models from primary CDN, trying fallback...', primaryError);
        
        // Try fallback CDN with different version
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.load(FALLBACK_MODEL_URL),
            faceapi.nets.faceLandmark68Net.load(FALLBACK_MODEL_URL),
            faceapi.nets.faceRecognitionNet.load(FALLBACK_MODEL_URL),
            faceapi.nets.faceExpressionNet.load(FALLBACK_MODEL_URL)
          ]);
          
          console.log('Face detection models loaded successfully from fallback CDN.');
          modelsLoaded = true;
          resolve(true);
          return;
        } catch (fallbackError) {
          console.error('Failed to load models from fallback CDN:', fallbackError);
          // Continue without models - don't block the app
          console.warn('Continuing without face detection models');
          resolve(false);
        }
      }
    } catch (error) {
      console.error('Error initializing face detection:', error);
      resolve(false);
    } finally {
      loadingPromise = null;
    }
  });
  
  return loadingPromise;
};

export interface FaceDetectionResult {
  detection: faceapi.FaceDetection;
  landmarks: faceapi.FaceLandmarks68;
  expressions?: faceapi.FaceExpressions;
}

export const detectFaces = async (
  video: HTMLVideoElement | null,
  onFaceDetected?: (detected: boolean) => void,
  onFacePosition?: (position: { x: number; y: number; width: number; height: number }) => void
): Promise<FaceDetectionResult[] | undefined> => {
  if (!video || !modelsLoaded) {
    if (onFaceDetected) onFaceDetected(false);
    return undefined;
  }
  
  try {
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    const detections = await faceapi.detectAllFaces(video, options).withFaceLandmarks();
    
    // Add expressions separately if needed, but avoid type errors
    const results: FaceDetectionResult[] = [];
    
    for (const detection of detections) {
      // Create a result without expressions first
      const result: FaceDetectionResult = {
        detection: detection.detection,
        landmarks: detection.landmarks,
      };
      
      try {
        // Try to get expressions but handle if it's not available
        const withExpressions = await faceapi.detectAllFaces(video, options)
          .withFaceLandmarks()
          .withFaceExpressions();
          
        if (withExpressions && withExpressions.length > 0) {
          const matchingExpression = withExpressions.find(
            exp => exp.detection.box.x === detection.detection.box.x && 
                   exp.detection.box.y === detection.detection.box.y
          );
          
          if (matchingExpression && 'expressions' in matchingExpression) {
            // @ts-ignore - We'll add expressions if available
            result.expressions = matchingExpression.expressions;
          }
        }
      } catch (expressionError) {
        console.warn('Could not detect expressions:', expressionError);
      }
      
      results.push(result);
    }

    if (results && results.length > 0) {
      if (onFaceDetected) onFaceDetected(true);
      
      if (onFacePosition) {
        const { box } = results[0].detection;
        onFacePosition({
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        });
      }
    } else {
      if (onFaceDetected) onFaceDetected(false);
    }
    
    return results;
  } catch (error) {
    console.error('Error detecting faces:', error);
    if (onFaceDetected) onFaceDetected(false);
    return undefined;
  }
};
