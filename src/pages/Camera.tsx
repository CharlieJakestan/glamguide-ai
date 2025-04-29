
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Mic, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { initFaceDetection } from '@/lib/faceDetection';
import { MakeupLook, MakeupProduct, ProductInstruction, ApplicationStep } from '@/types/makeup';
import { useNavigate } from 'react-router-dom';
import CameraControls from '@/components/camera/CameraControls';
import IntensitySettings from '@/components/camera/IntensitySettings';
import InstructionsPanel from '@/components/camera/InstructionsPanel';
import VideoDisplay from '@/components/camera/VideoDisplay';
import VideoDisplayAR from '@/components/camera/VideoDisplayAR';
import LookNavigation from '@/components/camera/LookNavigation';
import AIGuidancePanel from '@/components/camera/AIGuidancePanel';
import APIKeyDialog from '@/components/camera/APIKeyDialog';
import { useMakeupGuidance } from '@/hooks/useMakeupGuidance';
import { useCamera } from '@/hooks/useCamera';
import { useFaceMesh } from '@/hooks/useFaceMesh';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CameraPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    cameraActive,
    toggleCamera,
    activateCamera,
    videoRef,
    canvasRef,
    streamRef,
    permissionDenied,
    deviceNotFound,
    checkDevices,
    availableDevices,
    selectedDeviceId,
    selectCamera,
    loadCameraDevices
  } = useCamera();
  
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<MakeupProduct[]>([]);
  const [looks, setLooks] = useState<MakeupLook[]>([]);
  const [currentLook, setCurrentLook] = useState<MakeupLook | null>(null);
  const [intensitySettings, setIntensitySettings] = useState<Record<string, number>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [showARView, setShowARView] = useState(false);
  
  const [showAIGuidance, setShowAIGuidance] = useState(false);
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(false);
  
  // Use the faceMesh hook to get face detection data
  const { 
    faceDetected, 
    facialFeatures, 
    detectedTools, 
    isModelLoaded 
  } = useFaceMesh({
    videoRef,
    canvasRef,
    enabled: cameraActive
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, looksResponse] = await Promise.all([
          supabase.from('makeup_products').select('*'),
          supabase.from('makeup_looks').select('*')
        ]);
        
        if (productsResponse.error) throw productsResponse.error;
        if (looksResponse.error) throw looksResponse.error;
        
        const fetchedProducts = productsResponse.data as MakeupProduct[];
        
        const fetchedLooks = looksResponse.data.map(look => {
          let parsedProducts: ProductInstruction[] = [];
          if (typeof look.products === 'string') {
            parsedProducts = JSON.parse(look.products);
          } else if (Array.isArray(look.products)) {
            parsedProducts = look.products.map((p: any) => ({
              product_id: p.product_id,
              intensity: p.intensity
            }));
          }
          
          let parsedInstructions: ApplicationStep[] = [];
          if (typeof look.instructions === 'string') {
            parsedInstructions = JSON.parse(look.instructions);
          } else if (Array.isArray(look.instructions)) {
            parsedInstructions = look.instructions.map((i: any) => ({
              step: i.step,
              description: i.description
            }));
          }
          
          return {
            id: look.id,
            name: look.name,
            description: look.description,
            created_at: look.created_at,
            products: parsedProducts,
            instructions: parsedInstructions
          } as MakeupLook;
        });
        
        setProducts(fetchedProducts);
        setLooks(fetchedLooks);
        
        if (fetchedLooks.length > 0) {
          setCurrentLook(fetchedLooks[0]);
          const initialSettings: Record<string, number> = {};
          fetchedLooks[0].products.forEach(product => {
            initialSettings[product.product_id] = product.intensity;
          });
          setIntensitySettings(initialSettings);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching makeup data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch makeup data',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  useEffect(() => {
    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const loaded = await initFaceDetection();
        setModelsLoaded(loaded);
        
        if (!loaded) {
          toast({
            title: 'Warning',
            description: 'Face detection models could not be loaded. Trying alternate sources...',
            variant: 'destructive',
          });
          
          // Try once more with a longer timeout
          setTimeout(async () => {
            const retryLoaded = await initFaceDetection();
            setModelsLoaded(retryLoaded);
            
            if (!retryLoaded) {
              toast({
                title: 'Error',
                description: 'Face detection models failed to load. Try refreshing the page.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Success',
                description: 'Face detection models loaded successfully.',
                variant: 'default',
              });
            }
          }, 2000);
        } else {
          toast({
            title: 'Ready',
            description: 'Face detection models loaded successfully.',
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Error in model loading:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while loading face detection models.',
          variant: 'destructive',
        });
        setModelsLoaded(false);
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    loadModels();
    
    // Attempt to load camera devices first
    loadCameraDevices();
  }, [toast, loadCameraDevices]);
  
  const {
    currentGuidance,
    isAnalyzing,
    substitutions,
    voiceEnabled,
    toggleVoiceGuidance,
    resetAnalysis,
    region,
    setRegion,
    setVoiceEnabled
  } = useMakeupGuidance({
    isActive: cameraActive && showAIGuidance && faceDetected,
    currentLook,
    availableProducts: products,
    canvasRef,
    videoRef,
    faceDetected
  });
  
  useEffect(() => {
    if (resetAnalysis) {
      resetAnalysis();
    }
  }, [currentLook, resetAnalysis]);
  
  const handleIntensityChange = (productId: string, value: number[]) => {
    setIntensitySettings(prev => ({
      ...prev,
      [productId]: value[0],
    }));
  };
  
  const navigateLooks = (direction: 'next' | 'prev') => {
    if (!currentLook || looks.length <= 1) return;
    
    const currentIndex = looks.findIndex(look => look.id === currentLook.id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % looks.length;
    } else {
      newIndex = (currentIndex - 1 + looks.length) % looks.length;
    }
    
    setCurrentLook(looks[newIndex]);
    
    const newSettings: Record<string, number> = {};
    looks[newIndex].products.forEach(product => {
      newSettings[product.product_id] = product.intensity;
    });
    setIntensitySettings(newSettings);
  };
  
  const retryFaceDetection = () => {
    if (videoRef.current && canvasRef.current && modelsLoaded) {
      toast({
        title: 'Retrying',
        description: 'Attempting to detect face again...',
        variant: 'default',
      });
    }
  };
  
  const reloadModels = async () => {
    setIsLoadingModels(true);
    toast({
      title: 'Loading',
      description: 'Attempting to reload face detection models...',
      variant: 'default',
    });
    
    try {
      const loaded = await initFaceDetection();
      setModelsLoaded(loaded);
      
      if (loaded) {
        toast({
          title: 'Success',
          description: 'Face detection models loaded successfully.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Models could not be loaded. Please check your internet connection.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error reloading models:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading models.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingModels(false);
    }
  };
  
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const getCurrentLookProducts = () => {
    if (!currentLook) return [];
    
    return currentLook.products.map(item => {
      const product = products.find(p => p.id === item.product_id);
      return {
        id: item.product_id,
        name: product?.name || 'Unknown Product',
        category: product?.category || 'unknown',
        intensity: intensitySettings[item.product_id] || item.intensity,
      };
    });
  };
  
  const toggleSettings = () => setShowSettings(!showSettings);
  
  const toggleAIGuidance = () => {
    setShowAIGuidance(prev => !prev);
    
    if (!showAIGuidance) {
      // Show the API key dialog if AI guidance is being turned on
      setShowAPIKeyDialog(true);
    }
  };
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-purple-800 mb-6">
            Virtual Makeup Try-On
            {showAIGuidance && (
              <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                AI-Guided
              </span>
            )}
          </h2>
          
          <LookNavigation 
            currentLook={currentLook} 
            looksCount={looks.length}
            onNavigate={navigateLooks}
          />
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
              {showARView ? (
                <VideoDisplayAR
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  isStreamActive={cameraActive}
                  faceDetected={faceDetected}
                  retryFaceDetection={retryFaceDetection}
                  showAREffects={true}
                  detectedTools={detectedTools}
                />
              ) : (
                <VideoDisplay
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  isStreamActive={cameraActive}
                  faceDetected={faceDetected}
                  retryFaceDetection={retryFaceDetection}
                  detectedTools={detectedTools}
                />
              )}
              
              <div className="flex justify-between mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowARView(!showARView)}
                >
                  {showARView ? 'Standard View' : 'AR Effects View'}
                </Button>
                
                {facialFeatures && (
                  <div className="text-xs text-right text-gray-500">
                    {facialFeatures.faceShape && `Face: ${facialFeatures.faceShape}`}
                    {facialFeatures.eyeShape && ` • Eyes: ${facialFeatures.eyeShape}`}
                    {facialFeatures.lipShape && ` • Lips: ${facialFeatures.lipShape}`}
                  </div>
                )}
              </div>
              
              {detectedTools && detectedTools.length > 0 && (
                <Alert className="mt-2 bg-green-50 border-green-200 text-green-800">
                  <AlertDescription>
                    Detected: {detectedTools.map(tool => tool.type).join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
          
          <CameraControls
            isStreamActive={cameraActive}
            showSettings={showSettings}
            modelsLoaded={modelsLoaded}
            startCamera={activateCamera}
            stopCamera={toggleCamera}
            toggleSettings={toggleSettings}
            retryFaceDetection={retryFaceDetection}
            isLoadingModels={isLoadingModels}
            reloadModels={reloadModels}
            permissionDenied={permissionDenied}
            deviceNotFound={deviceNotFound}
            checkDevices={checkDevices}
            availableDevices={availableDevices}
            selectedDeviceId={selectedDeviceId}
            selectCamera={selectCamera}
          />
          
          {cameraActive && modelsLoaded && (
            <div className="mt-4 flex justify-center">
              <Button
                variant={showAIGuidance ? "default" : "outline"}
                onClick={toggleAIGuidance}
                className={showAIGuidance ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                <Mic className="mr-2 h-4 w-4" />
                {showAIGuidance ? "Disable AI Guidance" : "Enable AI Guidance"}
              </Button>
              
              {showAIGuidance && (
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={() => setShowAPIKeyDialog(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Voice Settings
                </Button>
              )}
            </div>
          )}
          
          {showSettings && currentLook && (
            <IntensitySettings
              products={getCurrentLookProducts()}
              onIntensityChange={handleIntensityChange}
            />
          )}
          
          {showAIGuidance && cameraActive && (
            <AIGuidancePanel
              guidance={currentGuidance}
              isAnalyzing={isAnalyzing}
              voiceEnabled={voiceEnabled}
              toggleVoiceGuidance={toggleVoiceGuidance}
              substitutions={substitutions}
              region={region}
              setRegion={setRegion}
              setVoiceEnabled={setVoiceEnabled}
            />
          )}
          
          {currentLook && currentLook.instructions && !showAIGuidance && (
            <InstructionsPanel instructions={currentLook.instructions} />
          )}
          
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            <Button variant="outline" onClick={() => navigate('/looks')}>
              Browse All Looks
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <APIKeyDialog 
        open={showAPIKeyDialog} 
        onOpenChange={setShowAPIKeyDialog} 
      />
    </Layout>
  );
};

export default CameraPage;
