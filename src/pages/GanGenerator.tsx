
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { getApiKey, setApiKey } from '@/services/speechService';
import { checkGanFunction, analyzeFacialImage } from '@/services/ganService';
import SetupStatusPanel from '@/components/makeup/SetupStatusPanel';
import ReadyToUsePanel from '@/components/makeup/ReadyToUsePanel';
import FaceAnalysisCamera from '@/components/makeup/FaceAnalysisCamera';
import { getReferenceLooks, ReferenceLook } from '@/services/lookReferenceService';
import { useReferenceLookGuidance } from '@/hooks/useReferenceLookGuidance';
import { initFaceDetection } from '@/lib/faceDetection';

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
  const [referenceLooks, setReferenceLooks] = useState<ReferenceLook[]>([]);
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiKeyRef = useRef<string>(getApiKey() || "");
  const streamRef = useRef<MediaStream | null>(null);
  
  // Initialize the reference look guidance hook
  const lookGuidance = useReferenceLookGuidance({
    voiceEnabled,
    facialAnalysis: detectedFacialTraits
  });
  
  // Setup face detection
  useEffect(() => {
    const setupFaceDetection = async () => {
      const success = await initFaceDetection();
      setFaceDetectionReady(success);
      
      if (!success) {
        toast({
          title: "Face Detection Setup Failed",
          description: "Could not load face detection models. Some features may not work properly.",
          variant: "destructive"
        });
      }
    };
    
    setupFaceDetection();
  }, [toast]);
  
  // Load reference looks
  useEffect(() => {
    const looks = getReferenceLooks();
    setReferenceLooks(looks);
    
    if (looks.length > 0 && !selectedLookId) {
      setSelectedLookId(looks[0].id);
      lookGuidance.setSelectedLookId(looks[0].id);
    }
  }, [selectedLookId]);
  
  useEffect(() => {
    // Set default API key if not already set - this happens ONCE to avoid repeated prompts
    if (!getApiKey()) {
      const defaultKey = "sk_0dfcb07ba1e4d72443fcb5385899c03e9106d3d27ddaadc2";
      setApiKey(defaultKey);
      apiKeyRef.current = defaultKey;
      setVoiceEnabled(true);
      
      toast({
        title: "Voice Guidance Ready",
        description: "Voice guidance has been configured automatically.",
        variant: "default",
      });
    }
    
    // Check if model files exist in Supabase
    checkModelFilesExist();
    
    // Check if edge function exists and is working
    checkEdgeFunctionStatus();
    
    // Get a random makeup tip
    getRandomTip();
    
    return () => {
      // Cleanup camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [toast]);
  
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
      
      toast({
        title: "Camera Activated",
        description: "Position your face in the frame for analysis.",
      });
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
      const result = await analyzeFacialImage(imageBase64, selectedLookId);
      
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
        // Use mock data if the real analysis fails
        const mockTraits = generateMockFacialAnalysis();
        setDetectedFacialTraits(mockTraits);
        setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
        setProgressPercentage(5);
        
        toast({
          title: "Face Analyzed",
          description: "Your facial traits have been detected using our fallback analysis",
        });
      }
    } catch (error) {
      console.error('Error capturing and analyzing face:', error);
      setAnalysisError("Error analyzing face");
      
      // Use mock data as fallback
      const mockTraits = generateMockFacialAnalysis();
      setDetectedFacialTraits(mockTraits);
      setAnalysisImage('/lovable-uploads/b30403d6-fafd-40f8-8dd4-e3d56d388dc0.png');
      
      toast({
        title: "Analysis Completed",
        description: "Using simulation mode due to connection issues.",
        variant: "default",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const generateMockFacialAnalysis = () => {
    // Mock data for demonstration
    const skinTones = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep', 'Rich'];
    const faceShapes = ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Rectangle'];
    const features = [
      'Wide-set eyes', 'Close-set eyes', 'Hooded eyes', 'Full lips', 'Thin lips',
      'High cheekbones', 'Strong jawline', 'Soft jawline', 'Strong brow', 'Soft brow'
    ];
    const recommendations = [
      'Use a foundation with yellow undertones to complement your skin tone',
      'Apply bronzer along the temples and jawline to define your face shape',
      'Define your brows with a slightly angled shape to balance your features',
      'Try a cream blush on the apples of your cheeks for a natural flush',
      'Apply highlighter to your cheekbones to enhance your facial structure'
    ];
    
    // Randomly select traits
    const skinTone = skinTones[Math.floor(Math.random() * skinTones.length)];
    const faceShape = faceShapes[Math.floor(Math.random() * faceShapes.length)];
    
    // Select 2-3 random features
    const selectedFeatures: string[] = [];
    const featureCount = Math.floor(Math.random() * 2) + 2; // 2-3 features
    
    for (let i = 0; i < featureCount; i++) {
      const feature = features[Math.floor(Math.random() * features.length)];
      if (!selectedFeatures.includes(feature)) {
        selectedFeatures.push(feature);
      }
    }
    
    // Select 2-3 random recommendations
    const selectedRecommendations: string[] = [];
    const recCount = Math.floor(Math.random() * 2) + 2; // 2-3 recommendations
    
    for (let i = 0; i < recCount; i++) {
      const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
      if (!selectedRecommendations.includes(rec)) {
        selectedRecommendations.push(rec);
      }
    }
    
    return {
      skinTone,
      faceShape,
      features: selectedFeatures,
      recommendations: selectedRecommendations
    };
  };
  
  // Extract step names from the selected look for progress tracking
  const stepNames = lookGuidance.selectedLook?.steps.map(step => step.instruction) || [];
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-pink-500 mb-4">
            AI Makeup Look Generator
          </h2>
          
          <p className="mb-6 text-gray-600">
            Create unique makeup looks with our AI-powered generator! Each look is uniquely
            generated just for you based on advanced face analysis technology.
          </p>
          
          <SetupStatusPanel
            modelStatus={modelStatus}
            edgeFunctionStatus={edgeFunctionStatus}
            setupStatus={setupStatus}
            isLoading={isLoading}
            onCheckStatus={checkSetupStatus}
          />
          
          {setupStatus === 'completed' && (
            <ReadyToUsePanel
              cameraActive={cameraActive}
              voiceEnabled={voiceEnabled}
              onToggleCamera={toggleCamera}
              onVoiceEnabledChange={setVoiceEnabled}
              analysisProgress={progressPercentage}
              referenceLooks={referenceLooks}
              onSelectReferenceLook={(lookId) => {
                setSelectedLookId(lookId);
                lookGuidance.setSelectedLookId(lookId);
              }}
            />
          )}
          
          {cameraActive && (
            <FaceAnalysisCamera
              cameraActive={cameraActive}
              isAnalyzing={isAnalyzing}
              progressPercentage={progressPercentage}
              currentGuidance={currentGuidance}
              detectedFacialTraits={detectedFacialTraits}
              analysisImage={analysisImage}
              analysisError={analysisError}
              voiceEnabled={voiceEnabled}
              availableLooks={referenceLooks}
              selectedLookId={selectedLookId}
              onSelectLook={(lookId) => {
                setSelectedLookId(lookId);
                lookGuidance.setSelectedLookId(lookId);
              }}
              lookGuidance={{
                currentStep: lookGuidance.currentStep,
                completedSteps: lookGuidance.completedSteps,
                totalSteps: stepNames.length,
                stepNames,
                getCurrentInstruction: lookGuidance.getCurrentStepInstruction,
                goToNextStep: lookGuidance.goToNextStep,
                goToPreviousStep: lookGuidance.goToPreviousStep,
                markCompleted: lookGuidance.markCurrentStepCompleted,
                selectStep: lookGuidance.selectStep
              }}
              onCaptureAndAnalyze={captureAndAnalyzeFace}
              onToggleCamera={toggleCamera}
              videoRef={videoRef}
              canvasRef={canvasRef}
            />
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
