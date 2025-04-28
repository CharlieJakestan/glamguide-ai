
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useCamera = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [deviceNotFound, setDeviceNotFound] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceMesh, setFaceMesh] = useState(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Check if camera is available when component mounts
  useEffect(() => {
    // Check if the browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Camera Not Supported",
        description: "Your browser doesn't support camera access. Try using a modern browser.",
        variant: "destructive",
      });
      return;
    }

    // Auto-activate camera on component mount
    activateCamera();

    // Reset device error states when component mounts
    setDeviceNotFound(false);
    setPermissionDenied(false);
  }, [toast]);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const checkDevices = async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length > 0) {
        setDeviceNotFound(false);
        return true;
      } else {
        setDeviceNotFound(true);
        toast({
          title: "No Camera Found",
          description: "No video input devices detected. Please connect a camera and try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error checking devices:', error);
      setDeviceNotFound(true);
      toast({
        title: "Camera Check Failed",
        description: "An error occurred while checking for cameras.",
        variant: "destructive",
      });
      return false;
    }
  };

  const activateCamera = async () => {
    // Reset error states
    setDeviceNotFound(false);
    setPermissionDenied(false);
    
    // Check if any video devices are available
    const hasVideoDevices = await checkDevices();
    
    if (!hasVideoDevices) {
      return;
    }
    
    try {
      // Explicitly request camera access with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user" 
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Ensure the video element starts playing
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing video:', error);
            toast({
              title: "Video Playback Error",
              description: "Could not start video playback. Please try again.",
              variant: "destructive",
            });
          });
        }
      }
      
      setCameraActive(true);
      
      toast({
        title: "Camera Activated",
        description: "Position your face in the frame for analysis.",
      });
      
      console.log('Camera activated successfully');
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      // Handle specific error types
      if (error instanceof DOMException) {
        if (error.name === 'NotFoundError') {
          setDeviceNotFound(true);
          toast({
            title: "Camera Not Found",
            description: "No camera was found or it may be in use by another application.",
            variant: "destructive",
          });
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
          toast({
            title: "Permission Denied",
            description: "Camera access was blocked. Please reset permissions in your browser settings and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Camera Access Error",
            description: `Could not access camera: ${error.message}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Camera Access Error",
          description: "An unknown error occurred while accessing the camera.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleCamera = async () => {
    if (cameraActive) {
      // Stop camera
      stopCameraStream();
    } else {
      // Start camera
      activateCamera();
    }
  };

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current) return null;
    
    try {
      // Create a canvas to capture the current video frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error("Could not get canvas context");
      }
      
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }, [videoRef]);

  return {
    cameraActive,
    toggleCamera,
    activateCamera,
    videoRef,
    canvasRef,
    streamRef,
    captureFrame,
    permissionDenied,
    deviceNotFound,
    checkDevices,
    stopCameraStream,
    faceDetected,
    setFaceDetected,
    faceMesh,
    setFaceMesh
  };
};
