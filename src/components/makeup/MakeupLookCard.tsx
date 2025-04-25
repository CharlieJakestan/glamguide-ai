
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MakeupLook {
  id: string;
  name: string;
  description: string;
  style: 'natural' | 'glam' | 'bold';
  thumbnail: string;
}

interface MakeupLookCardProps {
  look: MakeupLook;
  isSelected: boolean;
  onClick: () => void;
}

const MakeupLookCard: React.FC<MakeupLookCardProps> = ({ 
  look, 
  isSelected, 
  onClick 
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:border-purple-500 ${
        isSelected 
          ? 'border-2 border-purple-500 bg-purple-50' 
          : 'border-gray-200 hover:bg-gray-50'
      }`} 
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex flex-col items-center space-y-2">
          <img 
            src={look.thumbnail} 
            alt={look.name} 
            className="w-full h-24 object-cover rounded-md"
          />
          <div className="text-center">
            <h3 className="font-medium text-sm">{look.name}</h3>
            <Badge 
              variant={isSelected ? 'default' : 'outline'} 
              className="mt-1 text-xs"
            >
              {look.style}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MakeupLookCard;
