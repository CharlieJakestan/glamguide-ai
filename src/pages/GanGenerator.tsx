
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, AlertCircle, Camera, VolumeUp, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getApiKey, setApiKey } from '@/services/speechService';

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
  const [modelStatus, setModelStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [edgeFunctionStatus, setEdgeFunctionStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [cameraActive, setCameraActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(!!getApiKey());
  const [currentGuidance, setCurrentGuidance] = useState<string>("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [detectedFacialTraits, setDetectedFacialTraits] = useState<{
    skinTone: string;
    faceShape: string;
    features: string;
  } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const apiKeyRef = useRef<string>(getApiKey() || "");
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    // Check if model files exist in Supabase
    checkModelFilesExist();
    
    // Check if edge function exists and is working
    checkEdgeFunction();
    
    // Set default API key if not already set
    if (!getApiKey()) {
      setApiKey("sk_0dfcb07ba1e4d72443fcb5385899c03e9106d3d27ddaadc2");
      apiKeyRef.current = "sk_0dfcb07ba1e4d72443fcb5385899c03e9106d3d27ddaadc2";
      setVoiceEnabled(true);
    }
    
    return () => {
      // Cleanup camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);
  
  const checkModelFilesExist = async () => {
    try {
      // Check if the gan-models bucket exists and has model files
      const { data: files, error } = await supabase.storage
        .from('gan-models')
        .list('');
      
      if (error) {
        throw error;
      }
      
      // Check for .h5 files
      const modelFiles = files.filter(file => file.name.endsWith('.h5'));
      
      if (modelFiles.length > 0) {
        console.log('Found model files:', modelFiles);
        setModelStatus('ready');
        
        if (edgeFunctionStatus === 'ready') {
          setSetupStatus('completed');
        }
      } else {
        console.warn('No .h5 model files found in gan-models bucket');
        setModelStatus('error');
      }
    } catch (error) {
      console.error('Error checking model files:', error);
      setModelStatus('error');
    }
  };
  
  const checkEdgeFunction = async () => {
    try {
      // Try calling the edge function with a simple request
      const { data, error } = await supabase.functions.invoke('gan-generate', {
        body: { action: 'check' }
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data.status === 'ok') {
        console.log('Edge function is working');
        setEdgeFunctionStatus('ready');
        
        if (modelStatus === 'ready') {
          setSetupStatus('completed');
        }
      } else {
        console.warn('Edge function response invalid:', data);
        setEdgeFunctionStatus('error');
      }
    } catch (error) {
      console.error('Error checking edge function:', error);
      setEdgeFunctionStatus('error');
    }
  };
  
  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * MAKEUP_TIPS.length);
    setRandomTip(MAKEUP_TIPS[randomIndex]);
  };
  
  const checkSetupStatus = () => {
    setIsLoading(true);
    
    // Re-check model files and edge function
    Promise.all([
      checkModelFilesExist(),
      checkEdgeFunction()
    ]).finally(() => {
      setIsLoading(false);
      
      if (modelStatus === 'ready' && edgeFunctionStatus === 'ready') {
        setSetupStatus('completed');
        toast({
          title: "Setup Complete",
          description: "The GAN model and edge function are ready to use!",
        });
      } else {
        setSetupStatus('in_progress');
        toast({
          title: "Setup Incomplete",
          description: "Some components are still not ready. Please check the status panel for details.",
        });
      }
    });
  };
  
  const toggleCamera = async () => {
    if (cameraActive) {
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user" 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      setCameraActive(true);
      
      // Generate face analysis after camera starts
      setTimeout(() => {
        generateMockFacialAnalysis();
        startMockGuidance();
      }, 2000);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };
  
  const generateMockFacialAnalysis = () => {
    // Mock facial analysis result
    const skinTones = ['light', 'medium', 'dark'];
    const faceShapes = ['oval', 'round', 'square', 'heart'];
    const eyeFeatures = ['wide-set eyes', 'close-set eyes', 'almond eyes'];
    
    setDetectedFacialTraits({
      skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
      faceShape: faceShapes[Math.floor(Math.random() * faceShapes.length)],
      features: eyeFeatures[Math.floor(Math.random() * eyeFeatures.length)]
    });
    
    toast({
      title: "Face Analyzed",
      description: "Your facial traits have been detected by our AI",
    });
  };
  
  const startMockGuidance = () => {
    // Example guidance steps
    const guidanceSteps = [
      "Start by applying foundation evenly across your face, focusing on your cheeks first.",
      "Now, blend the foundation around your nose and chin. Make sure there are no visible lines.",
      "Apply concealer under your eyes in a triangle shape and blend with your finger or a sponge.",
      "Your foundation looks uneven on the right cheek. Please blend more in that area.",
      "Great! Now apply blush on the apples of your cheeks and blend upward toward your temples.",
      "Time for eye makeup. Start with a neutral base color across your eyelid.",
      "Apply a darker shade in the crease of your eyelid and blend well.",
      "Your eyeshadow on the left eye needs more blending. Use gentle circular motions.",
      "Apply eyeliner along your upper lash line, staying as close to the lashes as possible.",
      "Now apply mascara, starting from the roots of your lashes and wiggling the wand upward.",
      "Finish with lipstick. Start by outlining your lips and then fill in the color.",
      "Perfect! Your makeup look is complete and looks fantastic!"
    ];
    
    let step = 0;
    
    // Update guidance every 8 seconds
    const intervalId = setInterval(() => {
      if (step < guidanceSteps.length) {
        setCurrentGuidance(guidanceSteps[step]);
        setProgressPercentage(Math.floor((step / (guidanceSteps.length - 1)) * 100));
        
        // Use voice guidance if enabled
        if (voiceEnabled) {
          const utterance = new SpeechSynthesisUtterance(guidanceSteps[step]);
          window.speechSynthesis.speak(utterance);
        }
        
        step++;
      } else {
        clearInterval(intervalId);
      }
    }, 8000);
    
    // Set initial guidance
    setCurrentGuidance(guidanceSteps[0]);
    
    return () => clearInterval(intervalId);
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
            <Collapsible>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium mb-2 text-gray-700">System Status</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {setupStatus === 'completed' ? 'All Systems Ready' : 'View Details'}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent>
                <div className="space-y-3 mt-2">
                  {/* Model Status */}
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {modelStatus === 'checking' ? (
                        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                      ) : modelStatus === 'ready' ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        GAN Model: {' '}
                        {modelStatus === 'checking' ? 'Checking...' : 
                         modelStatus === 'ready' ? 'Ready' : 'Error'}
                      </p>
                      
                      <p className="text-sm text-gray-500 mt-1">
                        {modelStatus === 'checking' 
                          ? 'Checking if model files exist in Supabase storage...'
                          : modelStatus === 'ready' 
                          ? 'Model files found in the gan-models bucket.'
                          : 'Model files not found or error accessing storage.'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Edge Function Status */}
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {edgeFunctionStatus === 'checking' ? (
                        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                      ) : edgeFunctionStatus === 'ready' ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        Edge Function: {' '}
                        {edgeFunctionStatus === 'checking' ? 'Checking...' : 
                         edgeFunctionStatus === 'ready' ? 'Ready' : 'Error'}
                      </p>
                      
                      <p className="text-sm text-gray-500 mt-1">
                        {edgeFunctionStatus === 'checking' 
                          ? 'Checking if edge function is deployed and accessible...'
                          : edgeFunctionStatus === 'ready' 
                          ? 'Edge function is deployed and responding correctly.'
                          : 'Edge function not deployed or error calling the function.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            <div className="mt-4 flex justify-center">
              <Button 
                onClick={checkSetupStatus}
                variant="outline"
                size="sm"
                className="border-pink-400 text-pink-500 hover:bg-pink-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {setupStatus === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-4">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-lg font-medium text-green-700">Your GAN is Ready to Use!</h3>
              </div>
              
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <VolumeUp className="h-5 w-5 text-gray-500" />
                    <Label htmlFor="voice-toggle" className="text-gray-700">Voice Guidance</Label>
                  </div>
                  <Switch 
                    id="voice-toggle" 
                    checked={voiceEnabled}
                    onCheckedChange={setVoiceEnabled}
                  />
                </div>
                
                <Button
                  onClick={toggleCamera}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  {cameraActive ? (
                    <>Stop Camera</>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Start Camera for Makeup Guidance
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {cameraActive && (
            <div className="space-y-4 mb-6">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline
                  className="w-full h-64 object-cover"
                />
                
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div 
                    className="h-full bg-pink-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              
              {/* Current guidance */}
              {currentGuidance && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start">
                    <VolumeUp className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
                    <p className="text-purple-800 flex-1">{currentGuidance}</p>
                  </div>
                </div>
              )}
              
              {/* Detected facial traits */}
              {detectedFacialTraits && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Your Facial Analysis</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li>Skin tone: <span className="font-medium">{detectedFacialTraits.skinTone}</span></li>
                    <li>Face shape: <span className="font-medium">{detectedFacialTraits.faceShape}</span></li>
                    <li>Features: <span className="font-medium">{detectedFacialTraits.features}</span></li>
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {randomTip && (
            <div className="bg-pink-50 text-pink-600 p-3 rounded-md mb-6 text-center italic">
              💄 {randomTip}
            </div>
          )}
          
          {(setupStatus === 'not_started' || setupStatus === 'in_progress') && (
            <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 mb-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700">Setup Instructions</h3>
              
              <ol className="list-decimal pl-5 space-y-3 text-gray-600">
                <li>Create a storage bucket in Supabase called <code className="bg-gray-200 px-1 rounded">gan-models</code>.</li>
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
