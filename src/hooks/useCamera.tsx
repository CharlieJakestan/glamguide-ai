
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

  // Load available camera devices with retry mechanism
  const loadCameraDevices = useCallback(async () => {
    console.log('Attempting to load camera devices...');
    try {
      // Ensure we have media devices API permissions
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log(`Found ${videoDevices.length} camera devices`);
      setAvailableDevices(videoDevices);
      
      if (videoDevices.length === 0) {
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
      console.warn('Camera device access error (non-critical):', error);
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
          console.warn('Camera permission denied by user');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setDeviceNotFound(true);
          console.warn('No camera devices found');
        } else {
          console.warn('Camera access error:', error.message);
        }
      }
      return false;
    }
  }, [selectedDeviceId, toast]);

  // Check if camera is available when component mounts
  useEffect(() => {
    // Check if the browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Camera not supported in this browser');
      setDeviceNotFound(true);
      return;
    }

    // Only load camera devices on component mount, don't auto-activate
    loadCameraDevices().then(hasDevices => {
      if (hasDevices) {
        console.log('Camera devices loaded successfully');
      } else {
        console.log('No camera devices found on initial load');
      }
    }).catch(error => {
      console.warn('Error loading camera devices on mount:', error);
      setDeviceNotFound(true);
    });
  }, [toast, loadCameraDevices]);

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
    setFaceDetected(false);
  }, []);

  const checkDevices = async (): Promise<boolean> => {
    // Force refresh the device list
    console.log('Checking for camera devices...');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Brief access to trigger permission prompt if needed
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tempStream.getTracks().forEach(track => track.stop());
        
        // Now enumerate devices again
        return await loadCameraDevices();
      } catch (error) {
        console.error('Error checking camera devices:', error);
        return false;
      }
    }
    return false;
  };

  const selectCamera = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (cameraActive) {
      stopCameraStream();
      await activateCamera(deviceId);
    }
  };

  const activateCamera = async (deviceId?: string) => {
    // Reset error states
    setDeviceNotFound(false);
    setPermissionDenied(false);
    
    console.log('Activating camera...');
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Camera Not Supported",
        description: "Your browser doesn't support camera access. Try using Chrome, Firefox, or Edge.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Force device enumeration refresh
      await navigator.mediaDevices.getUserMedia({ video: true });
      const refreshedDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = refreshedDevices.filter(device => device.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      
      if (videoDevices.length === 0) {
        setDeviceNotFound(true);
        toast({
          title: "No Camera Found",
          description: "No camera devices were detected. Please connect a camera and try again.",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Error during device enumeration:', error);
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
        setPermissionDenied(true);
        toast({
          title: "Permission Denied",
          description: "Camera access was blocked. Please reset permissions in your browser settings.",
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
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
          
          toast({
            title: "Camera Activated",
            description: "Position your face in the frame for analysis.",
          });
        } catch (playError) {
          console.error('Error playing video:', playError);
          toast({
            title: "Video Playback Error",
            description: "Could not start video playback. Please try reloading the page.",
            variant: "destructive",
          });
          stopCameraStream();
          return;
        }
      } else {
        console.error('Video reference is not available');
        toast({
          title: "Video Element Error",
          description: "Could not access video element. Please try reloading the page.",
          variant: "destructive",
        });
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setDeviceInitAttempts(prev => prev + 1);
      
      // Handle specific error types
      if (error instanceof DOMException) {
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setDeviceNotFound(true);
          toast({
            title: "Camera Not Found",
            description: "No camera was found. Please check your camera connection or try a different browser.",
            variant: "destructive",
          });
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
          toast({
            title: "Permission Denied",
            description: "Camera access was blocked. Please check browser permissions and click the camera icon in the address bar.",
            variant: "destructive",
          });
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          toast({
            title: "Camera In Use",
            description: "The camera may be in use by another application. Please close other apps using the camera.",
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
          title: "Camera Error",
          description: "An unknown error occurred while accessing the camera. Try refreshing the page.",
          variant: "destructive",
        });
      }
      
      // If we've tried multiple times, attempt fallback to default camera
      if (deviceInitAttempts >= 2 && selectedDeviceId) {
        console.log('Multiple camera activation failures. Attempting with default camera...');
        setSelectedDeviceId(null);
        setTimeout(() => {
          activateCamera();
        }, 1000);
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
  
  // Handle device change events
  useEffect(() => {
    const handleDeviceChange = async () => {
      console.log('Media devices changed, updating device list...');
      await loadCameraDevices();
    };
    
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [loadCameraDevices]);
  
  // Attempt to automatically recover if camera is reported as not found
  useEffect(() => {
    if (deviceNotFound && deviceInitAttempts < 3) {
      const recoverTimer = setTimeout(() => {
        console.log('Attempting to recover from device not found...');
        checkDevices().then(hasDevices => {
          if (hasDevices && !cameraActive) {
            console.log('Camera devices found during recovery, attempting activation');
            activateCamera();
          }
        });
      }, 2000);
      
      return () => clearTimeout(recoverTimer);
    }
  }, [deviceNotFound, deviceInitAttempts, cameraActive, checkDevices, activateCamera]);

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
