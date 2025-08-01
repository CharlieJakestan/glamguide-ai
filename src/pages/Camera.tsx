
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
import ProductInventoryForm from '@/components/camera/ProductInventoryForm';
import ApplicationGuidance from '@/components/camera/ApplicationGuidance';
import { useMakeupGuidance } from '@/hooks/useMakeupGuidance';
import { useCamera } from '@/hooks/useCamera';
import { useFaceMesh } from '@/hooks/useFaceMesh';
import { useLocationWeather } from '@/hooks/useLocationWeather';
import { Alert, AlertDescription } from '@/components/ui/alert';
import professionalMeetingImage from '@/assets/professional-meeting-indian.jpg';
import casualDayImage from '@/assets/casual-day-indian.jpg';
import casualNightImage from '@/assets/casual-night-indian.jpg';

const CameraPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Wrap hooks in try-catch to handle initialization errors
  let cameraHookResult;
  try {
    cameraHookResult = useCamera();
  } catch (error) {
    console.error('Camera hook error:', error);
    cameraHookResult = {
      cameraActive: false,
      toggleCamera: () => {},
      activateCamera: () => {},
      videoRef: { current: null },
      canvasRef: { current: null },
      streamRef: { current: null },
      permissionDenied: false,
      deviceNotFound: false,
      checkDevices: async () => false,
      availableDevices: [],
      selectedDeviceId: null,
      selectCamera: () => {},
      loadCameraDevices: () => {}
    };
  }
  
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
  } = cameraHookResult;
  
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<MakeupProduct[]>([]);
  const [looks, setLooks] = useState<MakeupLook[]>([]);
  const [currentLook, setCurrentLook] = useState<MakeupLook | null>(null);
  const [intensitySettings, setIntensitySettings] = useState<Record<string, number>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    products: any[];
    skinConditions: string[];
    allergies: string;
    skinType: string;
  } | null>(null);
  
  // Location and weather hook with error handling
  let locationWeatherResult;
  try {
    locationWeatherResult = useLocationWeather();
  } catch (error) {
    console.error('Location weather hook error:', error);
    locationWeatherResult = {
      location: null,
      weather: null,
      isLoading: false
    };
  }
  const { location, weather, isLoading: weatherLoading } = locationWeatherResult;
  
  const [showARView, setShowARView] = useState(false);
  const [showAIGuidance, setShowAIGuidance] = useState(false);
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(false);
  
  // Use the faceMesh hook to get face detection data with error handling
  let faceMeshResult;
  try {
    faceMeshResult = useFaceMesh({
      videoRef,
      canvasRef,
      enabled: cameraActive
    });
  } catch (error) {
    console.error('Face mesh hook error:', error);
    faceMeshResult = {
      faceDetected: false,
      facialFeatures: null,
      detectedTools: [],
      isModelLoaded: false
    };
  }
  
  const { 
    faceDetected, 
    facialFeatures, 
    detectedTools, 
    isModelLoaded 
  } = faceMeshResult;
  
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Add predefined looks with images that always work
        const predefinedLooks = [
          {
            id: 'professional-meeting',
            name: 'Professional Meeting',
            description: 'Perfect for business meetings and corporate events',
            image: professionalMeetingImage,
            products: [],
            instructions: [
              { step: 1, description: 'Apply primer for a smooth base' },
              { step: 2, description: 'Use medium coverage foundation' },
              { step: 3, description: 'Apply neutral eyeshadow' },
              { step: 4, description: 'Use brown eyeliner for definition' },
              { step: 5, description: 'Apply mascara for natural lashes' },
              { step: 6, description: 'Use nude or pink lipstick' }
            ],
            created_at: new Date().toISOString()
          },
          {
            id: 'casual-day',
            name: 'Casual Day Look',
            description: 'Fresh and natural for everyday wear',
            image: casualDayImage,
            products: [],
            instructions: [
              { step: 1, description: 'Apply tinted moisturizer' },
              { step: 2, description: 'Use concealer only where needed' },
              { step: 3, description: 'Apply cream blush for natural glow' },
              { step: 4, description: 'Use clear or brown mascara' },
              { step: 5, description: 'Apply tinted lip balm' }
            ],
            created_at: new Date().toISOString()
          },
          {
            id: 'casual-night',
            name: 'Casual Night Look',
            description: 'Glamorous yet relaxed for evening outings',
            image: casualNightImage,
            products: [],
            instructions: [
              { step: 1, description: 'Apply full coverage foundation' },
              { step: 2, description: 'Create smoky eye with dark eyeshadow' },
              { step: 3, description: 'Use black eyeliner and winged technique' },
              { step: 4, description: 'Apply dramatic mascara or false lashes' },
              { step: 5, description: 'Add highlighter for glow' },
              { step: 6, description: 'Use bold lip color' }
            ],
            created_at: new Date().toISOString()
          }
        ];

        // Set basic data immediately so app works
        setProducts([]);
        setLooks(predefinedLooks);
        setCurrentLook(predefinedLooks[0]);
        setIntensitySettings({});
        setIsLoading(false);

        // Try to fetch additional data in background without blocking the app
        setTimeout(async () => {
          try {
            const [productsResponse, looksResponse] = await Promise.allSettled([
              supabase.from('makeup_products').select('*'),
              supabase.from('makeup_looks').select('*')
            ]);

            let fetchedProducts: MakeupProduct[] = [];
            let fetchedLooks: any[] = [];

            if (productsResponse.status === 'fulfilled' && 
                productsResponse.value.data && 
                !productsResponse.value.error) {
              fetchedProducts = productsResponse.value.data as MakeupProduct[];
              setProducts(fetchedProducts);
            }

            if (looksResponse.status === 'fulfilled' && 
                looksResponse.value.data && 
                !looksResponse.value.error) {
              fetchedLooks = looksResponse.value.data.map((look: any) => {
                let parsedProducts: ProductInstruction[] = [];
                if (typeof look.products === 'string') {
                  try {
                    parsedProducts = JSON.parse(look.products);
                  } catch (e) {
                    parsedProducts = [];
                  }
                } else if (Array.isArray(look.products)) {
                  parsedProducts = look.products.map((p: any) => ({
                    product_id: p.product_id,
                    intensity: p.intensity
                  }));
                }

                let parsedInstructions: ApplicationStep[] = [];
                if (typeof look.instructions === 'string') {
                  try {
                    parsedInstructions = JSON.parse(look.instructions);
                  } catch (e) {
                    parsedInstructions = [];
                  }
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

              const allLooks = [...predefinedLooks, ...fetchedLooks];
              setLooks(allLooks);

              // Handle look selection from session storage
              const selectedLookId = sessionStorage.getItem('selectedLookId');
              if (selectedLookId) {
                const selectedLook = allLooks.find(l => l.id === selectedLookId);
                if (selectedLook) {
                  setCurrentLook(selectedLook);
                  const initialSettings: Record<string, number> = {};
                  selectedLook.products.forEach(product => {
                    initialSettings[product.product_id] = product.intensity;
                  });
                  setIntensitySettings(initialSettings);
                }
                sessionStorage.removeItem('selectedLookId');
              }
            }
          } catch (backgroundError) {
            console.warn('Background data fetch failed, app continues to work:', backgroundError);
          }
        }, 100);

      } catch (error) {
        console.error('Critical initialization error:', error);
        // Even if this fails, ensure basic app functionality
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);
  
  useEffect(() => {
    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const loaded = await initFaceDetection();
        setModelsLoaded(loaded);
        console.log('Face detection models loaded:', loaded);
      } catch (error) {
        console.warn('Error loading face detection models (non-blocking):', error);
        setModelsLoaded(false);
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    // Load models and camera devices in background - never block UI
    setTimeout(() => {
      loadModels().catch(error => {
        console.warn('Background model loading failed:', error);
      });
      
      loadCameraDevices().catch(error => {
        console.warn('Background camera loading failed:', error);
      });
    }, 0);
  }, [loadCameraDevices]);
  
  // Use makeup guidance hook with error handling
  let makeupGuidanceResult;
  try {
    makeupGuidanceResult = useMakeupGuidance({
      isActive: cameraActive && showAIGuidance && faceDetected,
      currentLook,
      availableProducts: products,
      canvasRef,
      videoRef,
      faceDetected
    });
  } catch (error) {
    console.error('Makeup guidance hook error:', error);
    makeupGuidanceResult = {
      currentGuidance: null,
      isAnalyzing: false,
      substitutions: [],
      voiceEnabled: false,
      toggleVoiceGuidance: () => {},
      resetAnalysis: null,
      region: '',
      setRegion: () => {},
      setVoiceEnabled: () => {}
    };
  }
  
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
  } = makeupGuidanceResult;
  
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
  
  const handleFacialAnalysisComplete = () => {
    setAnalysisComplete(true);
    setShowProductForm(true);
  };

  const handleProductFormComplete = (data: any) => {
    setUserProfile(data);
    setShowProductForm(false);
    setShowGuidance(true);
  };

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
          
          {/* Enhanced Analysis Flow */}
          {faceDetected && !analysisComplete && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Facial Analysis Complete!</h3>
              <p className="text-green-700 mb-3">We've detected your facial features and analyzed your unique characteristics.</p>
              <Button 
                onClick={handleFacialAnalysisComplete}
                className="bg-green-600 hover:bg-green-700"
              >
                Continue to Product Setup
              </Button>
            </div>
          )}

          {showProductForm && (
            <div className="mt-4">
              <ProductInventoryForm onComplete={handleProductFormComplete} />
            </div>
          )}

          {showGuidance && userProfile && currentLook && (
            <div className="mt-4">
              <ApplicationGuidance 
                selectedLook={currentLook}
                userProducts={userProfile.products}
                skinConditions={userProfile.skinConditions}
                allergies={userProfile.allergies}
                skinType={userProfile.skinType}
                locationWeather={{ location, weather }}
              />
            </div>
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
          
          {currentLook && currentLook.instructions && !showAIGuidance && !showGuidance && (
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
