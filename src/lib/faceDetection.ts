
import * as faceapi from '@vladmandic/face-api';
import { supabase } from '@/lib/supabase';

let modelsLoaded = false;
const MODEL_URL = '/models';

export const initFaceDetection = async (): Promise<boolean> => {
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

export const isModelsLoaded = (): boolean => {
  return modelsLoaded;
};

export const resetModelsLoaded = (): void => {
  modelsLoaded = false;
};
