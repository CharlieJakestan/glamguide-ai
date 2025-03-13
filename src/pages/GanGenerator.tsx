
import React, { useState, useEffect, useRef } from 'react';
import { Download, Loader2, Sparkles } from 'lucide-react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize with a random tip
  useEffect(() => {
    getRandomTip();
  }, []);

  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * MAKEUP_TIPS.length);
    setRandomTip(MAKEUP_TIPS[randomIndex]);
  };

  const generateRandomLook = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);
    getRandomTip(); // Show a new tip with each generation

    try {
      // Generate a random latent vector with 256 values between -1 and 1
      const latentVector = Array.from({ length: 256 }, () => Math.random() * 2 - 1);

      // Call the edge function
      const response = await fetch('https://sohojvlvvhshsxdrhexr.supabase.co/functions/v1/gan-communicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession()}`
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
      
      if (data.error) {
        throw new Error(data.error);
      }

      // data.image should be an array of 196,608 values (256*256*3) in range [-1, 1]
      if (data.image && Array.isArray(data.image) && data.image.length === 196608) {
        renderImageOnCanvas(data.image);
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
    for (let i = 0; i < imageData.length; i++) {
      // Convert [-1, 1] to [0, 255]
      imageDataObj.data[i * 4] = Math.round((imageData[i] + 1) * 127.5);      // R
      imageDataObj.data[i * 4 + 1] = Math.round((imageData[i + 1] + 1) * 127.5); // G
      imageDataObj.data[i * 4 + 2] = Math.round((imageData[i + 2] + 1) * 127.5); // B
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
          
          <div className="flex justify-center mb-6">
            <Button 
              onClick={generateRandomLook}
              disabled={isGenerating}
              className="bg-pink-400 hover:bg-pink-500 text-white font-bold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
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
          
          <div className="text-xs text-gray-400 text-center mt-6">
            Powered by a custom-trained GAN model on makeup datasets.
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GanGenerator;
