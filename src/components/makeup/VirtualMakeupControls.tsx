
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface VirtualMakeupControlsProps {
  onApplyMakeup: (config: any) => void;
  currentMakeup: {
    lipstick?: { color: string; opacity: number; };
    eyeshadow?: { color: string; intensity: number; };
    foundation?: { color: string; coverage: number; };
    blush?: { color: string; intensity: number; position: { x: number; y: number; } };
    eyeliner?: { color: string; thickness: number; };
    mascara?: { intensity: number; };
    eyebrows?: { color: string; thickness: number; shape: string; };
  };
}

const VirtualMakeupControls: React.FC<VirtualMakeupControlsProps> = ({
  onApplyMakeup,
  currentMakeup
}) => {
  const [activeTab, setActiveTab] = useState('lipstick');
  const [lipstickColor, setLipstickColor] = useState(currentMakeup.lipstick?.color || '#ff6b81');
  const [lipstickOpacity, setLipstickOpacity] = useState(currentMakeup.lipstick?.opacity || 0.8);
  const [eyeshadowColor, setEyeshadowColor] = useState(currentMakeup.eyeshadow?.color || '#9966cc');
  const [eyeshadowIntensity, setEyeshadowIntensity] = useState(currentMakeup.eyeshadow?.intensity || 0.6);
  const [foundationColor, setFoundationColor] = useState(currentMakeup.foundation?.color || '#ffdbac');
  const [foundationCoverage, setFoundationCoverage] = useState(currentMakeup.foundation?.coverage || 0.9);
  const [blushColor, setBlushColor] = useState(currentMakeup.blush?.color || '#ff9999');
  const [blushIntensity, setBlushIntensity] = useState(currentMakeup.blush?.intensity || 0.5);
  
  const handleApplyLipstick = () => {
    onApplyMakeup({ lipstick: { color: lipstickColor, opacity: lipstickOpacity } });
  };
  
  const handleApplyEyeshadow = () => {
    onApplyMakeup({ eyeshadow: { color: eyeshadowColor, intensity: eyeshadowIntensity } });
  };
  
  const handleApplyFoundation = () => {
    onApplyMakeup({ foundation: { color: foundationColor, coverage: foundationCoverage } });
  };
  
  const handleApplyBlush = () => {
    onApplyMakeup({ blush: { color: blushColor, intensity: blushIntensity, position: { x: 0, y: 0 } } });
  };
  
  return (
    <div className="w-full">
      <h3 className="font-medium text-lg mb-2">Virtual Makeup</h3>
      
      <Tabs defaultValue="lipstick" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-2">
          <TabsTrigger value="lipstick">Lipstick</TabsTrigger>
          <TabsTrigger value="eyeshadow">Eyeshadow</TabsTrigger>
          <TabsTrigger value="foundation">Foundation</TabsTrigger>
          <TabsTrigger value="blush">Blush</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lipstick" className="space-y-3">
          <div>
            <Label htmlFor="lipstick-color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="lipstick-color"
                type="color"
                value={lipstickColor}
                onChange={(e) => setLipstickColor(e.target.value)}
                className="h-8 w-8 border rounded"
              />
              <span className="text-sm font-mono">{lipstickColor}</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="lipstick-opacity">Opacity</Label>
            <Slider
              id="lipstick-opacity"
              min={0}
              max={1}
              step={0.01}
              value={[lipstickOpacity]}
              onValueChange={(values) => setLipstickOpacity(values[0])}
              className="my-2"
            />
            <div className="text-xs text-right">{Math.round(lipstickOpacity * 100)}%</div>
          </div>
          
          <Button onClick={handleApplyLipstick} className="w-full">Apply Lipstick</Button>
        </TabsContent>
        
        <TabsContent value="eyeshadow" className="space-y-3">
          <div>
            <Label htmlFor="eyeshadow-color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="eyeshadow-color"
                type="color"
                value={eyeshadowColor}
                onChange={(e) => setEyeshadowColor(e.target.value)}
                className="h-8 w-8 border rounded"
              />
              <span className="text-sm font-mono">{eyeshadowColor}</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="eyeshadow-intensity">Intensity</Label>
            <Slider
              id="eyeshadow-intensity"
              min={0}
              max={1}
              step={0.01}
              value={[eyeshadowIntensity]}
              onValueChange={(values) => setEyeshadowIntensity(values[0])}
              className="my-2"
            />
            <div className="text-xs text-right">{Math.round(eyeshadowIntensity * 100)}%</div>
          </div>
          
          <Button onClick={handleApplyEyeshadow} className="w-full">Apply Eyeshadow</Button>
        </TabsContent>
        
        <TabsContent value="foundation" className="space-y-3">
          <div>
            <Label htmlFor="foundation-color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="foundation-color"
                type="color"
                value={foundationColor}
                onChange={(e) => setFoundationColor(e.target.value)}
                className="h-8 w-8 border rounded"
              />
              <span className="text-sm font-mono">{foundationColor}</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="foundation-coverage">Coverage</Label>
            <Slider
              id="foundation-coverage"
              min={0}
              max={1}
              step={0.01}
              value={[foundationCoverage]}
              onValueChange={(values) => setFoundationCoverage(values[0])}
              className="my-2"
            />
            <div className="text-xs text-right">{Math.round(foundationCoverage * 100)}%</div>
          </div>
          
          <Button onClick={handleApplyFoundation} className="w-full">Apply Foundation</Button>
        </TabsContent>
        
        <TabsContent value="blush" className="space-y-3">
          <div>
            <Label htmlFor="blush-color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="blush-color"
                type="color"
                value={blushColor}
                onChange={(e) => setBlushColor(e.target.value)}
                className="h-8 w-8 border rounded"
              />
              <span className="text-sm font-mono">{blushColor}</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="blush-intensity">Intensity</Label>
            <Slider
              id="blush-intensity"
              min={0}
              max={1}
              step={0.01}
              value={[blushIntensity]}
              onValueChange={(values) => setBlushIntensity(values[0])}
              className="my-2"
            />
            <div className="text-xs text-right">{Math.round(blushIntensity * 100)}%</div>
          </div>
          
          <Button onClick={handleApplyBlush} className="w-full">Apply Blush</Button>
        </TabsContent>
      </Tabs>
      
      <Button 
        onClick={() => onApplyMakeup({
          lipstick: { color: lipstickColor, opacity: lipstickOpacity },
          eyeshadow: { color: eyeshadowColor, intensity: eyeshadowIntensity },
          foundation: { color: foundationColor, coverage: foundationCoverage },
          blush: { color: blushColor, intensity: blushIntensity, position: { x: 0, y: 0 } }
        })}
        className="w-full mt-3"
        variant="default"
      >
        Apply All Makeup
      </Button>
    </div>
  );
};

export default VirtualMakeupControls;
