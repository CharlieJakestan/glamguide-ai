
import React from 'react';
import { Volume2 } from 'lucide-react';

interface FacialAnalysisDisplayProps {
  detectedFacialTraits: {
    skinTone: string;
    faceShape: string;
    features: string[];
    recommendations: string[];
  } | null;
  voiceEnabled: boolean;
  analysisImage: string | null;
}

const FacialAnalysisDisplay: React.FC<FacialAnalysisDisplayProps> = ({
  detectedFacialTraits,
  voiceEnabled,
  analysisImage
}) => {
  if (!detectedFacialTraits) return null;
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {analysisImage && (
          <div className="w-full md:w-1/3">
            <div className="relative rounded-lg overflow-hidden bg-white shadow-sm">
              <img 
                src={analysisImage} 
                alt="Analyzed face" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute top-2 right-2 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                AI Analysis
              </div>
            </div>
          </div>
        )}
        
        <div className="w-full md:w-2/3">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
            <Volume2 className={`h-4 w-4 ${voiceEnabled ? 'text-purple-600' : 'text-gray-400'} mr-2`} />
            Your Facial Analysis Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded shadow-sm">
              <h4 className="font-medium text-purple-700 mb-1">Detected Features</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-purple-900 font-medium w-24">Skin Tone:</span>
                  <span className="text-purple-800">{detectedFacialTraits.skinTone}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-purple-900 font-medium w-24">Face Shape:</span>
                  <span className="text-purple-800">{detectedFacialTraits.faceShape}</span>
                </div>
              </div>
              
              <h4 className="font-medium text-purple-700 mt-3 mb-1">Distinctive Features</h4>
              <ul className="list-disc list-inside text-purple-800 text-sm">
                {detectedFacialTraits.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-3 rounded shadow-sm">
              <h4 className="font-medium text-purple-700 mb-2">Personalized Recommendations</h4>
              <ul className="space-y-2">
                {detectedFacialTraits.recommendations.map((rec, index) => (
                  <li key={index} className="flex">
                    <span className="text-pink-500 mr-2">✦</span>
                    <span className="text-purple-800 text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-purple-600 italic">
            These analysis results will be used to personalize your makeup guidance.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacialAnalysisDisplay;
