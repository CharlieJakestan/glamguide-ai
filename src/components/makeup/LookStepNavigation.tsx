
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LookStepNavigationProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  stepNames: string[];
  currentInstruction: string;
  onNext: () => void;
  onPrevious: () => void;
  onMarkCompleted: () => void;
  onSelectStep: (step: number) => void;
  availableLooks: Array<any>;
  selectedLookId: string;
  onSelectLook: (lookId: string) => void;
}

const LookStepNavigation: React.FC<LookStepNavigationProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
  stepNames,
  currentInstruction,
  onNext,
  onPrevious,
  onMarkCompleted,
  onSelectStep,
  availableLooks,
  selectedLookId,
  onSelectLook
}) => {
  const progressPercentage = totalSteps > 0 
    ? Math.round((completedSteps.length / totalSteps) * 100) 
    : 0;
  
  const isStepCompleted = completedSteps.includes(currentStep);
  
  return (
    <Card className="p-4 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-purple-800">Makeup Tutorial Guide</h3>
        
        <Select value={selectedLookId} onValueChange={onSelectLook}>
          <SelectTrigger className="w-[180px] border-purple-200">
            <SelectValue placeholder="Select Look" />
          </SelectTrigger>
          <SelectContent>
            {availableLooks.map((look) => (
              <SelectItem key={look.id} value={look.id}>
                {look.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-purple-700 mb-1">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border border-purple-100">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-purple-600">
            Step {currentStep + 1} of {totalSteps}
          </div>
          {isStepCompleted && (
            <div className="flex items-center text-green-600 text-sm">
              <Check className="w-4 h-4 mr-1" />
              Completed
            </div>
          )}
        </div>
        
        <p className="text-purple-900 font-medium">{currentInstruction}</p>
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onPrevious}
          disabled={currentStep === 0}
          className="border-purple-200"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onMarkCompleted}
          className={isStepCompleted ? "bg-green-50 text-green-700 border-green-200" : "border-purple-200"}
        >
          {isStepCompleted ? (
            <RefreshCw className="w-4 h-4 mr-1" />
          ) : (
            <Check className="w-4 h-4 mr-1" />
          )}
          {isStepCompleted ? "Mark Incomplete" : "Mark Complete"}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNext}
          disabled={currentStep === totalSteps - 1}
          className="border-purple-200"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      
      {stepNames.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {stepNames.map((name, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={`px-2 py-1 text-xs ${
                index === currentStep
                  ? "bg-purple-100 text-purple-700"
                  : completedSteps.includes(index)
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-700"
              }`}
              onClick={() => onSelectStep(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
};

export default LookStepNavigation;
