
import { useState, useRef, useEffect } from 'react';

export const useAnalysisProgress = () => {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentGuidance, setCurrentGuidance] = useState<string>("");
  const progressIntervalRef = useRef<number | null>(null);
  
  // Clean up progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, []);
  
  const simulateProgressIncrease = () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
    }
    
    setProgressPercentage(0);
    
    progressIntervalRef.current = window.setInterval(() => {
      setProgressPercentage(prev => {
        const newValue = prev + (Math.random() * 5);
        if (newValue >= 100) {
          if (progressIntervalRef.current) {
            window.clearInterval(progressIntervalRef.current);
          }
          return 100;
        }
        return newValue;
      });
    }, 500);
  };
  
  return {
    progressPercentage,
    setProgressPercentage,
    currentGuidance,
    setCurrentGuidance,
    simulateProgressIncrease
  };
};
