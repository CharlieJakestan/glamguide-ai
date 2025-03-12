import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { initFaceDetection, detectFacialLandmarks, applyVirtualMakeup } from '@/lib/faceDetection';
import { MakeupLook, MakeupProduct, ProductInstruction, ApplicationStep } from '@/types/makeup';
import { useNavigate } from 'react-router-dom';
import CameraControls from '@/components/camera/CameraControls';
import IntensitySettings from '@/components/camera/IntensitySettings';
import InstructionsPanel from '@/components/camera/InstructionsPanel';
import VideoDisplay from '@/components/camera/VideoDisplay';
import LookNavigation from '@/components/camera/LookNavigation';
import { Json } from '@/integrations/supabase/types';

const CameraPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<MakeupProduct[]>([]);
  const [looks, setLooks] = useState<MakeupLook[]>([]);
  const [currentLook, setCurrentLook] = useState<MakeupLook | null>(null);
  const [intensitySettings, setIntensitySettings] = useState<Record<string, number>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
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
      const loaded = await initFaceDetection();
      setModelsLoaded(loaded);
      if (!loaded) {
        toast({
          title: 'Warning',
          description: 'Face detection models could not be loaded',
          variant: 'destructive',
        });
      }
    };
    
    loadModels();
  }, [toast]);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
        setHasPermission(true);
        
        if (modelsLoaded) {
          startFaceDetection();
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasPermission(false);
      toast({
        title: 'Error',
        description: 'Failed to access camera',
        variant: 'destructive',
      });
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreamActive(false);
      setFaceDetected(false);
      
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
  };
  
  const startFaceDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const updateDimensions = () => {
      if (video.videoWidth && video.videoHeight) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
      }
    };
    
    video.addEventListener('loadedmetadata', updateDimensions);
    
    const detectFace = async () => {
      if (!video || !canvas || !isStreamActive) return;
      
      try {
        const detections = await detectFacialLandmarks(video);
        
        if (detections) {
          setFaceDetected(true);
          
          if (currentLook) {
            const makeupProducts = currentLook.products.map(item => {
              const product = products.find(p => p.id === item.product_id);
              return {
                type: product?.category || 'unknown',
                color: product?.color || '#FF0000',
                intensity: intensitySettings[item.product_id] || item.intensity,
              };
            });
            
            applyVirtualMakeup(canvas, detections.landmarks, makeupProducts);
          }
        } else {
          setFaceDetected(false);
        }
      } catch (error) {
        console.error('Error in face detection loop:', error);
      }
      
      if (isStreamActive) {
        requestAnimationFrame(detectFace);
      }
    };
    
    detectFace();
    
    return () => {
      video.removeEventListener('loadedmetadata', updateDimensions);
    };
  };
  
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
    setFaceDetected(false);
    if (videoRef.current && canvasRef.current) {
      startFaceDetection();
    }
  };
  
  useEffect(() => {
    return () => {
      stopCamera();
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
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-purple-800 mb-6">
            Virtual Makeup Try-On
          </h2>
          
          <LookNavigation 
            currentLook={currentLook} 
            looksCount={looks.length}
            onNavigate={navigateLooks}
          />
          
          <VideoDisplay
            videoRef={videoRef}
            canvasRef={canvasRef}
            isStreamActive={isStreamActive}
            faceDetected={faceDetected}
            retryFaceDetection={retryFaceDetection}
          />
          
          <CameraControls
            isStreamActive={isStreamActive}
            showSettings={showSettings}
            modelsLoaded={modelsLoaded}
            startCamera={startCamera}
            stopCamera={stopCamera}
            toggleSettings={toggleSettings}
            retryFaceDetection={retryFaceDetection}
          />
          
          {hasPermission === false && (
            <p className="mt-4 text-red-600 text-center">
              Camera access denied. Please check your browser permissions.
            </p>
          )}
          
          {showSettings && currentLook && (
            <IntensitySettings
              products={getCurrentLookProducts()}
              onIntensityChange={handleIntensityChange}
            />
          )}
          
          {currentLook && currentLook.instructions && (
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
    </Layout>
  );
};

export default CameraPage;
