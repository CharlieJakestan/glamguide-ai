
import React, { RefObject } from 'react';
import { CameraOff } from 'lucide-react';

interface VideoDisplayProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isStreamActive: boolean;
  faceDetected: boolean;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({
  videoRef,
  canvasRef,
  isStreamActive,
  faceDetected,
}) => {
  return (
    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-6">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      {!isStreamActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <CameraOff className="w-16 h-16 text-gray-400" />
        </div>
      )}
      
      {isStreamActive && !faceDetected && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">
            No face detected. Please position your face in the frame.
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDisplay;
