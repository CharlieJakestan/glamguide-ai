
import React from 'react';
import { Volume2, VolumeX, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MakeupGuidance } from '@/services/makeupAIService';

interface AIGuidancePanelProps {
  guidance: MakeupGuidance | null;
  isAnalyzing: boolean;
  voiceEnabled: boolean;
  toggleVoiceGuidance: () => void;
  substitutions: Record<string, string[]>;
  region: 'usa' | 'korean' | 'indian' | 'european';
  setRegion: (region: 'usa' | 'korean' | 'indian' | 'european') => void;
}

const AIGuidancePanel: React.FC<AIGuidancePanelProps> = ({
  guidance,
  isAnalyzing,
  voiceEnabled,
  toggleVoiceGuidance,
  substitutions,
  region,
  setRegion
}) => {
  return (
    <div className="mt-6 space-y-4 p-4 bg-purple-50 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-purple-700">
          AI Makeup Guidance
        </h3>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVoiceGuidance}
            className={voiceEnabled ? "bg-purple-100" : ""}
          >
            {voiceEnabled ? (
              <Volume2 className="h-4 w-4 mr-2" />
            ) : (
              <VolumeX className="h-4 w-4 mr-2" />
            )}
            {voiceEnabled ? "Voice On" : "Voice Off"}
          </Button>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Style:</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as any)}
              className="text-sm border rounded p-1"
            >
              <option value="usa">USA</option>
              <option value="korean">Korean</option>
              <option value="indian">Indian</option>
              <option value="european">European</option>
            </select>
          </div>
        </div>
      </div>
      
      {isAnalyzing && !guidance && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700 mr-2"></div>
          <span className="text-purple-700">Analyzing your makeup application...</span>
        </div>
      )}
      
      {guidance && (
        <div className="p-4 border border-purple-200 rounded-lg bg-white">
          <p className="text-lg font-medium text-gray-800 mb-2">
            {guidance.instruction}
          </p>
          
          {guidance.regionOfFocus && (
            <p className="text-sm text-purple-600 font-medium">
              Focus Area: <span className="font-bold">{guidance.regionOfFocus}</span>
            </p>
          )}
        </div>
      )}
      
      {Object.keys(substitutions).length > 0 && (
        <div className="mt-4 p-3 border border-yellow-200 rounded-lg bg-yellow-50">
          <h4 className="flex items-center text-yellow-800 font-medium mb-2">
            <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
            Product Substitution Suggestions
          </h4>
          <ul className="space-y-2">
            {Object.entries(substitutions).map(([product, alternatives]) => (
              <li key={product} className="text-sm">
                <span className="font-medium text-gray-800">Instead of {product}:</span> Try {alternatives.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-4 p-3 border border-purple-200 rounded-lg bg-white">
        <h4 className="flex items-center text-purple-800 font-medium mb-2">
          <CheckCircle className="h-4 w-4 mr-2 text-purple-600" />
          {region.charAt(0).toUpperCase() + region.slice(1)} Style Tips
        </h4>
        <p className="text-sm text-gray-700">
          {region === 'usa' && "Focus on enhancing features with defined but natural-looking finish. Build coverage gradually and focus on blending for seamless transitions."}
          {region === 'korean' && "Create dewy skin with subtle eye makeup, soft shadows, straight brows, and gradient lips. Layer thin products, pat rather than swipe, focus on luminous finish."}
          {region === 'indian' && "Emphasize defined eyes with kajal, warm tones, and natural-looking lips. Build intensity with layering, focus on eye definition."}
          {region === 'european' && "Create subtle enhancement with focus on complexion, minimal eye makeup, and natural lips. Precision application with strategic placement of products."}
        </p>
      </div>
    </div>
  );
};

export default AIGuidancePanel;
