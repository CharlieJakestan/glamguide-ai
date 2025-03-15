
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getReferenceLooks, 
  getReferenceLookById, 
  getPersonalizedInstructions,
  ReferenceLook
} from '@/services/lookReferenceService';
import { speakInstruction } from '@/services/speechService';

export interface UseReferenceLookGuidanceProps {
  voiceEnabled: boolean;
  facialAnalysis: {
    skinTone?: string;
    faceShape?: string;
    features?: string[];
  } | null;
}

export const useReferenceLookGuidance = ({
  voiceEnabled,
  facialAnalysis
}: UseReferenceLookGuidanceProps) => {
  const { toast } = useToast();
  const [availableLooks, setAvailableLooks] = useState<ReferenceLook[]>([]);
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);
  const [selectedLook, setSelectedLook] = useState<ReferenceLook | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [customizedSteps, setCustomizedSteps] = useState<(ReferenceLook['steps'][0] & { customization?: string })[]>([]);
  const [personalRecommendations, setPersonalRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Load available reference looks
  useEffect(() => {
    const looks = getReferenceLooks();
    setAvailableLooks(looks);
    
    // Auto-select the first look if available
    if (looks.length > 0 && !selectedLookId) {
      setSelectedLookId(looks[0].id);
    }
  }, []);
  
  // Update selected look when ID changes
  useEffect(() => {
    if (selectedLookId) {
      const look = getReferenceLookById(selectedLookId);
      if (look) {
        setSelectedLook(look);
        setCurrentStep(0);
        setCompletedSteps([]);
      }
    } else {
      setSelectedLook(null);
    }
  }, [selectedLookId]);
  
  // Update personalized instructions when facial analysis or selected look changes
  useEffect(() => {
    const updatePersonalizedInstructions = async () => {
      if (selectedLookId && facialAnalysis) {
        setIsLoading(true);
        try {
          const { customizedSteps, recommendations } = await getPersonalizedInstructions(
            selectedLookId,
            facialAnalysis
          );
          
          setCustomizedSteps(customizedSteps);
          setPersonalRecommendations(recommendations);
          
          // Show a toast with personalized recommendations
          if (recommendations.length > 0) {
            toast({
              title: "Personalized Tips Available",
              description: "Based on your facial features, we've customized application steps for you.",
            });
          }
        } catch (error) {
          console.error('Error getting personalized instructions:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    updatePersonalizedInstructions();
  }, [selectedLookId, facialAnalysis, toast]);
  
  // Speak the current step instruction when it changes or voice is enabled
  useEffect(() => {
    if (voiceEnabled && selectedLook && customizedSteps.length > 0) {
      const step = customizedSteps[currentStep];
      if (step) {
        let instruction = `Step ${currentStep + 1}: ${step.instruction}`;
        if (step.customization) {
          instruction += `. ${step.customization}`;
        }
        speakInstruction(instruction);
      }
    }
  }, [currentStep, voiceEnabled, selectedLook, customizedSteps]);
  
  // Functions to navigate steps
  const goToNextStep = () => {
    if (selectedLook && currentStep < selectedLook.steps.length - 1) {
      // Mark current step as completed if not already
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const markCurrentStepCompleted = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
      
      // Auto advance to next step if available
      if (selectedLook && currentStep < selectedLook.steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };
  
  const selectStep = (stepIndex: number) => {
    if (selectedLook && stepIndex >= 0 && stepIndex < selectedLook.steps.length) {
      setCurrentStep(stepIndex);
    }
  };
  
  // Get current step details
  const getCurrentStepInstruction = () => {
    if (!selectedLook || customizedSteps.length === 0) return null;
    
    return customizedSteps[currentStep];
  };
  
  return {
    availableLooks,
    selectedLookId,
    selectedLook,
    currentStep,
    completedSteps,
    personalRecommendations,
    isLoading,
    customizedSteps,
    getCurrentStepInstruction,
    setSelectedLookId,
    goToNextStep,
    goToPreviousStep,
    markCurrentStepCompleted,
    selectStep,
  };
};
