import { useState, useEffect, useCallback, useRef } from 'react';
import { detectFaces } from '@/lib/faceDetection';
import * as faceapi from '@vladmandic/face-api';
import { FacialAttributes, MovementData, DetectedAction, MakeupRegion, DetectedObject } from '@/types/facial-analysis';

interface UseAdvancedFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  enabled: boolean;
  detectionInterval?: number;
  virtualMakeup?: any;
  onFaceDetected?: (face: any) => void;
  onFaceLost?: () => void;
}

export const useAdvancedFaceDetection = ({
  videoRef,
  canvasRef,
  enabled,
  detectionInterval = 100,
  virtualMakeup,
  onFaceDetected,
  onFaceLost
}: UseAdvancedFaceDetectionProps) => {
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [faceLandmarks, setFaceLandmarks] = useState<any>(null);
  const [facialAttributes, setFacialAttributes] = useState<FacialAttributes>({});
  const [movementData, setMovementData] = useState<MovementData>({
    x: 0, y: 0, magnitude: 0,
    headPose: { pitch: 0, yaw: 0, roll: 0 },
    eyeMovement: { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    mouthMovement: { open: false, smiling: false }
  });
  const [makeupRegions, setMakeupRegions] = useState<MakeupRegion[]>([]);
  const [detectedActions, setDetectedActions] = useState<DetectedAction[]>([]);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);

  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<number>(0);
  const lastFacePositionRef = useRef<any>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const faceLostTimeoutRef = useRef<number | null>(null);
  const actionHistoryRef = useRef<DetectedAction[]>([]);
  const landmarkHistoryRef = useRef<Array<Array<{ x: number; y: number; z: number }>>>([]);

  const getAveragePosition = useCallback((points: Array<{ x: number; y: number }>) => {
    const sum = points.reduce((acc, point) => {
      return { x: acc.x + point.x, y: acc.y + point.y };
    }, { x: 0, y: 0 });
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }, []);

  const detectMakeupRegions = useCallback((landmarks: any) => {
    if (!landmarks) return [];
    
    try {
      const regions: MakeupRegion[] = [];
      
      // Lips region
      const mouth = landmarks.getMouth();
      if (mouth && mouth.length > 0) {
        regions.push({
          type: 'lips',
          region: {
            points: mouth.map((p: any) => ({ x: p.x, y: p.y })),
            center: getAveragePosition(mouth)
          }
        });
      }
      
      // Eyes regions
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      
      if (leftEye && leftEye.length > 0) {
        regions.push({
          type: 'leftEye',
          region: {
            points: leftEye.map((p: any) => ({ x: p.x, y: p.y })),
            center: getAveragePosition(leftEye)
          }
        });
      }
      
      if (rightEye && rightEye.length > 0) {
        regions.push({
          type: 'rightEye',
          region: {
            points: rightEye.map((p: any) => ({ x: p.x, y: p.y })),
            center: getAveragePosition(rightEye)
          }
        });
      }
      
      // Cheeks (approximated)
      const jawOutline = landmarks.getJawOutline();
      if (jawOutline && jawOutline.length > 0) {
        const leftJaw = jawOutline[3];
        const rightJaw = jawOutline[13];
        
        regions.push({
          type: 'leftCheek',
          region: {
            points: [leftJaw, { x: leftJaw.x + 30, y: leftJaw.y - 30 }],
            center: { x: leftJaw.x + 15, y: leftJaw.y - 15 }
          }
        });
        
        regions.push({
          type: 'rightCheek',
          region: {
            points: [rightJaw, { x: rightJaw.x - 30, y: rightJaw.y - 30 }],
            center: { x: rightJaw.x - 15, y: rightJaw.y - 15 }
          }
        });
      }
      
      // Forehead (approximated)
      const nose = landmarks.getNose();
      if (nose && nose.length > 0 && jawOutline && jawOutline.length > 0) {
        const topOfNose = nose[0];
        const foreheadCenter = { x: topOfNose.x, y: topOfNose.y - 50 };
        
        regions.push({
          type: 'forehead',
          region: {
            points: [
              { x: foreheadCenter.x - 50, y: foreheadCenter.y },
              { x: foreheadCenter.x + 50, y: foreheadCenter.y },
              { x: foreheadCenter.x, y: foreheadCenter.y - 30 }
            ],
            center: foreheadCenter
          }
        });
      }
      
      return regions;
    } catch (error) {
      console.error('Error detecting makeup regions:', error);
      return [];
    }
  }, [getAveragePosition]);

  const calculateMovementData = useCallback((detection: any): MovementData => {
    if (!detection || !detection.landmarks) {
      return {
        x: 0, y: 0, magnitude: 0,
        headPose: { pitch: 0, yaw: 0, roll: 0 },
        eyeMovement: { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
        mouthMovement: { open: false, smiling: false }
      };
    }
    
    try {
      const landmarks = detection.landmarks;
      const positions = landmarks.positions;
      
      // Calculate head pose (simplified estimation)
      const faceWidth = detection.detection.box.width;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      const jawOutline = landmarks.getJawOutline();
      
      // Calculate center points
      const leftEyeCenter = getAveragePosition(leftEye);
      const rightEyeCenter = getAveragePosition(rightEye);
      const noseTip = nose[nose.length - 1];
      const faceCenter = getAveragePosition(jawOutline);
      
      // Calculate eyeline (line between eyes)
      const eyeLineAngle = Math.atan2(
        rightEyeCenter.y - leftEyeCenter.y,
        rightEyeCenter.x - leftEyeCenter.x
      ) * (180 / Math.PI);
      
      // Nose direction for yaw
      const noseDirection = noseTip.x - faceCenter.x;
      const yaw = (noseDirection / faceWidth) * 60; // Scale to reasonable degrees
      
      // Use the relative position of the nose to estimate pitch
      const noseHeight = noseTip.y - (leftEyeCenter.y + rightEyeCenter.y) / 2;
      const normalizedNoseHeight = noseHeight / faceWidth;
      const pitch = normalizedNoseHeight * 60 - 15; // Scale and offset
      
      // Get mouth positions
      const mouth = landmarks.getMouth();
      const upperLipCenter = getAveragePosition(mouth.slice(0, 6));
      const lowerLipCenter = getAveragePosition(mouth.slice(6, 12));
      const mouthOpen = lowerLipCenter.y - upperLipCenter.y > faceWidth * 0.05;
      
      // Check for smile using mouth corners and expressions
      const mouthCornerLeft = mouth[0];
      const mouthCornerRight = mouth[6];
      const mouthWidth = Math.abs(mouthCornerRight.x - mouthCornerLeft.x);
      const mouthHeight = (lowerLipCenter.y - upperLipCenter.y);
      const smileRatio = mouthWidth / (mouthHeight || 1);
      let smiling = smileRatio > 6;
      
      // If we have expressions, use them to improve smile detection
      if (detection.expressions) {
        const happyConfidence = detection.expressions.happy || 0;
        if (happyConfidence > 0.7) {
          smiling = true;
        } else if (happyConfidence < 0.2) {
          smiling = false;
        }
      }
      
      // Calculate overall movement magnitude and direction
      const dx = noseTip.x - (lastFacePositionRef.current?.headPose?.noseTip?.x || noseTip.x);
      const dy = noseTip.y - (lastFacePositionRef.current?.headPose?.noseTip?.y || noseTip.y);
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      
      // Save nose tip position for next calculation
      if (!lastFacePositionRef.current) {
        lastFacePositionRef.current = { headPose: {} };
      }
      lastFacePositionRef.current.headPose.noseTip = { x: noseTip.x, y: noseTip.y };
      
      return {
        x: dx,
        y: dy,
        magnitude,
        headPose: {
          pitch, // up/down
          yaw,   // left/right
          roll: eyeLineAngle   // tilt
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
      return {
        x: 0,
        y: 0,
        magnitude: 0,
        headPose: { pitch: 0, yaw: 0, roll: 0 },
        eyeMovement: { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
        mouthMovement: { open: false, smiling: false }
      };
    }
  }, [getAveragePosition]);

  const analyzeFacialAttributes = useCallback((detection: any, movementData: MovementData): FacialAttributes => {
    if (!detection) return {};
    
    try {
      // Extract expressions data if available
      let expression = 'neutral';
      let expressionConfidence = 0;
      
      if (detection.expressions) {
        const expressions = detection.expressions;
        for (const [expr, conf] of Object.entries(expressions)) {
          if ((conf as number) > expressionConfidence) {
            expressionConfidence = conf as number;
            expression = expr;
          }
        }
      }
      
      // Simplified facial analysis
      const facialTraits: FacialAttributes = {
        expression,
        // For a complete app, we would have more sophisticated analysis here
        skinType: 'normal',
        skinTone: 'medium',
        faceShape: 'oval'
      };
      
      // Use mouth movement for additional expression info
      if (movementData.mouthMovement) {
        if (movementData.mouthMovement.smiling) {
          facialTraits.expression = 'happy';
        } else if (movementData.mouthMovement.open) {
          facialTraits.expression = 'surprised';
        }
      }
      
      return facialTraits;
    } catch (error) {
      console.error('Error analyzing facial attributes:', error);
      return {};
    }
  }, []);

  const detectActions = useCallback((currentMovement: MovementData, previousMovement: MovementData | null): DetectedAction[] => {
    if (!previousMovement || !currentMovement.headPose) return [];
    
    try {
      const actions: DetectedAction[] = [];
      const now = Date.now();
      
      // Check for head movements
      if (previousMovement.headPose) {
        const yawDiff = Math.abs(currentMovement.headPose.yaw - (previousMovement.headPose?.yaw || 0));
        const pitchDiff = Math.abs(currentMovement.headPose.pitch - (previousMovement.headPose?.pitch || 0));
        const rollDiff = Math.abs(currentMovement.headPose.roll - (previousMovement.headPose?.roll || 0));
        
        if (yawDiff > 10) {
          actions.push({
            action: currentMovement.headPose.yaw > (previousMovement.headPose?.yaw || 0) ? 
              "head turned right" : "head turned left",
            confidence: Math.min(1, yawDiff / 20),
            timestamp: now
          });
        }
        
        if (pitchDiff > 10) {
          actions.push({
            action: currentMovement.headPose.pitch > (previousMovement.headPose?.pitch || 0) ?
              "head tilted down" : "head tilted up",
            confidence: Math.min(1, pitchDiff / 20),
            timestamp: now
          });
        }
        
        if (rollDiff > 10) {
          actions.push({
            action: currentMovement.headPose.roll > (previousMovement.headPose?.roll || 0) ?
              "head tilted right" : "head tilted left",
            confidence: Math.min(1, rollDiff / 20),
            timestamp: now
          });
        }
      }
      
      // Check for mouth movements
      if (currentMovement.mouthMovement?.open && (!previousMovement.mouthMovement?.open)) {
        actions.push({
          action: "opened mouth",
          confidence: 0.8,
          timestamp: now
        });
      }
      
      if (!currentMovement.mouthMovement?.open && previousMovement.mouthMovement?.open) {
        actions.push({
          action: "closed mouth",
          confidence: 0.8,
          timestamp: now
        });
      }
      
      if (currentMovement.mouthMovement?.smiling && !previousMovement.mouthMovement?.smiling) {
        actions.push({
          action: "started smiling",
          confidence: 0.9,
          timestamp: now
        });
      }
      
      return actions;
    } catch (error) {
      console.error('Error detecting actions:', error);
      return [];
    }
  }, []);

  const applyMakeupToCanvas = useCallback(() => {
    if (!canvasRef.current || !virtualMakeup || !makeupRegions.length) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    makeupRegions.forEach(region => {
      if (region.type === 'lips' && virtualMakeup.lips) {
        const { color, intensity, glossy } = virtualMakeup.lips;
        const lipPoints = region.region.points;
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(lipPoints[0].x, lipPoints[0].y);
        for (let i = 1; i < lipPoints.length; i++) {
          ctx.lineTo(lipPoints[i].x, lipPoints[i].y);
        }
        ctx.closePath();
        
        // Apply base color
        ctx.fillStyle = `rgba(${hexToRgb(color || '#FF5555')}, ${intensity || 0.7})`;
        ctx.fill();
        
        // Apply gloss effect if enabled
        if (glossy) {
          const center = region.region.center;
          const gradient = ctx.createRadialGradient(
            center.x, center.y - 5, 1,
            center.x, center.y, 15
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fill();
        }
        ctx.restore();
      }
      
      if ((region.type === 'leftEye' || region.type === 'rightEye') && virtualMakeup.eyes) {
        const { color, intensity } = virtualMakeup.eyes;
        const eyePoints = region.region.points;
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(eyePoints[0].x, eyePoints[0].y);
        for (let i = 1; i < eyePoints.length; i++) {
          ctx.lineTo(eyePoints[i].x, eyePoints[i].y);
        }
        ctx.closePath();
        
        ctx.fillStyle = `rgba(${hexToRgb(color || '#555599')}, ${intensity || 0.5})`;
        ctx.fill();
        ctx.restore();
      }
      
      if ((region.type === 'leftCheek' || region.type === 'rightCheek') && virtualMakeup.cheeks) {
        const { color, intensity } = virtualMakeup.cheeks;
        const center = region.region.center;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(center.x, center.y, 30, 0, 2 * Math.PI);
        const gradient = ctx.createRadialGradient(
          center.x, center.y, 1,
          center.x, center.y, 30
        );
        gradient.addColorStop(0, `rgba(${hexToRgb(color || '#FF9999')}, ${intensity || 0.5})`);
        gradient.addColorStop(1, `rgba(${hexToRgb(color || '#FF9999')}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
      }
    });
  }, [canvasRef, virtualMakeup, makeupRegions]);

  const hexToRgb = useCallback((hex: string): string => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert 3-digit hex to 6-digits
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  }, []);

  const runFaceDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !enabled) return;
    
    try {
      const now = Date.now();
      const timeSinceLastRun = now - lastDetectionRef.current;
      
      // Don't run too often to avoid performance issues
      if (timeSinceLastRun < detectionInterval) return;
      
      lastDetectionRef.current = now;
      
      // Update canvas dimensions if needed
      if (canvasRef.current.width !== videoRef.current.videoWidth || 
          canvasRef.current.height !== videoRef.current.videoHeight) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }
      
      // Clear canvas for new drawing
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(videoRef.current, 0, 0);
      }
      
      // Detect faces
      const detections = await detectFaces(videoRef.current);
      
      if (detections && detections.length > 0) {
        // Take the detection with highest confidence if multiple faces are detected
        const bestDetection = detections.reduce((prev, current) => 
          (current.detection.score > prev.detection.score) ? current : prev
        );
        
        const { detection, landmarks: faceLandmarks, expressions: faceExpressions } = bestDetection;
        const confidence = detection.score;
        
        setFaceDetected(true);
        setDetectionConfidence(confidence);
        setFaceLandmarks(faceLandmarks);
        
        // Calculate movement data
        const currentMovementData = calculateMovementData(bestDetection);
        setMovementData(currentMovementData);
        
        // Detect makeup regions
        const regions = detectMakeupRegions(faceLandmarks);
        setMakeupRegions(regions);
        
        // Apply virtual makeup if enabled
        if (virtualMakeup) {
          applyMakeupToCanvas();
        }
        
        // Analyze facial attributes
        const attributes = analyzeFacialAttributes(bestDetection, currentMovementData);
        setFacialAttributes(attributes);
        
        // Detect actions
        const actions = detectActions(currentMovementData, lastFacePositionRef.current);
        if (actions.length > 0) {
          setDetectedActions(prev => {
            // Add new actions and keep only the latest 5
            const newActions = [...actions, ...prev];
            return newActions.slice(0, 5);
          });
          
          // Update action history
          actionHistoryRef.current = [
            ...actions,
            ...actionHistoryRef.current
          ].slice(0, 20); // Keep last 20 actions
        }
        
        // Call onFaceDetected callback if provided
        if (!faceDetected && onFaceDetected) {
          onFaceDetected(bestDetection);
        }
        
        // Update the movement reference for next detection
        lastFacePositionRef.current = currentMovementData;
        
        // Clear any pending face lost timeout
        if (faceLostTimeoutRef.current) {
          window.clearTimeout(faceLostTimeoutRef.current);
          faceLostTimeoutRef.current = null;
        }
      } else {
        // No face detected in this frame, but don't immediately set faceDetected to false
        // to avoid flickering. Instead, set a short timeout.
        if (faceDetected && !faceLostTimeoutRef.current) {
          faceLostTimeoutRef.current = window.setTimeout(() => {
            setFaceDetected(false);
            if (onFaceLost) {
              onFaceLost();
            }
            faceLostTimeoutRef.current = null;
          }, 1000); // Wait 1 second before declaring face lost
        }
      }
      
      // Mock object detection (in a real implementation, this would use an object detection model)
      if (faceDetected && Math.random() < 0.05) { // 5% chance to detect a new object
        const mockObjects: DetectedObject[] = [
          { type: 'Foundation Brush', position: { x: Math.random() * 100, y: Math.random() * 100 }, confidence: 0.7 + Math.random() * 0.3 },
          { type: 'Lipstick', position: { x: Math.random() * 100, y: Math.random() * 100 }, confidence: 0.7 + Math.random() * 0.3 },
          { type: 'Eyeshadow Palette', position: { x: Math.random() * 100, y: Math.random() * 100 }, confidence: 0.7 + Math.random() * 0.3 },
          { type: 'Mascara Wand', position: { x: Math.random() * 100, y: Math.random() * 100 }, confidence: 0.7 + Math.random() * 0.3 }
        ];
        
        setDetectedObjects([mockObjects[Math.floor(Math.random() * mockObjects.length)]]);
        
        // Clear after a few seconds
        setTimeout(() => {
          setDetectedObjects([]);
        }, 3000);
      }
    } catch (error) {
      console.error('Error in face detection:', error);
    }
    
    // Schedule next run
    detectionIntervalRef.current = window.setTimeout(runFaceDetection, detectionInterval);
  }, [
    videoRef, canvasRef, enabled, detectionInterval, faceDetected, onFaceDetected, onFaceLost, 
    calculateMovementData, detectMakeupRegions, analyzeFacialAttributes, detectActions, 
    applyMakeupToCanvas, virtualMakeup
  ]);

  useEffect(() => {
    if (enabled) {
      setFaceDetectionReady(true);
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
  }, [enabled, runFaceDetection]);

  return {
    faceDetectionReady,
    faceDetected,
    detectionConfidence,
    faceLandmarks,
    movementData,
    makeupRegions,
    facialAttributes,
    detectedActions,
    detectedObjects
  };
};
