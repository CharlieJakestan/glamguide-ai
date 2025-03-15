
import { useState } from 'react';

interface UseFaceDetectionProps {
  toast: any;
}

export const useFaceDetection = ({ toast }: UseFaceDetectionProps) => {
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);

  return {
    faceDetectionReady,
    setFaceDetectionReady
  };
};
