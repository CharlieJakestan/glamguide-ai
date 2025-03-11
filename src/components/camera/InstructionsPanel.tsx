
import React from 'react';
import { ApplicationStep } from '@/types/makeup';

interface InstructionsPanelProps {
  instructions: ApplicationStep[];
}

const InstructionsPanel: React.FC<InstructionsPanelProps> = ({ instructions }) => {
  if (!instructions || instructions.length === 0) return null;
  
  return (
    <div className="mt-6 p-4 bg-purple-50 rounded-lg">
      <h3 className="text-lg font-semibold text-purple-700 mb-2">
        How to Apply This Look
      </h3>
      
      <ol className="list-decimal list-inside space-y-2">
        {instructions.map((instruction, index) => (
          <li key={index} className="text-gray-700">
            {instruction.description}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default InstructionsPanel;
