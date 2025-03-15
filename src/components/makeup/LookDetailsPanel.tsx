
import React from 'react';
import { AlertCircle, List, Palette } from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ReferenceLook } from '@/services/lookReferenceService';

interface LookDetailsPanelProps {
  look: ReferenceLook;
  personalizedRecommendations?: string[];
}

const LookDetailsPanel: React.FC<LookDetailsPanelProps> = ({
  look,
  personalizedRecommendations = []
}) => {
  // Group products by category
  const productsByCategory: Record<string, typeof look.products> = {};
  
  look.products.forEach(product => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = [];
    }
    productsByCategory[product.category].push(product);
  });
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="relative aspect-[4/3] w-full">
        <img 
          src={look.imageUrl} 
          alt={look.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-medium">{look.name}</h3>
          <p className="text-white/80 text-sm">{look.category}</p>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-gray-700 mb-4">{look.description}</p>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="steps">
            <AccordionTrigger className="text-sm font-medium flex items-center">
              <List className="h-4 w-4 mr-2" />
              Application Steps
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {look.steps.map((step, index) => (
                  <div key={index} className="border-l-2 border-purple-200 pl-3 py-1">
                    <p className="text-sm font-medium">{index + 1}. {step.instruction}</p>
                    <p className="text-xs text-gray-500">{step.technique}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="products">
            <AccordionTrigger className="text-sm font-medium flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              Products Used
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {Object.entries(productsByCategory).map(([category, products]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-purple-700 mb-1">{category}</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {products.map((product, index) => (
                        <li key={index}>{product.name} {product.shade ? `(${product.shade})` : ''}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {personalizedRecommendations && personalizedRecommendations.length > 0 && (
            <AccordionItem value="recommendations">
              <AccordionTrigger className="text-sm font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Personalized Tips
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {personalizedRecommendations.map((rec, index) => (
                      <li key={index} className="mb-1">{rec}</li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </div>
  );
};

export default LookDetailsPanel;
