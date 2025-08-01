import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useCamera = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [deviceNotFound, setDeviceNotFound] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceMesh, setFaceMesh] = useState(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceInitAttempts, setDeviceInitAttempts] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Safe device loading that never throws errors
  const loadCameraDevices = useCallback(async () => {
    try {
      // Check if mediaDevices is available (some browsers/devices don't support it)
      if (!navigator?.mediaDevices?.enumerateDevices) {
        console.warn('Camera enumeration not supported - graceful fallback');
        return false;
      }

      // Try to get permission first
      let hasPermission = false;
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        testStream.getTracks().forEach(track => track.stop());
        hasPermission = true;
      } catch (permError) {
        console.warn('No camera permission yet:', permError);
        // Continue without permission - user can grant it later
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log(`Found ${videoDevices.length} camera devices`);
      setAvailableDevices(videoDevices);
      
      if (videoDevices.length === 0) {
        console.warn('No video input devices found - app continues normally');
        setDeviceNotFound(true);
        return false;
      } else {
        setDeviceNotFound(false);
        
        // Auto-select the first device if available
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
        return true;
      }
    } catch (error) {
      console.warn('Error loading camera devices (non-blocking):', error);
      setDeviceNotFound(true);
      return false;
    }
  }, [selectedDeviceId]);

  // Safe initialization that never blocks the app
  useEffect(() => {
    // Check if the browser supports getUserMedia
    if (!navigator?.mediaDevices?.getUserMedia) {
      console.warn('Camera not supported in this browser - app continues normally');
      setDeviceNotFound(true);
      return;
    }

    // Load camera devices in background without blocking
    Promise.resolve().then(async () => {
      try {
        await loadCameraDevices();
      } catch (error) {
        console.warn('Background camera device loading failed (non-blocking):', error);
      }
    });
  }, [loadCameraDevices]);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      try {
        stopCameraStream();
      } catch (error) {
        console.warn('Error during cleanup (non-blocking):', error);
      }
    };
  }, []);

  const stopCameraStream = useCallback(() => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (trackError) {
            console.warn('Error stopping track (non-blocking):', trackError);
          }
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
      setFaceDetected(false);
    } catch (error) {
      console.warn('Error stopping camera stream (non-blocking):', error);
    }
  }, []);

  const checkDevices = async (): Promise<boolean> => {
    try {
      console.log('Checking for camera devices...');
      if (!navigator?.mediaDevices?.getUserMedia) {
        return false;
      }

      // Brief access to trigger permission prompt if needed
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      tempStream.getTracks().forEach(track => track.stop());
      
      // Now enumerate devices again
      return await loadCameraDevices();
    } catch (error) {
      console.warn('Error checking camera devices (non-blocking):', error);
      return false;
    }
  };

  const selectCamera = async (deviceId: string) => {
    try {
      setSelectedDeviceId(deviceId);
      if (cameraActive) {
        stopCameraStream();
        await activateCamera(deviceId);
      }
    } catch (error) {
      console.warn('Error selecting camera (non-blocking):', error);
    }
  };

  const activateCamera = async (deviceId?: string) => {
    try {
      // Reset error states
      setDeviceNotFound(false);
      setPermissionDenied(false);
      
      console.log('Attempting to activate camera...');
      
      // Check if getUserMedia is supported
      if (!navigator?.mediaDevices?.getUserMedia) {
        console.warn('Camera not supported in this browser');
        setDeviceNotFound(true);
        toast({
          title: "Camera Not Supported",
          description: "Your browser doesn't support camera access. Try using Chrome, Firefox, or Edge.",
          variant: "destructive",
        });
        return;
      }
      
      // Try to get device list first
      try {
        const refreshedDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = refreshedDevices.filter(device => device.kind === 'videoinput');
        setAvailableDevices(videoDevices);
        
        if (videoDevices.length === 0) {
          console.warn('No camera devices found');
          setDeviceNotFound(true);
          toast({
            title: "No Camera Found",
            description: "No camera devices were detected. Please connect a camera and try again.",
            variant: "destructive",
          });
          return;
        }
      } catch (enumError) {
        console.warn('Device enumeration failed (continuing):', enumError);
        // Continue anyway - maybe the camera will work
      }
      
      // Use the selected device ID or default to the first available one
      const targetDeviceId = deviceId || selectedDeviceId || availableDevices[0]?.deviceId;
      
      console.log('Requesting camera with device ID:', targetDeviceId || 'default');
      
      // Try with explicitly set constraints
      const constraints: MediaStreamConstraints = { 
        audio: false,
        video: targetDeviceId ? 
          { 
            deviceId: { exact: targetDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user" 
          } :
          { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user" 
          }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        console.log('Camera stream acquired, attempting to play video');
        
        // Ensure the video element starts playing
        try {
          await videoRef.current.play();
          console.log('Video playback started successfully');
          setCameraActive(true);
          setPermissionDenied(false);
          setDeviceNotFound(false);
          
          toast({
            title: "Camera Activated",
            description: "Position your face in the frame for analysis.",
          });
        } catch (playError) {
          console.warn('Video playback failed (non-blocking):', playError);
          // Still consider camera active even if autoplay fails
          setCameraActive(true);
          setPermissionDenied(false);
          setDeviceNotFound(false);
        }
      } else {
        console.warn('Video reference not available');
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    } catch (error) {
      console.warn('Camera activation failed (non-blocking):', error);
      setDeviceInitAttempts(prev => prev + 1);
      
      // Handle specific error types with user-friendly messages
      if (error instanceof DOMException) {
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setDeviceNotFound(true);
          toast({
            title: "Camera Not Found",
            description: "No camera was found. Please check your camera connection.",
            variant: "destructive",
          });
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
          toast({
            title: "Permission Denied",
            description: "Camera access was blocked. Please allow camera access and try again.",
            variant: "destructive",
          });
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          toast({
            title: "Camera Busy",
            description: "The camera may be in use by another application. Please close other apps using the camera.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Camera Unavailable",
            description: "Could not access camera. Please check your camera settings.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Camera Access Failed",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleCamera = async () => {
    try {
      if (cameraActive) {
        stopCameraStream();
      } else {
        await activateCamera();
      }
    } catch (error) {
      console.warn('Error toggling camera (non-blocking):', error);
    }
  };

  const captureFrame = useCallback((): string | null => {
    try {
      if (!videoRef.current) return null;
      
      // Create a canvas to capture the current video frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.warn("Could not get canvas context");
        return null;
      }
      
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    } catch (error) {
      console.warn('Error capturing frame (non-blocking):', error);
      return null;
    }
  }, []);
  
  // Handle device change events safely
  useEffect(() => {
    const handleDeviceChange = async () => {
      try {
        console.log('Media devices changed, updating device list...');
        await loadCameraDevices();
      } catch (error) {
        console.warn('Error handling device change (non-blocking):', error);
      }
    };
    
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      try {
        navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
      } catch (error) {
        console.warn('Error removing device change listener (non-blocking):', error);
      }
    };
  }, [loadCameraDevices]);

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
    setFaceMesh,
    availableDevices,
    selectedDeviceId,
    selectCamera,
    loadCameraDevices
  };
};