import { useState, useEffect, useCallback, useRef } from 'react';
import { initFaceDetection, detectFaces } from '@/lib/faceDetection';
import { analyzeFacialImage } from '@/services/ganService';

interface UseAdvancedFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  enabled: boolean;
  detectionInterval?: number;
  virtualMakeup?: any;
}

interface FacialAttributes {
  skinTone?: string;
  faceShape?: string;
  features?: string[];
  landmarks?: any;
}

interface MakeupRegion {
  type: string;
  region: {
    points: Array<{x: number, y: number}>;
    center: {x: number, y: number};
  };
  intensity?: number;
  color?: string;
  coverage?: number;
}

interface DetectedAction {
  action: string;
  confidence: number;
  timestamp: number;
}

export const useAdvancedFaceDetection = ({
  videoRef,
  canvasRef,
  enabled,
  detectionInterval = 200,
  virtualMakeup
}: UseAdvancedFaceDetectionProps) => {
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceLandmarks, setFaceLandmarks] = useState<any>(null);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [movementData, setMovementData] = useState<any>({});
  const [facialAttributes, setFacialAttributes] = useState<FacialAttributes>({});
  const [makeupRegions, setMakeupRegions] = useState<MakeupRegion[]>([]);
  const [detectedActions, setDetectedActions] = useState<DetectedAction[]>([]);
  
  const detectionIntervalRef = useRef<number | null>(null);
  const analysisTimeoutRef = useRef<number | null>(null);
  const lastAnalysisRef = useRef<number>(0);
  const lastFacePositionRef = useRef<any>(null);
  const actionsHistoryRef = useRef<DetectedAction[]>([]);
  
  // Initialize face detection
  useEffect(() => {
    const setupFaceDetection = async () => {
      const success = await initFaceDetection();
      setFaceDetectionReady(success);
    };
    
    setupFaceDetection();
  }, []);
  
  // Helper to draw on canvas
  const drawToCanvas = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || !faceLandmarks) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Skip if no virtual makeup or AR is disabled
    if (!virtualMakeup) return;
    
    try {
      // Draw virtual makeup effects
      drawVirtualMakeup(ctx, faceLandmarks, virtualMakeup, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error drawing makeup:', error);
    }
  }, [canvasRef, videoRef, faceLandmarks, virtualMakeup]);
  
  // Draw virtual makeup effects
  const drawVirtualMakeup = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: any,
    makeup: any,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    if (!landmarks || !landmarks.positions) {
      return;
    }
    
    const positions = landmarks.positions;
    
    // Draw lips
    if (makeup.lips) {
      const mouthPoints = landmarks.getMouth();
      if (mouthPoints && mouthPoints.length > 0) {
        // Draw lips with specified color and intensity
        ctx.beginPath();
        ctx.moveTo(mouthPoints[0].x, mouthPoints[0].y);
        
        // Upper lip outer curve
        for (let i = 1; i < 7; i++) {
          ctx.lineTo(mouthPoints[i].x, mouthPoints[i].y);
        }
        
        // Lower lip outer curve
        for (let i = 7; i < 12; i++) {
          ctx.lineTo(mouthPoints[i].x, mouthPoints[i].y);
        }
        
        ctx.closePath();
        ctx.fillStyle = makeup.lips.color || 'rgba(220, 80, 120, 0.7)';
        ctx.fill();
        
        // Add shine effect for glossy lips
        if (makeup.lips.glossy) {
          const centerX = (mouthPoints[3].x + mouthPoints[9].x) / 2;
          const centerY = (mouthPoints[3].y + mouthPoints[9].y) / 2;
          
          const gradient = ctx.createRadialGradient(
            centerX, centerY - 2, 1,
            centerX, centerY - 2, mouthPoints[3].x - mouthPoints[0].x
          );
          
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }
      
      // Track this region for analysis
      setMakeupRegions(prev => {
        const regions = [...prev.filter(r => r.type !== 'lips')];
        regions.push({
          type: 'lips',
          region: {
            points: landmarks.getMouth().map(p => ({ x: p.x, y: p.y })),
            center: {
              x: (landmarks.getMouth()[3].x + landmarks.getMouth()[9].x) / 2,
              y: (landmarks.getMouth()[3].y + landmarks.getMouth()[9].y) / 2
            }
          },
          color: makeup.lips.color,
          intensity: makeup.lips.intensity
        });
        return regions;
      });
    }
    
    // Draw eyeshadow
    if (makeup.eyes) {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      
      if (leftEye && leftEye.length > 0) {
        // Draw eyeshadow above the left eye
        const leftEyeTop = leftEye[1]; // Top point of left eye
        const leftEyeBottom = leftEye[4]; // Bottom point of left eye
        const leftEyeWidth = Math.abs(leftEye[3].x - leftEye[0].x) * 1.5;
        const leftEyeHeight = Math.abs(leftEyeBottom.y - leftEyeTop.y) * 2;
        
        ctx.beginPath();
        ctx.ellipse(
          (leftEye[0].x + leftEye[3].x) / 2,
          leftEyeTop.y - leftEyeHeight * 0.3,
          leftEyeWidth / 2,
          leftEyeHeight / 2,
          0, 0, Math.PI * 2
        );
        
        const leftEyeGradient = ctx.createRadialGradient(
          (leftEye[0].x + leftEye[3].x) / 2, leftEyeTop.y,
          1,
          (leftEye[0].x + leftEye[3].x) / 2, leftEyeTop.y,
          leftEyeWidth / 2
        );
        
        leftEyeGradient.addColorStop(0, makeup.eyes.color || 'rgba(120, 100, 180, 0.6)');
        leftEyeGradient.addColorStop(1, 'rgba(120, 100, 180, 0)');
        
        ctx.fillStyle = leftEyeGradient;
        ctx.fill();
      }
      
      if (rightEye && rightEye.length > 0) {
        // Draw eyeshadow above the right eye
        const rightEyeTop = rightEye[1]; // Top point of right eye
        const rightEyeBottom = rightEye[4]; // Bottom point of right eye
        const rightEyeWidth = Math.abs(rightEye[3].x - rightEye[0].x) * 1.5;
        const rightEyeHeight = Math.abs(rightEyeBottom.y - rightEyeTop.y) * 2;
        
        ctx.beginPath();
        ctx.ellipse(
          (rightEye[0].x + rightEye[3].x) / 2,
          rightEyeTop.y - rightEyeHeight * 0.3,
          rightEyeWidth / 2,
          rightEyeHeight / 2,
          0, 0, Math.PI * 2
        );
        
        const rightEyeGradient = ctx.createRadialGradient(
          (rightEye[0].x + rightEye[3].x) / 2, rightEyeTop.y,
          1,
          (rightEye[0].x + rightEye[3].x) / 2, rightEyeTop.y,
          rightEyeWidth / 2
        );
        
        rightEyeGradient.addColorStop(0, makeup.eyes.color || 'rgba(120, 100, 180, 0.6)');
        rightEyeGradient.addColorStop(1, 'rgba(120, 100, 180, 0)');
        
        ctx.fillStyle = rightEyeGradient;
        ctx.fill();
      }
      
      // Track these regions for analysis
      setMakeupRegions(prev => {
        const regions = [...prev.filter(r => r.type !== 'eyes')];
        regions.push({
          type: 'left-eye',
          region: {
            points: landmarks.getLeftEye().map(p => ({ x: p.x, y: p.y })),
            center: {
              x: (landmarks.getLeftEye()[0].x + landmarks.getLeftEye()[3].x) / 2,
              y: (landmarks.getLeftEye()[1].y + landmarks.getLeftEye()[4].y) / 2
            }
          },
          color: makeup.eyes.color,
          intensity: makeup.eyes.intensity
        });
        regions.push({
          type: 'right-eye',
          region: {
            points: landmarks.getRightEye().map(p => ({ x: p.x, y: p.y })),
            center: {
              x: (landmarks.getRightEye()[0].x + landmarks.getRightEye()[3].x) / 2,
              y: (landmarks.getRightEye()[1].y + landmarks.getRightEye()[4].y) / 2
            }
          },
          color: makeup.eyes.color,
          intensity: makeup.eyes.intensity
        });
        return regions;
      });
    }
    
    // Draw cheeks (blush)
    if (makeup.cheeks) {
      const jawLine = landmarks.getJawOutline();
      const nose = landmarks.getNose();
      
      if (jawLine && jawLine.length > 0 && nose && nose.length > 0) {
        // Calculate positions for blush on both cheeks
        const noseTip = nose[nose.length - 1];
        const leftCheekX = jawLine[2].x + (noseTip.x - jawLine[2].x) * 0.4;
        const rightCheekX = jawLine[14].x + (noseTip.x - jawLine[14].x) * 0.4;
        const cheekY = (noseTip.y + jawLine[8].y) / 2;
        const blushRadius = Math.abs(jawLine[8].x - jawLine[0].x) * 0.15;
        
        // Draw left cheek blush
        const leftCheekGradient = ctx.createRadialGradient(
          leftCheekX, cheekY, 1,
          leftCheekX, cheekY, blushRadius
        );
        
        leftCheekGradient.addColorStop(0, makeup.cheeks.color || 'rgba(240, 120, 120, 0.5)');
        leftCheekGradient.addColorStop(1, 'rgba(240, 120, 120, 0)');
        
        ctx.beginPath();
        ctx.fillStyle = leftCheekGradient;
        ctx.arc(leftCheekX, cheekY, blushRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw right cheek blush
        const rightCheekGradient = ctx.createRadialGradient(
          rightCheekX, cheekY, 1,
          rightCheekX, cheekY, blushRadius
        );
        
        rightCheekGradient.addColorStop(0, makeup.cheeks.color || 'rgba(240, 120, 120, 0.5)');
        rightCheekGradient.addColorStop(1, 'rgba(240, 120, 120, 0)');
        
        ctx.beginPath();
        ctx.fillStyle = rightCheekGradient;
        ctx.arc(rightCheekX, cheekY, blushRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Track these regions for analysis
        setMakeupRegions(prev => {
          const regions = [...prev.filter(r => r.type !== 'cheeks')];
          regions.push({
            type: 'left-cheek',
            region: {
              points: [
                { x: leftCheekX - blushRadius, y: cheekY - blushRadius },
                { x: leftCheekX + blushRadius, y: cheekY - blushRadius },
                { x: leftCheekX + blushRadius, y: cheekY + blushRadius },
                { x: leftCheekX - blushRadius, y: cheekY + blushRadius }
              ],
              center: { x: leftCheekX, y: cheekY }
            },
            color: makeup.cheeks.color,
            intensity: makeup.cheeks.intensity
          });
          regions.push({
            type: 'right-cheek',
            region: {
              points: [
                { x: rightCheekX - blushRadius, y: cheekY - blushRadius },
                { x: rightCheekX + blushRadius, y: cheekY - blushRadius },
                { x: rightCheekX + blushRadius, y: cheekY + blushRadius },
                { x: rightCheekX - blushRadius, y: cheekY + blushRadius }
              ],
              center: { x: rightCheekX, y: cheekY }
            },
            color: makeup.cheeks.color,
            intensity: makeup.cheeks.intensity
          });
          return regions;
        });
      }
    }
    
    // Draw foundation
    if (makeup.foundation) {
      const jawLine = landmarks.getJawOutline();
      
      if (jawLine && jawLine.length > 0) {
        // Create a face mask path
        ctx.beginPath();
        ctx.moveTo(jawLine[0].x, jawLine[0].y);
        
        // Draw along the jawline
        for (let i = 1; i < jawLine.length; i++) {
          ctx.lineTo(jawLine[i].x, jawLine[i].y);
        }
        
        // Complete the face shape by connecting back to the top
        ctx.lineTo(jawLine[0].x, jawLine[0].y - jawLine[8].y * 0.3);
        ctx.closePath();
        
        // Apply foundation with specified color and coverage
        ctx.fillStyle = makeup.foundation.color || 'rgba(245, 222, 179, 0.3)';
        ctx.fill();
        
        // Track this region for analysis
        setMakeupRegions(prev => {
          const regions = [...prev.filter(r => r.type !== 'foundation')];
          const jawPoints = landmarks.getJawOutline().map(p => ({ x: p.x, y: p.y }));
          // Calculate center of face
          const centerX = jawPoints.reduce((sum, p) => sum + p.x, 0) / jawPoints.length;
          const centerY = jawPoints.reduce((sum, p) => sum + p.y, 0) / jawPoints.length;
          
          regions.push({
            type: 'foundation',
            region: {
              points: jawPoints,
              center: { x: centerX, y: centerY }
            },
            color: makeup.foundation.color,
            coverage: makeup.foundation.coverage
          });
          return regions;
        });
      }
    }
  }, []);
  
  // Run face detection and analysis
  const runFaceDetection = useCallback(async () => {
    if (!videoRef.current || !faceDetectionReady || !enabled) {
      return;
    }
    
    try {
      const detections = await detectFaces(videoRef.current);
      
      if (detections && detections.length > 0) {
        // Get the detection with highest confidence
        const bestDetection = detections.reduce((prev, current) => 
          (current.detection.score > prev.detection.score) ? current : prev
        );
        
        const { detection, landmarks, expressions } = bestDetection;
        
        // Update state with detection results
        setFaceDetected(true);
        setFaceLandmarks(landmarks);
        setDetectionConfidence(detection.score);
        
        // Calculate movement data
        const currentMovementData = calculateMovementData(bestDetection);
        setMovementData(currentMovementData);
        
        // Detect actions
        detectUserActions(currentMovementData, lastFacePositionRef.current, expressions);
        
        // Save current position for next comparison
        lastFacePositionRef.current = currentMovementData;
        
        // Run face analysis periodically (every 10 seconds)
        const now = Date.now();
        if (now - lastAnalysisRef.current > 10000) {
          runFaceAnalysis();
        }
        
        // Draw makeup if needed
        drawToCanvas();
      } else {
        setFaceDetected(false);
        setFaceLandmarks(null);
        setDetectionConfidence(0);
      }
    } catch (error) {
      console.error('Error in advanced face detection:', error);
    }
    
    // Schedule next run
    detectionIntervalRef.current = window.setTimeout(() => {
      runFaceDetection();
    }, detectionInterval);
  }, [videoRef, faceDetectionReady, enabled, detectionInterval, calculateMovementData, drawToCanvas]);
  
  // Calculate movement data from landmarks
  const calculateMovementData = useCallback((detection: any) => {
    if (!detection || !detection.landmarks) {
      return {};
    }
    
    try {
      const landmarks = detection.landmarks;
      const positions = landmarks.positions;
      
      // Get facial points
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      const mouth = landmarks.getMouth();
      const jawOutline = landmarks.getJawOutline();
      
      // Calculate center points
      const leftEyeCenter = getAveragePosition(leftEye);
      const rightEyeCenter = getAveragePosition(rightEye);
      const noseTip = nose[nose.length - 1];
      const faceCenter = getAveragePosition(jawOutline);
      
      // Calculate eyeline angle for roll
      const eyeLineAngle = Math.atan2(
        rightEyeCenter.y - leftEyeCenter.y,
        rightEyeCenter.x - leftEyeCenter.x
      ) * (180 / Math.PI);
      
      // Calculate yaw (left-right head rotation)
      const faceWidth = Math.abs(jawOutline[0].x - jawOutline[16].x);
      const noseDirection = noseTip.x - faceCenter.x;
      const yaw = (noseDirection / faceWidth) * 60; // Scale to reasonable degrees
      
      // Calculate pitch (up-down head tilt)
      const noseHeight = noseTip.y - (leftEyeCenter.y + rightEyeCenter.y) / 2;
      const faceHeight = Math.abs(jawOutline[8].y - (leftEyeCenter.y + rightEyeCenter.y) / 2);
      const pitch = ((noseHeight / faceHeight) - 0.5) * 60; // Scale and offset
      
      // Mouth state
      const upperLipCenter = getAveragePosition(mouth.slice(0, 6));
      const lowerLipCenter = getAveragePosition(mouth.slice(6, 12));
      const mouthOpen = (lowerLipCenter.y - upperLipCenter.y) / faceHeight > 0.06;
      
      // Smile detection
      const mouthCornerLeft = mouth[0];
      const mouthCornerRight = mouth[6];
      const mouthWidth = Math.abs(mouthCornerRight.x - mouthCornerLeft.x);
      const mouthHeight = Math.abs(lowerLipCenter.y - upperLipCenter.y);
      const smileRatio = mouthWidth / (mouthHeight || 1);
      const smiling = smileRatio > 6 || (detection.expressions && detection.expressions.happy > 0.7);
      
      return {
        headPose: {
          pitch,
          yaw,
          roll: eyeLineAngle
        },
        eyes: {
          left: {
            center: leftEyeCenter,
            open: isEyeOpen(leftEye)
          },
          right: {
            center: rightEyeCenter,
            open: isEyeOpen(rightEye)
          }
        },
        mouth: {
          open: mouthOpen,
          smiling: smiling,
          corners: {
            left: { x: mouthCornerLeft.x, y: mouthCornerLeft.y },
            right: { x: mouthCornerRight.x, y: mouthCornerRight.y }
          }
        },
        faceCenter,
        faceWidth,
        faceHeight
      };
    } catch (error) {
      console.error('Error calculating movement data:', error);
      return {};
    }
  }, []);
  
  // Check if eye is open
  const isEyeOpen = useCallback((eyePoints: any[]) => {
    if (!eyePoints || eyePoints.length < 6) return true;
    
    // Calculate vertical distance between top and bottom eye points
    const topY = (eyePoints[1].y + eyePoints[2].y) / 2;
    const bottomY = (eyePoints[4].y + eyePoints[5].y) / 2;
    const eyeHeight = Math.abs(bottomY - topY);
    
    // Calculate horizontal distance
    const eyeWidth = Math.abs(eyePoints[0].x - eyePoints[3].x);
    
    // Eye is considered open if height/width ratio is above a threshold
    return (eyeHeight / eyeWidth) > 0.15;
  }, []);
  
  // Helper function to get average position
  const getAveragePosition = useCallback((points: any[]) => {
    if (!points || points.length === 0) {
      return { x: 0, y: 0 };
    }
    
    const sum = points.reduce((acc, point) => {
      return { x: acc.x + point.x, y: acc.y + point.y };
    }, { x: 0, y: 0 });
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }, []);
  
  // Detect user actions from movement data
  const detectUserActions = useCallback((
    current: any,
    previous: any,
    expressions: any
  ) => {
    if (!current || !previous) return;
    
    const actions: DetectedAction[] = [];
    const now = Date.now();
    
    try {
      // Head movements
      if (current.headPose && previous.headPose) {
        const yawDiff = current.headPose.yaw - previous.headPose.yaw;
        const pitchDiff = current.headPose.pitch - previous.headPose.pitch;
        const rollDiff = current.headPose.roll - previous.headPose.roll;
        
        if (Math.abs(yawDiff) > 5) {
          actions.push({
            action: `head turned ${yawDiff > 0 ? 'right' : 'left'}`,
            confidence: Math.min(Math.abs(yawDiff) / 15, 1),
            timestamp: now
          });
        }
        
        if (Math.abs(pitchDiff) > 5) {
          actions.push({
            action: `head tilted ${pitchDiff > 0 ? 'down' : 'up'}`,
            confidence: Math.min(Math.abs(pitchDiff) / 15, 1),
            timestamp: now
          });
        }
        
        if (Math.abs(rollDiff) > 5) {
          actions.push({
            action: `head tilted ${rollDiff > 0 ? 'right' : 'left'}`,
            confidence: Math.min(Math.abs(rollDiff) / 15, 1),
            timestamp: now
          });
        }
      }
      
      // Mouth movements
      if (current.mouth && previous.mouth) {
        if (current.mouth.open && !previous.mouth.open) {
          actions.push({
            action: 'opened mouth',
            confidence: 0.9,
            timestamp: now
          });
        } else if (!current.mouth.open && previous.mouth.open) {
          actions.push({
            action: 'closed mouth',
            confidence: 0.9,
            timestamp: now
          });
        }
        
        if (current.mouth.smiling && !previous.mouth.smiling) {
          actions.push({
            action: 'started smiling',
            confidence: 0.85,
            timestamp: now
          });
        } else if (!current.mouth.smiling && previous.mouth.smiling) {
          actions.push({
            action: 'stopped smiling',
            confidence: 0.85,
            timestamp: now
          });
        }
      }
      
      // Eye movements
      if (current.eyes && previous.eyes) {
        if (!current.eyes.left.open && previous.eyes.left.open) {
          actions.push({
            action: 'blinked left eye',
            confidence: 0.8,
            timestamp: now
          });
        }
        
        if (!current.eyes.right.open && previous.eyes.right.open) {
          actions.push({
            action: 'blinked right eye',
            confidence: 0.8,
            timestamp: now
          });
        }
        
        if (!current.eyes.left.open && !current.eyes.right.open &&
            previous.eyes.left.open && previous.eyes.right.open) {
          actions.push({
            action: 'blinked both eyes',
            confidence: 0.9,
            timestamp: now
          });
        }
      }
      
      // Expression-based actions
      if (expressions) {
        for (const [expression, value] of Object.entries(expressions)) {
          if ((value as number) > 0.7) {
            actions.push({
              action: `expressing ${expression}`,
              confidence: value as number,
              timestamp: now
            });
          }
        }
      }
      
      // Update actions history with new actions
      if (actions.length > 0) {
        // Only keep unique actions within a short timeframe
        const uniqueActions = actions.filter(action => {
          const recentSimilarAction = actionsHistoryRef.current.find(
            a => a.action === action.action && now - a.timestamp < 2000
          );
          return !recentSimilarAction;
        });
        
        if (uniqueActions.length > 0) {
          // Update history
          actionsHistoryRef.current = [
            ...uniqueActions,
            ...actionsHistoryRef.current.slice(0, 10)
          ];
          
          // Update state with most recent actions
          setDetectedActions([...uniqueActions, ...detectedActions.slice(0, 5)]);
        }
      }
    } catch (error) {
      console.error('Error detecting user actions:', error);
    }
  }, [detectedActions]);
  
  // Run facial analysis
  const runFaceAnalysis = useCallback(async () => {
    if (!videoRef.current || !faceDetected) return;
    
    try {
      // Capture current frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      // Analyze with AI Makeup Manager
      const result = await analyzeFacialImage(imageBase64);
      
      if (result && result.status === 'ok' && result.result) {
        const analysis = result.result.analysis;
        
        if (analysis) {
          setFacialAttributes({
            skinTone: analysis.skinTone || 'Not detected',
            faceShape: analysis.faceShape || 'Not detected',
            features: analysis.features || []
          });
        }
      }
      
      lastAnalysisRef.current = Date.now();
    } catch (error) {
      console.error('Error running face analysis:', error);
    }
  }, [videoRef, faceDetected]);
  
  // Start/stop face detection
  useEffect(() => {
    if (enabled && faceDetectionReady) {
      runFaceDetection();
    } else {
      if (detectionIntervalRef.current) {
        window.clearTimeout(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    }
    
    return () => {
      if (detectionIntervalRef.current) {
        window.clearTimeout(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      
      if (analysisTimeoutRef.current) {
        window.clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
    };
  }, [enabled, faceDetectionReady, runFaceDetection]);
  
  return {
    faceDetectionReady,
    faceDetected,
    detectionConfidence,
    faceLandmarks,
    makeupRegions,
    movementData,
    facialAttributes,
    detectedActions
  };
};
