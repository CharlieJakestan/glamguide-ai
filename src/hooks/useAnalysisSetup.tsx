
import { useState } from 'react';
import { ReferenceLook } from '@/services/lookReferenceService';

export const useAnalysisSetup = () => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentGuidance, setCurrentGuidance] = useState<string>("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [detectedFacialTraits, setDetectedFacialTraits] = useState<{
    skinTone: string;
    faceShape: string;
    features: string[];
    recommendations: string[];
  } | null>(null);
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [referenceLooks, setReferenceLooks] = useState<ReferenceLook[]>([]);
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);

  return {
    voiceEnabled, setVoiceEnabled,
    currentGuidance, setCurrentGuidance,
    progressPercentage, setProgressPercentage,
    detectedFacialTraits, setDetectedFacialTraits,
    analysisImage, setAnalysisImage,
    analysisError, setAnalysisError,
    isAnalyzing, setIsAnalyzing,
    referenceLooks, setReferenceLooks,
    selectedLookId, setSelectedLookId
  };
};
