import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Thermometer, Droplets } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  shade?: string;
}

interface LocationWeatherData {
  location: {
    city?: string;
    country?: string;
  } | null;
  weather: {
    temperature: number;
    humidity: number;
    condition: string;
    description: string;
  } | null;
}

interface ApplicationGuidanceProps {
  selectedLook: {
    name: string;
    instructions: { step: number; description: string; }[];
  };
  userProducts: Product[];
  skinConditions: string[];
  allergies: string;
  skinType: string;
  locationWeather: LocationWeatherData;
}

const ApplicationGuidance: React.FC<ApplicationGuidanceProps> = ({
  selectedLook,
  userProducts,
  skinConditions,
  allergies,
  skinType,
  locationWeather
}) => {
  const getWeatherAdjustedTips = () => {
    if (!locationWeather.weather) return [];
    
    const { temperature, humidity, condition } = locationWeather.weather;
    const tips = [];

    if (temperature > 30) {
      tips.push("Use long-wearing, heat-resistant formulas");
      tips.push("Apply setting spray for extra durability");
    } else if (temperature < 10) {
      tips.push("Use hydrating products to combat dry air");
      tips.push("Consider cream formulas over powders");
    }

    if (humidity > 70) {
      tips.push("Use waterproof mascara and eyeliner");
      tips.push("Apply primer to prevent makeup from sliding");
    } else if (humidity < 30) {
      tips.push("Add extra moisturizer before makeup");
      tips.push("Use hydrating setting mist");
    }

    if (condition === 'rain') {
      tips.push("Focus on waterproof formulas");
      tips.push("Keep touch-up products handy");
    }

    return tips;
  };

  const getSkinTypeAdjustments = () => {
    const adjustments = [];
    
    switch (skinType) {
      case 'oily':
        adjustments.push("Use oil-free primer and foundation");
        adjustments.push("Set with translucent powder");
        break;
      case 'dry':
        adjustments.push("Use hydrating primer and cream products");
        adjustments.push("Avoid powder-heavy techniques");
        break;
      case 'sensitive':
        adjustments.push("Use gentle, fragrance-free products");
        adjustments.push("Test products on small area first");
        break;
      case 'combination':
        adjustments.push("Use different products for T-zone and cheeks");
        adjustments.push("Blot T-zone before powder application");
        break;
    }

    return adjustments;
  };

  const getMedicalConsiderations = () => {
    if (skinConditions.length === 0 && !allergies) return [];
    
    const considerations = [];
    
    if (skinConditions.includes('Acne')) {
      considerations.push("Use non-comedogenic products only");
      considerations.push("Clean brushes thoroughly between uses");
    }
    
    if (skinConditions.includes('Rosacea')) {
      considerations.push("Avoid alcohol-based products");
      considerations.push("Use gentle application techniques");
    }
    
    if (skinConditions.includes('Sensitive Skin')) {
      considerations.push("Patch test new products first");
      considerations.push("Use minimal pressure when applying");
    }
    
    if (allergies.trim()) {
      considerations.push(`Avoid: ${allergies}`);
    }

    return considerations;
  };

  const getProductRecommendations = () => {
    const userCategories = userProducts.map(p => p.category);
    const neededProducts = [];
    
    // Check what's missing for this look
    const essentialCategories = ['Foundation', 'Concealer', 'Mascara', 'Lipstick'];
    
    essentialCategories.forEach(category => {
      if (!userCategories.includes(category)) {
        neededProducts.push(category);
      }
    });

    return neededProducts;
  };

  const weatherTips = getWeatherAdjustedTips();
  const skinAdjustments = getSkinTypeAdjustments();
  const medicalConsiderations = getMedicalConsiderations();
  const missingProducts = getProductRecommendations();

  return (
    <div className="space-y-6">
      {/* Weather & Location Info */}
      {locationWeather.location && locationWeather.weather && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{locationWeather.location.city}, {locationWeather.location.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-red-500" />
                <span className="text-sm">{locationWeather.weather.temperature}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-sm">{locationWeather.weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{locationWeather.weather.description}</span>
              </div>
            </div>
            
            {weatherTips.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Weather-Adjusted Tips:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {weatherTips.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Application Steps */}
      <Card>
        <CardHeader>
          <CardTitle>How to Apply: {selectedLook.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {selectedLook.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3">
                <div className="bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-600 text-sm font-medium">{instruction.step}</span>
                </div>
                <span className="text-gray-700">{instruction.description}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Personalized Adjustments */}
      {skinAdjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Adjustments for {skinType} Skin</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              {skinAdjustments.map((adjustment, index) => (
                <li key={index}>• {adjustment}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Medical Considerations */}
      {medicalConsiderations.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-700">Important Considerations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-orange-600 space-y-1">
              {medicalConsiderations.map((consideration, index) => (
                <li key={index}>⚠️ {consideration}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Product Recommendations */}
      {missingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Consider adding these products to complete the look:</p>
            <div className="flex flex-wrap gap-2">
              {missingProducts.map((product, index) => (
                <Badge key={index} variant="outline">{product}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Products */}
      {userProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Available Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {userProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">{product.name}</span>
                  <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApplicationGuidance;