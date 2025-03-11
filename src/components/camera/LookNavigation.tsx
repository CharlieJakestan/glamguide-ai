
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MakeupLook } from '@/types/makeup';

interface LookNavigationProps {
  currentLook: MakeupLook | null;
  looksCount: number;
  onNavigate: (direction: 'next' | 'prev') => void;
}

const LookNavigation: React.FC<LookNavigationProps> = ({
  currentLook,
  looksCount,
  onNavigate,
}) => {
  if (!currentLook) return null;
  
  return (
    <div className="flex items-center justify-between mb-4">
      <Button
        variant="outline"
        onClick={() => onNavigate('prev')}
        disabled={looksCount <= 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous Look
      </Button>
      
      <h3 className="text-xl font-semibold text-purple-700">
        {currentLook.name}
      </h3>
      
      <Button
        variant="outline"
        onClick={() => onNavigate('next')}
        disabled={looksCount <= 1}
        className="flex items-center gap-1"
      >
        Next Look
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default LookNavigation;
