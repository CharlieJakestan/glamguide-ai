import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ChevronLeft, ChevronRight, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { initFaceDetection, detectFacialLandmarks, applyVirtualMakeup } from '@/lib/faceDetection';
import { MakeupLook, MakeupProduct } from '@/types/makeup';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';

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
        
        const fetchedLooks = looksResponse.data.map(look => ({
          id: look.id,
          name: look.name,
          description: look.description,
          created_at: look.created_at,
          products: typeof look.products === 'string' 
            ? JSON.parse(look.products) 
            : (look.products as ProductInstruction[]),
          instructions: typeof look.instructions === 'string'
            ? JSON.parse(look.instructions)
            : (look.instructions as ApplicationStep[])
        })) as MakeupLook[];
        
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
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-purple-800 mb-6">
            Virtual Makeup Try-On
          </h2>
          
          {currentLook && (
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                onClick={() => navigateLooks('prev')}
                disabled={looks.length <= 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Look
              </Button>
              
              <h3 className="text-xl font-semibold text-purple-700">
                {currentLook.name}
              </h3>
              
              <Button
                variant="outline"
                onClick={() => navigateLooks('next')}
                disabled={looks.length <= 1}
                className="flex items-center gap-1"
              >
                Next Look
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
            
            {!isStreamActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <CameraOff className="w-16 h-16 text-gray-400" />
              </div>
            )}
            
            {isStreamActive && !faceDetected && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">
                  No face detected. Please position your face in the frame.
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-4 mb-6">
            {!isStreamActive ? (
              <Button
                onClick={startCamera}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            ) : (
              <Button
                onClick={stopCamera}
                variant="destructive"
              >
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Camera
              </Button>
            )}
            
            {isStreamActive && (
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Sliders className="mr-2 h-4 w-4" />
                {showSettings ? 'Hide Adjustments' : 'Show Adjustments'}
              </Button>
            )}
          </div>
          
          {hasPermission === false && (
            <p className="mt-4 text-red-600 text-center">
              Camera access denied. Please check your browser permissions.
            </p>
          )}
          
          {showSettings && currentLook && (
            <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-700 mb-2">
                Adjust Product Intensity
              </h3>
              
              {getCurrentLookProducts().map(product => (
                <div key={product.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(product.intensity * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[product.intensity]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => handleIntensityChange(product.id, value)}
                  />
                </div>
              ))}
            </div>
          )}
          
          {currentLook && currentLook.instructions && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-700 mb-2">
                How to Apply This Look
              </h3>
              
              <ol className="list-decimal list-inside space-y-2">
                {currentLook.instructions.map((instruction, index) => (
                  <li key={index} className="text-gray-700">
                    {instruction.description}
                  </li>
                ))}
              </ol>
            </div>
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
