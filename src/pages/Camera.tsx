
import React from 'react';
import Layout from '@/components/Layout';
import { ModernCameraInterface } from '@/components/camera/ModernCameraInterface';
import { useModernCamera } from '@/hooks/useModernCamera';
import { useModernFaceDetection } from '@/hooks/useModernFaceDetection';
import { useMakeupAnalyzer } from '@/hooks/useMakeupAnalyzer';
import { ProductSelector } from '@/components/makeup/ProductSelector';
import { useState } from 'react';

const CameraPage = () => {
  // Product state
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  
  // Modern camera hook
  const camera = useModernCamera();
  
  // Face detection hook
  const faceDetection = useModernFaceDetection({
    videoRef: camera.videoRef,
    canvasRef: camera.canvasRef,
    isActive: camera.isActive
  });
  
  // Makeup analysis hook
  const makeupAnalyzer = useMakeupAnalyzer({
    captureFrame: camera.captureFrame,
    facialAnalysis: faceDetection.getFacialAnalysis(),
    availableProducts: selectedProducts
  });
  
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Virtual Makeup Try-On
          </h1>
          <p className="text-muted-foreground">
            Get personalized makeup recommendations with AI-powered face analysis
          </p>
        </div>
        
        <div className="space-y-6">
          <ProductSelector
            selectedProducts={selectedProducts}
            onProductsChange={setSelectedProducts}
          />
          
          <ModernCameraInterface
            // Camera state
            isActive={camera.isActive}
            isLoading={camera.isLoading}
            error={camera.error}
            
            // Face detection state
            faceDetected={faceDetection.faceDetected}
            isDetectionLoading={faceDetection.isLoading}
            facialAnalysis={faceDetection.getFacialAnalysis()}
            
            // Analysis state
            isAnalyzing={makeupAnalyzer.isAnalyzing}
            analysisResult={makeupAnalyzer.analysisResult}
            currentStep={makeupAnalyzer.currentStep}
            currentRecommendation={makeupAnalyzer.getCurrentRecommendation()}
            
            // Actions
            onStartCamera={camera.startCamera}
            onStopCamera={camera.stopCamera}
            onAnalyze={makeupAnalyzer.analyzeMakeup}
            onNextStep={makeupAnalyzer.nextStep}
            onPreviousStep={makeupAnalyzer.previousStep}
            onResetAnalysis={makeupAnalyzer.resetAnalysis}
            
            // Refs
            videoRef={camera.videoRef}
            canvasRef={camera.canvasRef}
          />
        </div>
      </div>
    </Layout>
  );
};

export default CameraPage;
