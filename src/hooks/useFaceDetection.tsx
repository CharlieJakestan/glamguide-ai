import { useState, useEffect, useRef, useCallback } from 'react';
import { initFaceDetection, detectFaces, isModelsLoaded } from '@/lib/faceDetection';
import * as faceapi from '@vladmandic/face-api';

interface UseFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  toast: any;
  enabled: boolean;
  detectionInterval?: number;
  onFaceDetected?: (face: any) => void;
  onFaceLost?: () => void;
}

interface MovementData {
  headPose?: {
    pitch: number; // up/down
    yaw: number;   // left/right
    roll: number;  // tilt
  };
  eyeMovement?: {
    left: { x: number; y: number };
    right: { x: number; y: number };
  };
  mouthMovement?: {
    open: boolean;
    smiling: boolean;
  };
}

export const useFaceDetection = ({
  videoRef,
  toast,
  enabled,
  detectionInterval = 200,
  onFaceDetected,
  onFaceLost
}: UseFaceDetectionProps) => {
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [landmarks, setLandmarks] = useState<any>(null);
  const [expressions, setExpressions] = useState<faceapi.FaceExpressions | null>(null);
  const [movementData, setMovementData] = useState<MovementData>({});
  const [lastActivity, setLastActivity] = useState<string | null>(null);

  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<number>(0);
  const lastFacePositionRef = useRef<any>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const faceLostTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const setupFaceDetection = async () => {
      try {
        const success = await initFaceDetection();
        setFaceDetectionReady(success);
        
        if (!success) {
          toast({
            title: "Face Detection Setup Failed",
            description: "Could not load face detection models. Some features may not work properly.",
            variant: "destructive"
          });
        } else {
          console.log('Face detection models loaded successfully');
        }
      } catch (error) {
        console.error('Error setting up face detection:', error);
        setFaceDetectionReady(false);
        toast({
          title: "Face Detection Error",
          description: "An error occurred while setting up face detection.",
          variant: "destructive"
        });
      }
    };
    
    setupFaceDetection();
  }, [toast]);

  const calculateMovementData = useCallback((detection: any): MovementData => {
    if (!detection || !detection.landmarks) {
      return {};
    }
    
    try {
      const landmarks = detection.landmarks;
      const positions = landmarks.positions;
      
      const faceWidth = detection.detection.box.width;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      const jawOutline = landmarks.getJawOutline();
      
      const leftEyeCenter = getAveragePosition(leftEye);
      const rightEyeCenter = getAveragePosition(rightEye);
      const noseTip = nose[nose.length - 1];
      const faceCenter = getAveragePosition(jawOutline);
      
      const eyeLineAngle = Math.atan2(
        rightEyeCenter.y - leftEyeCenter.y,
        rightEyeCenter.x - leftEyeCenter.x
      ) * (180 / Math.PI);
      
      const noseDirection = noseTip.x - faceCenter.x;
      const yaw = (noseDirection / faceWidth) * 60;
      
      const noseHeight = noseTip.y - (leftEyeCenter.y + rightEyeCenter.y) / 2;
      const normalizedNoseHeight = noseHeight / faceWidth;
      const pitch = normalizedNoseHeight * 60 - 15;
      
      const mouth = landmarks.getMouth();
      const upperLipCenter = getAveragePosition(mouth.slice(0, 6));
      const lowerLipCenter = getAveragePosition(mouth.slice(6, 12));
      const mouthOpen = lowerLipCenter.y - upperLipCenter.y > faceWidth * 0.05;
      
      const mouthCornerLeft = mouth[0];
      const mouthCornerRight = mouth[6];
      const mouthWidth = Math.abs(mouthCornerRight.x - mouthCornerLeft.x);
      const mouthHeight = (lowerLipCenter.y - upperLipCenter.y);
      const smileRatio = mouthWidth / (mouthHeight || 1);
      let smiling = smileRatio > 6;
      
      if (detection.expressions) {
        const happyConfidence = detection.expressions.happy || 0;
        if (happyConfidence > 0.7) {
          smiling = true;
        } else if (happyConfidence < 0.2) {
          smiling = false;
        }
      }
      
      return {
        headPose: {
          pitch,
          yaw,
          roll: eyeLineAngle
        },
        eyeMovement: {
          left: { x: leftEyeCenter.x, y: leftEyeCenter.y },
          right: { x: rightEyeCenter.x, y: rightEyeCenter.y }
        },
        mouthMovement: {
          open: mouthOpen,
          smiling: smiling
        }
      };
    } catch (error) {
      console.error('Error calculating movement data:', error);
      return {};
    }
  }, []);

  const getAveragePosition = (points: Array<{ x: number; y: number }>) => {
    const sum = points.reduce((acc, point) => {
      return { x: acc.x + point.x, y: acc.y + point.y };
    }, { x: 0, y: 0 });
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  };

  const detectActivity = useCallback((
    currentMovement: MovementData,
    previousMovement: MovementData | null,
    expressions: faceapi.FaceExpressions | null
  ): string | null => {
    if (!previousMovement || !currentMovement.headPose) return null;
    
    try {
      if (previousMovement.headPose && currentMovement.headPose) {
        const yawDiff = Math.abs(currentMovement.headPose.yaw - (previousMovement.headPose?.yaw || 0));
        const pitchDiff = Math.abs(currentMovement.headPose.pitch - (previousMovement.headPose?.pitch || 0));
        const rollDiff = Math.abs(currentMovement.headPose.roll - (previousMovement.headPose?.roll || 0));
        
        if (yawDiff > 10) {
          return currentMovement.headPose.yaw > (previousMovement.headPose?.yaw || 0) ? 
            "head turned right" : "head turned left";
        }
        
        if (pitchDiff > 10) {
          return currentMovement.headPose.pitch > (previousMovement.headPose?.pitch || 0) ?
            "head tilted down" : "head tilted up";
        }
        
        if (rollDiff > 10) {
          return currentMovement.headPose.roll > (previousMovement.headPose?.roll || 0) ?
            "head tilted right" : "head tilted left";
        }
      }
      
      if (currentMovement.mouthMovement?.open && (!previousMovement.mouthMovement?.open)) {
        return "opened mouth";
      }
      
      if (!currentMovement.mouthMovement?.open && previousMovement.mouthMovement?.open) {
        return "closed mouth";
      }
      
      if (currentMovement.mouthMovement?.smiling && !previousMovement.mouthMovement?.smiling) {
        return "started smiling";
      }
      
      if (expressions) {
        if (expressions.happy > 0.7) return "happy";
        if (expressions.surprised > 0.7) return "surprised";
        if (expressions.angry > 0.7) return "angry";
        if (expressions.disgusted > 0.7) return "disgusted";
        if (expressions.fearful > 0.7) return "fearful";
        if (expressions.sad > 0.7) return "sad";
      }
      
      return null;
    } catch (error) {
      console.error('Error detecting activity:', error);
      return null;
    }
  }, []);

  const runFaceDetection = useCallback(async () => {
    if (!videoRef.current || !faceDetectionReady || !enabled) return;
    
    try {
      const now = Date.now();
      const timeSinceLastRun = now - lastDetectionRef.current;
      
      if (timeSinceLastRun < detectionInterval) return;
      
      lastDetectionRef.current = now;
      
      const detections = await detectFaces(
        videoRef.current, 
        (detected) => {
          // This callback is handled separately below
        },
        (position) => {
          // This callback is handled separately below
        }
      );
      
      if (detections && detections.length > 0) {
        const bestDetection = detections.reduce((prev, current) => 
          (current.detection.score > prev.detection.score) ? current : prev
        );
        
        const { detection, landmarks: faceLandmarks, expressions: faceExpressions } = bestDetection;
        const { box } = detection;
        
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        
        const normalizedPosition = {
          x: (box.x / videoWidth) * 100,
          y: (box.y / videoHeight) * 100,
          width: (box.width / videoWidth) * 100,
          height: (box.height / videoHeight) * 100
        };
        
        const confidence = detection.score;
        
        setFacePosition(normalizedPosition);
        setDetectionConfidence(confidence);
        setLandmarks(faceLandmarks);
        setExpressions(faceExpressions);
        
        if (!faceDetected) {
          setFaceDetected(true);
          if (onFaceDetected) {
            onFaceDetected(bestDetection);
          }
          
          if (faceLostTimeoutRef.current) {
            window.clearTimeout(faceLostTimeoutRef.current);
            faceLostTimeoutRef.current = null;
          }
        }
        
        const currentMovementData = calculateMovementData(bestDetection);
        setMovementData(currentMovementData);
        
        const activity = detectActivity(
          currentMovementData,
          lastFacePositionRef.current,
          faceExpressions
        );
        
        if (activity) {
          setLastActivity(activity);
          lastActivityTimeRef.current = now;
        } else if (now - lastActivityTimeRef.current > 10000) {
          setLastActivity(null);
        }
        
        lastFacePositionRef.current = currentMovementData;
      } else {
        if (faceDetected && !faceLostTimeoutRef.current) {
          faceLostTimeoutRef.current = window.setTimeout(() => {
            setFaceDetected(false);
            setFacePosition(null);
            setDetectionConfidence(0);
            if (onFaceLost) {
              onFaceLost();
            }
            faceLostTimeoutRef.current = null;
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error in face detection:', error);
    }
    
    detectionIntervalRef.current = window.setTimeout(runFaceDetection, detectionInterval);
  }, [videoRef, faceDetectionReady, enabled, detectionInterval, faceDetected, onFaceDetected, onFaceLost, calculateMovementData, detectActivity]);

  useEffect(() => {
    if (enabled && faceDetectionReady) {
      runFaceDetection();
    } else {
      if (detectionIntervalRef.current) {
        window.clearTimeout(detectionIntervalRef.current);
      }
      if (faceLostTimeoutRef.current) {
        window.clearTimeout(faceLostTimeoutRef.current);
      }
    }
    
    return () => {
      if (detectionIntervalRef.current) {
        window.clearTimeout(detectionIntervalRef.current);
      }
      if (faceLostTimeoutRef.current) {
        window.clearTimeout(faceLostTimeoutRef.current);
      }
    };
  }, [enabled, faceDetectionReady, runFaceDetection]);

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        window.clearTimeout(detectionIntervalRef.current);
      }
      if (faceLostTimeoutRef.current) {
        window.clearTimeout(faceLostTimeoutRef.current);
      }
    };
  }, []);

  return {
    faceDetectionReady,
    setFaceDetectionReady,
    faceDetected,
    facePosition,
    detectionConfidence,
    landmarks,
    expressions,
    movementData,
    lastActivity,
    isModelsLoaded: isModelsLoaded
  };
};
