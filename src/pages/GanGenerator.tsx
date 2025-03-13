
import React, { useState, useEffect, useRef } from 'react';
import { Download, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Makeup tips for randomly displaying
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

// These will be used for future conditional GAN inputs
const LOOK_CATEGORIES = ["Natural", "Glam", "Editorial", "Vintage", "Artistic"];
const SKIN_TONES = ["Light", "Medium", "Deep"];
const SKIN_TYPES = ["Dry", "Combination", "Oily"];
const FACE_SHAPES = ["Oval", "Round", "Square", "Heart"];

const GanGenerator = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [randomTip, setRandomTip] = useState<string>("");
  const [generationCount, setGenerationCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelStatus, setModelStatus] = useState<'checking' | 'ready' | 'error'>('checking');

  // Check if the model exists in Supabase storage
  useEffect(() => {
    const checkModelStatus = async () => {
      try {
        // Check if the edge function is accessible
        const response = await fetch('https://sohojvlvvhshsxdrhexr.supabase.co/functions/v1/gan-communicate', {
          method: 'OPTIONS',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          setModelStatus('ready');
          console.log('GAN model and edge function are available');
          // Get a random tip on initial load
          getRandomTip();
        } else {
          setModelStatus('error');
          console.error('Edge function does not appear to be accessible');
          toast({
            title: "Connectivity Issue",
            description: "Unable to connect to the GAN service. Please try again later.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking model status:', error);
        setModelStatus('error');
        toast({
          title: "Model Check Failed",
          description: "We couldn't verify if the AI model is ready. The system might be temporarily unavailable.",
          variant: "destructive",
        });
      }
    };

    checkModelStatus();
  }, [toast]);

  // Initialize with a random tip
  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * MAKEUP_TIPS.length);
    setRandomTip(MAKEUP_TIPS[randomIndex]);
  };

  const generateRandomLook = async () => {
    if (modelStatus !== 'ready') {
      toast({
        title: "System Not Ready",
        description: "The AI model is not ready yet. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    getRandomTip(); // Show a new tip with each generation

    try {
      // Generate a random latent vector with 256 values between -1 and 1
      const latentVector = Array.from({ length: 256 }, () => Math.random() * 2 - 1);

      console.log('Sending request to GAN edge function...');
      // Call the edge function
      const response = await fetch('https://sohojvlvvhshsxdrhexr.supabase.co/functions/v1/gan-communicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
        },
        body: JSON.stringify({ 
          latentVector,
          // Future parameters:
          // lookCategory: lookCategory,
          // skinTone: skinTone,
          // skinType: skinType,
          // faceShape: faceShape
        })
      });

      if (!response.ok) {
        throw new Error(`Error from GAN service: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response from GAN edge function');
      
      if (data.error) {
        throw new Error(data.error);
      }

      // data.image should be an array of 196,608 values (256*256*3) in range [-1, 1]
      if (data.image && Array.isArray(data.image) && data.image.length === 196608) {
        console.log('Rendering image on canvas...');
        renderImageOnCanvas(data.image);
        setGenerationCount(prev => prev + 1);
        toast({
          title: "Look Generated!",
          description: "Your unique AI makeup look has been created.",
        });
      } else {
        throw new Error('Invalid image data received from the server');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Oops! Something went wrong",
        description: error instanceof Error ? error.message : "Failed to generate makeup look. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderImageOnCanvas = (imageData: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 256;
    const height = 256;
    const imageDataObj = ctx.createImageData(width, height);
    
    // Convert from [-1, 1] to [0, 255] range
    for (let i = 0; i < imageData.length / 3; i++) {
      const r = Math.round((imageData[i * 3] + 1) * 127.5);
      const g = Math.round((imageData[i * 3 + 1] + 1) * 127.5);
      const b = Math.round((imageData[i * 3 + 2] + 1) * 127.5);
      
      imageDataObj.data[i * 4] = r;       // R
      imageDataObj.data[i * 4 + 1] = g;   // G
      imageDataObj.data[i * 4 + 2] = b;   // B
      imageDataObj.data[i * 4 + 3] = 255; // Alpha (fully opaque)
    }

    ctx.putImageData(imageDataObj, 0, 0);
    
    // Store the canvas as a data URL
    setGeneratedImage(canvas.toDataURL('image/png'));
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `makeup-look-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Image Downloaded!",
      description: "Your unique makeup look has been saved to your device.",
    });
  };

  const retryConnection = () => {
    setModelStatus('checking');
    // The useEffect will run again and check the connection
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
          
          {modelStatus === 'error' ? (
            <div className="text-center mb-6">
              <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
                Unable to connect to the AI model. The service might be temporarily unavailable.
              </div>
              <Button 
                onClick={retryConnection}
                variant="outline"
                className="border-pink-400 text-pink-500 hover:bg-pink-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <Button 
                  onClick={generateRandomLook}
                  disabled={isGenerating || modelStatus !== 'ready'}
                  variant="pink"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : modelStatus === 'checking' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking Model...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Random Look
                    </>
                  )}
                </Button>
              </div>
              
              {randomTip && (
                <div className="bg-pink-50 text-pink-600 p-3 rounded-md mb-6 text-center italic">
                  💄 {randomTip}
                </div>
              )}
              
              <div className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto mb-6" style={{ width: '256px', height: '256px' }}>
                <canvas 
                  ref={canvasRef}
                  width={256}
                  height={256}
                  className="w-full h-full"
                />
                
                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="animate-pulse text-white font-bold">Creating magic...</div>
                  </div>
                )}
                
                {!generatedImage && !isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-400 text-center px-4">
                      Your AI-generated makeup look will appear here
                    </p>
                  </div>
                )}
              </div>
              
              {generatedImage && (
                <div className="flex justify-center mb-6">
                  <Button 
                    onClick={downloadImage}
                    variant="outline"
                    className="text-pink-500 border-pink-500 hover:bg-pink-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Image
                  </Button>
                </div>
              )}
            </>
          )}
          
          <div className="text-xs text-gray-400 text-center mt-6">
            Powered by a custom-trained GAN model on makeup datasets.
            {generationCount > 0 && ` Generated ${generationCount} unique look${generationCount !== 1 ? 's' : ''} in this session.`}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GanGenerator;
