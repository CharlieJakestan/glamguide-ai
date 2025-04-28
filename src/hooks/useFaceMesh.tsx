
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  loadFaceMeshModel, 
  detectFaceMesh, 
  drawFaceMesh, 
  analyzeFacialFeatures,
  detectMakeupTools
} from '@/services/faceMeshService';

export const useFaceMesh = ({
  videoRef,
  canvasRef,
  enabled = true
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  enabled?: boolean;
}) => {
  const { toast } = useToast();
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facialFeatures, setFacialFeatures] = useState<any>(null);
  const [faceMeshPoints, setFaceMeshPoints] = useState<any>(null);
  const [detectedTools, setDetectedTools] = useState<Array<{type: string; confidence: number}>>([]);
  
  const animationRef = useRef<number | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load facemesh model
  useEffect(() => {
    const initModel = async () => {
      try {
        const model = await loadFaceMeshModel();
        if (model) {
          setIsModelLoaded(true);
          console.log('Face mesh model loaded successfully');
        } else {
          throw new Error('Failed to load face mesh model');
        }
      } catch (error) {
        console.error('Error loading face mesh model:', error);
        toast({
          title: "Face Detection Error",
          description: "Failed to load face detection model. Some features may not work.",
          variant: "destructive",
        });
      }
    };

    if (enabled) {
      initModel();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [enabled, toast]);

  // Run face detection loop when model is loaded and video is streaming
  useEffect(() => {
    if (!isModelLoaded || !enabled || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Resize canvas to match video dimensions
    const resizeCanvas = () => {
      if (video && canvas && video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    };

    // Detection function
    const runDetection = async () => {
      if (!video || !canvas || video.paused || video.ended) {
        setFaceDetected(false);
        return;
      }

      resizeCanvas();
      
      try {
        const predictions = await detectFaceMesh(video);
        
        if (predictions && predictions.length > 0) {
          setFaceDetected(true);
          setFaceMeshPoints(predictions);
          drawFaceMesh(canvas, predictions);
          
          // Analyze facial features (less frequently)
          if (!facialFeatures || Math.random() > 0.7) {
            const features = analyzeFacialFeatures(predictions);
            if (features) {
              setFacialFeatures(features);
            }
          }
        } else {
          setFaceDetected(false);
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }
      
      // Continue detection loop
      animationRef.current = requestAnimationFrame(runDetection);
    };

    // Start detection loop
    runDetection();

    // Periodically detect makeup tools (less frequently than face detection)
    detectionIntervalRef.current = setInterval(async () => {
      if (video && faceDetected) {
        const tools = await detectMakeupTools(video);
        setDetectedTools(tools);
      }
    }, 3000); // Every 3 seconds

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isModelLoaded, enabled, videoRef, canvasRef, faceDetected]);

  return {
    faceDetected,
    facialFeatures,
    faceMeshPoints,
    detectedTools,
    isModelLoaded
  };
};
