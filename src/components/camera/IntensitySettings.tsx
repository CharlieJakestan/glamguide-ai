
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { MakeupProduct } from '@/types/makeup';

interface ProductWithIntensity {
  id: string;
  name: string;
  category: string;
  intensity: number;
}

interface IntensitySettingsProps {
  products: ProductWithIntensity[];
  onIntensityChange: (productId: string, value: number[]) => void;
}

const IntensitySettings: React.FC<IntensitySettingsProps> = ({
  products,
  onIntensityChange,
}) => {
  if (products.length === 0) return null;
  
  return (
    <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-purple-700 mb-2">
        Adjust Product Intensity
      </h3>
      
      {products.map(product => (
        <div key={product.id} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{product.name}</span>
            <span className="text-sm text-gray-500">
              {Math.round(product.intensity * 100)}%
            </span>
          </div>
          <Slider
            value={[product.intensity]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(value) => onIntensityChange(product.id, value)}
          />
        </div>
      ))}
    </div>
  );
};

export default IntensitySettings;
