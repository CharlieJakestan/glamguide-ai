
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMakeupAnalysis } from '@/hooks/useMakeupAnalysis';

interface MakeupRecommendationsProps {
  occasion?: string;
  region?: string;
  style?: string;
  colorPalette?: string;
}

export const MakeupRecommendations: React.FC<MakeupRecommendationsProps> = ({
  occasion,
  region,
  style,
  colorPalette
}) => {
  const { recommendations, isAnalyzing, error, analyzeMakeup } = useMakeupAnalysis();

  React.useEffect(() => {
    if (occasion && region && style && colorPalette) {
      analyzeMakeup(occasion, region, style, colorPalette);
    }
  }, [occasion, region, style, colorPalette]);

  if (isAnalyzing) {
    return (
      <Card className="p-4">
        <p className="text-gray-600">Analyzing makeup recommendations...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-200">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  if (!recommendations) {
    return null;
  }

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Recommended Look</h3>
        <Badge variant="secondary">{recommendations.makeup_look}</Badge>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Color Tips</h3>
        <p className="text-gray-700">{recommendations.color_tips}</p>
      </div>
    </Card>
  );
};
