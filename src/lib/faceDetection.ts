
import * as faceapi from '@vladmandic/face-api';

// Track loading state
let modelsLoaded = false;
let loadingPromise: Promise<boolean> | null = null;
let attemptCount = 0;
const MAX_ATTEMPTS = 3;

// Model paths
const MODEL_URL = '/models/face-api';
const FALLBACK_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

export const isModelsLoaded = () => modelsLoaded;

export const initFaceDetection = async (): Promise<boolean> => {
  if (modelsLoaded) return true;
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise(async (resolve) => {
    try {
      console.log('Initializing face detection models...');
      
      // Try to load from primary location
      try {
        await faceapi.nets.tinyFaceDetector.load(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.load(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.load(MODEL_URL);
        await faceapi.nets.faceExpressionNet.load(MODEL_URL);
        
        console.log('Face detection models loaded successfully from primary source.');
        modelsLoaded = true;
        resolve(true);
        return;
      } catch (primaryError) {
        console.warn('Failed to load models from primary source, trying fallback...', primaryError);
        
        // Try fallback CDN
        try {
          await faceapi.nets.tinyFaceDetector.load(FALLBACK_MODEL_URL);
          await faceapi.nets.faceLandmark68Net.load(FALLBACK_MODEL_URL);
          await faceapi.nets.faceRecognitionNet.load(FALLBACK_MODEL_URL);
          await faceapi.nets.faceExpressionNet.load(FALLBACK_MODEL_URL);
          
          console.log('Face detection models loaded successfully from fallback CDN.');
          modelsLoaded = true;
          resolve(true);
          return;
        } catch (fallbackError) {
          console.error('Failed to load models from fallback source:', fallbackError);
        }
      }
      
      // If we reach here, both attempts failed
      console.error('Face detection model loading failed after multiple attempts');
      resolve(false);
    } catch (error) {
      console.error('Error initializing face detection:', error);
      resolve(false);
    } finally {
      loadingPromise = null;
    }
  });
  
  return loadingPromise;
};

export const detectFaces = async (
  video: HTMLVideoElement | null,
  onFaceDetected: (detected: boolean) => void,
  onFacePosition?: (position: { x: number; y: number; width: number; height: number }) => void
): Promise<void> => {
  if (!video || !modelsLoaded) {
    onFaceDetected(false);
    return;
  }
  
  try {
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    const result = await faceapi.detectSingleFace(video, options)
      .withFaceLandmarks()
      .withFaceExpressions();
      
    if (result) {
      onFaceDetected(true);
      
      if (onFacePosition) {
        const { box } = result.detection;
        onFacePosition({
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        });
      }
    } else {
      onFaceDetected(false);
    }
  } catch (error) {
    console.error('Error detecting faces:', error);
    onFaceDetected(false);
  }
};
