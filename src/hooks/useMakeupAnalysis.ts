
import { useState } from 'react';
import { MakeupAnalyzer } from '@/services/makeupAnalysis/MakeupAnalyzer';
import { MakeupRecommendation, UserInputs, CoordinatedLook } from '@/services/makeupAnalysis/types';

export const useMakeupAnalysis = () => {
  const [recommendations, setRecommendations] = useState<MakeupRecommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzer = new MakeupAnalyzer();

  const analyzeMakeup = async (
    occasion?: string,
    region?: string,
    style?: string,
    colorPalette?: string
  ) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = analyzer.getMakeupRecommendations(
        occasion,
        region,
        style,
        colorPalette
      );
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      console.error('Makeup analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    recommendations,
    isAnalyzing,
    error,
    analyzeMakeup
  };
};
