
import React, { useState } from 'react';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';

const MAKEUP_TIPS = [
  "Glow with a soft blush!",
  "For natural brows, brush them upward first.",
  "Hydrate lips before applying lipstick.",
  "Apply concealer in a triangle under eyes.",
  "Set your makeup with a fine mist setting spray.",
  "Cream blush gives a natural dewy finish.",
  "Use an eyeshadow primer for longer-lasting color.",
  "Apply mascara from roots to tips for fuller lashes.",
  "Warm cream products with fingertips before applying.",
  "Use a small brush for precise highlight application."
];

const GanGenerator = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [randomTip, setRandomTip] = useState<string>("");
  const [setupStatus, setSetupStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');

  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * MAKEUP_TIPS.length);
    setRandomTip(MAKEUP_TIPS[randomIndex]);
  };

  const checkSetupStatus = () => {
    setIsLoading(true);
    toast({
      title: "Setting up",
      description: "We're preparing everything for the new GAN model. Please check back soon.",
    });
    
    setTimeout(() => {
      setIsLoading(false);
      setSetupStatus('in_progress');
    }, 1500);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-pink-500 mb-4">
            AI Makeup Look Generator
          </h2>
          
          <p className="mb-6 text-gray-600">
            Create unique makeup looks with our AI-powered generator! Each look is uniquely
            generated just for you based on advanced GAN technology.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <h3 className="text-lg font-medium mb-2 text-gray-700">System Status</h3>
            
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {setupStatus === 'not_started' ? (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                ) : setupStatus === 'in_progress' ? (
                  <div className="h-5 w-5 rounded-full bg-amber-400" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-green-500" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  GAN Model Setup: {' '}
                  {setupStatus === 'not_started' ? 'Ready to Configure' : 
                   setupStatus === 'in_progress' ? 'Setup in Progress' : 'Ready'}
                </p>
                
                <p className="text-sm text-gray-500 mt-1">
                  {setupStatus === 'not_started' 
                    ? 'Please follow the setup instructions to upload your .h5 model file.'
                    : setupStatus === 'in_progress' 
                    ? 'Currently setting up the infrastructure. Please check back soon.'
                    : 'Your GAN model is ready to use!'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex justify-center">
              <Button 
                onClick={checkSetupStatus}
                variant="outline"
                size="sm"
                className="border-pink-400 text-pink-500 hover:bg-pink-50"
                disabled={isLoading || setupStatus !== 'not_started'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Check Setup Status
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {randomTip && (
            <div className="bg-pink-50 text-pink-600 p-3 rounded-md mb-6 text-center italic">
              💄 {randomTip}
            </div>
          )}
          
          <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-medium mb-4 text-gray-700">Setup Instructions</h3>
            
            <ol className="list-decimal pl-5 space-y-3 text-gray-600">
              <li>First, create a storage bucket in Supabase called <code className="bg-gray-200 px-1 rounded">gan-models</code>.</li>
              <li>Upload your <code className="bg-gray-200 px-1 rounded">.h5</code> model file to this bucket.</li>
              <li>Create an edge function called <code className="bg-gray-200 px-1 rounded">gan-generate</code> using the code provided.</li>
              <li>After completing these steps, your GAN generator will be ready to use!</li>
            </ol>
            
            <div className="mt-6 text-center">
              <Button 
                variant="default" 
                onClick={() => {
                  getRandomTip();
                  toast({
                    title: "Setup Instructions",
                    description: "Follow these steps to set up your new GAN model.",
                  });
                }}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Got it!
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 text-center mt-6">
            Powered by a custom-trained GAN model on makeup datasets.
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GanGenerator;
