
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FaceTraitsDisplayProps {
  facialTraits?: {
    skinTone?: string;
    faceShape?: string;
    features?: string[];
    recommendations?: string[];
  };
}

const FaceTraitsDisplay: React.FC<FaceTraitsDisplayProps> = ({ facialTraits }) => {
  if (!facialTraits) return null;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-sm mb-2">Skin Tone</h4>
        <Badge variant="outline">{facialTraits.skinTone || 'Not detected'}</Badge>
      </div>
      <div>
        <h4 className="font-medium text-sm mb-2">Face Shape</h4>
        <Badge variant="outline">{facialTraits.faceShape || 'Not detected'}</Badge>
      </div>
      {facialTraits.features && facialTraits.features.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2">Facial Features</h4>
          <div className="flex flex-wrap gap-2">
            {facialTraits.features.map((feature, index) => (
              <Badge key={index} variant="secondary">{feature}</Badge>
            ))}
          </div>
        </div>
      )}
      {facialTraits.recommendations && facialTraits.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2">Makeup Recommendations</h4>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {facialTraits.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FaceTraitsDisplay;
