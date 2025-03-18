
import { useState, useCallback } from 'react';

export const useAnalysisProgress = () => {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentGuidance, setCurrentGuidance] = useState('');

  // Updated to accept an optional amount parameter with a default value
  const simulateProgressIncrease = useCallback((amount: number = 10) => {
    setProgressPercentage(prev => {
      const newProgress = Math.min(100, prev + amount);
      return newProgress;
    });
  }, []);

  return {
    progressPercentage,
    setProgressPercentage,
    currentGuidance,
    setCurrentGuidance,
    simulateProgressIncrease
  };
};
