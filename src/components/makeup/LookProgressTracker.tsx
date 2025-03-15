
import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LookProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  stepNames: string[];
  onSelectStep?: (stepIndex: number) => void;
}

const LookProgressTracker: React.FC<LookProgressTrackerProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
  stepNames,
  onSelectStep
}) => {
  const percentage = (completedSteps.length / totalSteps) * 100;
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-purple-700">Look Progress</span>
        <span className="text-gray-600">{Math.round(percentage)}% Complete</span>
      </div>
      
      <Progress value={percentage} className="h-2" />
      
      <div className="mt-4 space-y-2">
        {stepNames.map((name, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          
          return (
            <div 
              key={index}
              className={`flex items-center p-2 rounded-md cursor-pointer ${
                isCurrent ? 'bg-purple-50 border border-purple-200' : ''
              }`}
              onClick={() => onSelectStep && onSelectStep(index)}
            >
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <Circle className={`h-5 w-5 mr-2 ${isCurrent ? 'text-purple-500' : 'text-gray-300'}`} />
              )}
              <span className={`text-sm ${isCurrent ? 'font-medium text-purple-700' : isCompleted ? 'text-gray-500' : 'text-gray-600'}`}>
                {index + 1}. {name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LookProgressTracker;
