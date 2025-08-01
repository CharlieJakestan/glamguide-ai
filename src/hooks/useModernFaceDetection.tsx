import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

interface FaceData {
  detection: faceapi.FaceDetection;
  landmarks: faceapi.FaceLandmarks68;
  expressions: faceapi.FaceExpressions;
  age: number;
  gender: string;
  genderProbability: number;
}

interface UseFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
}

export const useModernFaceDetection = ({ videoRef, canvasRef, isActive }: UseFaceDetectionProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceData, setFaceData] = useState<FaceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const isDetecting = useRef(false);

  // Initialize face detection models
  const initializeModels = useCallback(async () => {
    if (isInitialized) return true;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load models with proper configuration
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
      ]);
      
      console.log('Face detection models loaded successfully');
      setIsInitialized(true);
      return true;
    } catch (err) {
      console.error('Failed to initialize face detection:', err);
      setError('Failed to load face detection models');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Detect faces in video
  const detectFaces = useCallback(async () => {
    if (!isInitialized || !videoRef.current || !canvasRef.current || isDetecting.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Ensure video is ready
    if (video.readyState !== 4 || video.videoWidth === 0) {
      return;
    }

    try {
      isDetecting.current = true;
      
      // Resize canvas to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Detect faces with all features
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (detections.length > 0) {
        const detection = detections[0];
        
        setFaceDetected(true);
        setFaceData({
          detection: detection.detection,
          landmarks: detection.landmarks,
          expressions: detection.expressions,
          age: Math.round(detection.age),
          gender: detection.gender,
          genderProbability: detection.genderProbability
        });

        // Draw face detection overlay
        if (ctx) {
          // Draw face box
          const box = detection.detection.box;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          
          // Draw landmarks
          ctx.fillStyle = '#ff0000';
          detection.landmarks.positions.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });
          
          // Draw confidence text
          ctx.fillStyle = '#00ff00';
          ctx.font = '16px Arial';
          ctx.fillText(
            `Confidence: ${Math.round(detection.detection.score * 100)}%`,
            box.x,
            box.y - 10
          );
        }
      } else {
        setFaceDetected(false);
        setFaceData(null);
      }
    } catch (err) {
      console.error('Face detection error:', err);
      setFaceDetected(false);
      setFaceData(null);
    } finally {
      isDetecting.current = false;
    }
  }, [isInitialized, videoRef, canvasRef]);

  // Start detection loop
  const startDetection = useCallback(() => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    
    detectionInterval.current = setInterval(detectFaces, 100); // 10 FPS
  }, [detectFaces]);

  // Stop detection loop
  const stopDetection = useCallback(() => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
    setFaceDetected(false);
    setFaceData(null);
  }, []);

  // Effect to handle detection lifecycle
  useEffect(() => {
    if (isActive && isInitialized) {
      startDetection();
    } else {
      stopDetection();
    }
    
    return stopDetection;
  }, [isActive, isInitialized, startDetection, stopDetection]);

  // Initialize models when component mounts
  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // Get facial analysis data
  const getFacialAnalysis = useCallback(() => {
    if (!faceData) return null;
    
    const landmarks = faceData.landmarks.positions;
    
    // Calculate face shape based on landmarks
    const faceWidth = Math.abs(landmarks[16].x - landmarks[0].x);
    const faceHeight = Math.abs(landmarks[8].y - landmarks[19].y);
    const ratio = faceHeight / faceWidth;
    
    let faceShape = 'oval';
    if (ratio > 1.4) faceShape = 'oblong';
    else if (ratio < 1.2) faceShape = 'round';
    else if (ratio >= 1.2 && ratio <= 1.4) {
      const jawWidth = Math.abs(landmarks[14].x - landmarks[2].x);
      if (jawWidth / faceWidth > 0.85) faceShape = 'square';
      else if (jawWidth / faceWidth < 0.7) faceShape = 'heart';
    }
    
    // Get dominant expression
    const expressions = faceData.expressions;
    const dominantExpression = Object.keys(expressions).reduce((a, b) => 
      expressions[a as keyof typeof expressions] > expressions[b as keyof typeof expressions] ? a : b
    );
    
    return {
      faceShape,
      age: faceData.age,
      gender: faceData.gender,
      genderProbability: faceData.genderProbability,
      expression: dominantExpression,
      expressionConfidence: expressions[dominantExpression as keyof typeof expressions],
      landmarks: landmarks
    };
  }, [faceData]);

  return {
    isInitialized,
    isLoading,
    faceDetected,
    faceData,
    error,
    initializeModels,
    getFacialAnalysis
  };
};