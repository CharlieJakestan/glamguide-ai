
import { useState } from 'react';
import { FacialTraits } from './useFaceAnalysis';

export const useAnalysisState = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [detectedFacialTraits, setDetectedFacialTraits] = useState<FacialTraits | null>(null);
  
  return {
    isAnalyzing,
    setIsAnalyzing,
    analysisImage,
    setAnalysisImage,
    analysisError,
    setAnalysisError,
    detectedFacialTraits,
    setDetectedFacialTraits
  };
};
