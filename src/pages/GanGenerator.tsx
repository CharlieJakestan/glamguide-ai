
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, AlertCircle, Camera, Volume2, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getApiKey, setApiKey } from '@/services/speechService';
import { checkGanFunction, analyzeFacialImage } from '@/services/ganService';
import GanOutput from '@/components/makeup/GanOutput';

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
    features: string[];
    recommendations: string[];
  } | null>(null);
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiKeyRef = useRef<string>(getApiKey() || "");
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    // Set default API key if not already set - this happens ONCE to avoid repeated prompts
    if (!getApiKey()) {
      const defaultKey = "sk_0dfcb07ba1e4d72443fcb5385899c03e9106d3d27ddaadc2";
      setApiKey(defaultKey);
      apiKeyRef.current = defaultKey;
      setVoiceEnabled(true);
      
      toast({
        title: "Voice Guidance Ready",
        description: "ElevenLabs API key has been configured automatically.",
        variant: "default",
      });
    }
    
    // Check if model files exist in Supabase
    checkModelFilesExist();
    
    // Check if edge function exists and is working
    checkEdgeFunctionStatus();
    
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
      // First check the models1 bucket which contains the user's new .h5 files
      const { data: models1Files, error: models1Error } = await supabase.storage
        .from('models1')
        .list('');
      
      if (!models1Error && models1Files && models1Files.length > 0) {
        console.log('Found model files in models1 bucket:', models1Files);
        setModelStatus('ready');
        
        if (edgeFunctionStatus === 'ready') {
          setSetupStatus('completed');
        }
        return;
      }
      
      // Fallback to checking gan-models bucket
      const { data: files, error } = await supabase.storage
        .from('gan-models')
        .list('');
      
      if (error) {
        throw error;
      }
      
      // Check for .h5 files
      const modelFiles = files.filter(file => file.name.endsWith('.h5'));
      
      if (modelFiles.length > 0) {
        console.log('Found model files in gan-models bucket:', modelFiles);
        setModelStatus('ready');
        
        if (edgeFunctionStatus === 'ready') {
          setSetupStatus('completed');
        }
      } else {
        console.warn('No .h5 model files found in either bucket');
        setModelStatus('error');
      }
    } catch (error) {
      console.error('Error checking model files:', error);
      setModelStatus('error');
    }
  };
  
  const checkEdgeFunctionStatus = async () => {
    try {
      const isActive = await checkGanFunction();
      
      if (isActive) {
        console.log('Edge function is working');
        setEdgeFunctionStatus('ready');
        
        if (modelStatus === 'ready') {
          setSetupStatus('completed');
        }
      } else {
        console.warn('Edge function check failed');
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
      checkEdgeFunctionStatus()
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
      
      // Capture and analyze face after camera starts
      setTimeout(() => {
        captureAndAnalyzeFace();
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
  
  const captureAndAnalyzeFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      setIsAnalyzing(true);
      
      // Create a canvas to capture the current video frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error("Could not get canvas context");
      }
      
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
      
      // Call the GAN edge function to analyze the face
      const result = await analyzeFacialImage(imageBase64);
      
      if (result && result.status === 'ok' && result.result) {
        // Set the analysis results
        const analysis = result.result.analysis;
        if (analysis) {
          setDetectedFacialTraits({
            skinTone: analysis.skinTone || 'Not detected',
            faceShape: analysis.faceShape || 'Not detected',
            features: analysis.features || [],
            recommendations: analysis.recommendations || []
          });
          
          // Start guidance based on analysis
          if (result.result.guidance?.currentStep) {
            setCurrentGuidance(result.result.guidance.currentStep);
            
            if (result.result.guidance.progress !== undefined) {
              setProgressPercentage(result.result.guidance.progress);
            }
            
            // Speak instruction if voice is enabled
            if (voiceEnabled && result.result.guidance.voiceInstruction) {
              const utterance = new SpeechSynthesisUtterance(result.result.guidance.voiceInstruction);
              window.speechSynthesis.speak(utterance);
            }
          }
          
          // Show the analyzed image
          if (result.result.imageUrl) {
            setAnalysisImage(result.result.imageUrl);
          }
        }
        
        toast({
          title: "Face Analyzed",
          description: "Your facial traits have been detected by our AI",
        });
      } else {
        setAnalysisError(result?.message || "Analysis failed");
        toast({
          title: "Analysis Error",
          description: "Could not analyze the face image. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error capturing and analyzing face:', error);
      setAnalysisError("Error analyzing face");
      toast({
        title: "Error",
        description: "An error occurred during face analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
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
                          ? 'Model files found in Supabase storage buckets.'
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
                    <Volume2 className="h-5 w-5 text-gray-500" />
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
                
                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Analyzing your face...</p>
                    </div>
                  </div>
                )}
                
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div 
                    className="h-full bg-pink-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              
              {/* Analysis Results Display */}
              {detectedFacialTraits && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-3">Your Facial Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-purple-700"><strong>Skin Tone:</strong> {detectedFacialTraits.skinTone}</p>
                      <p className="text-purple-700"><strong>Face Shape:</strong> {detectedFacialTraits.faceShape}</p>
                    </div>
                    <div>
                      <p className="text-purple-700"><strong>Features:</strong></p>
                      <ul className="list-disc list-inside text-purple-600 text-sm">
                        {detectedFacialTraits.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {detectedFacialTraits.recommendations.length > 0 && (
                    <div className="mt-3">
                      <p className="text-purple-800 font-medium">Personalized Recommendations:</p>
                      <ul className="list-disc list-inside text-purple-600 text-sm mt-1">
                        {detectedFacialTraits.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* Current guidance */}
              {currentGuidance && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start">
                    <Volume2 className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
                    <p className="text-purple-800 flex-1">{currentGuidance}</p>
                  </div>
                </div>
              )}
              
              {/* Generated Look Display */}
              {analysisImage && (
                <GanOutput
                  imageUrl={analysisImage}
                  isLoading={isAnalyzing}
                  error={analysisError || undefined}
                  className="w-full h-64"
                />
              )}
            </div>
          )}
          
          {randomTip && (
            <div className="bg-pink-50 text-pink-600 p-3 rounded-md mb-6 text-center italic">
              💄 {randomTip}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GanGenerator;
