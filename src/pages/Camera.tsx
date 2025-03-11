
import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

const CameraPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreamActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-purple-800 mb-6">
            Live Makeup Analysis
          </h2>
          
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isStreamActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <CameraOff className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {!isStreamActive ? (
              <Button
                onClick={startCamera}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            ) : (
              <Button
                onClick={stopCamera}
                variant="destructive"
              >
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Camera
              </Button>
            )}
          </div>

          {hasPermission === false && (
            <p className="mt-4 text-red-600 text-center">
              Camera access denied. Please check your browser permissions.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CameraPage;
