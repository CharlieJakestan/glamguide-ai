import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  CameraOff, 
  RotateCcw, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Smile
} from 'lucide-react';

interface ModernCameraInterfaceProps {
  // Camera state
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Face detection state
  faceDetected: boolean;
  isDetectionLoading: boolean;
  facialAnalysis: any;
  
  // Analysis state
  isAnalyzing: boolean;
  analysisResult: any;
  currentStep: number;
  currentRecommendation: any;
  
  // Actions
  onStartCamera: () => void;
  onStopCamera: () => void;
  onAnalyze: () => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onResetAnalysis: () => void;
  
  // Refs
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const ModernCameraInterface: React.FC<ModernCameraInterfaceProps> = ({
  isActive,
  isLoading,
  error,
  faceDetected,
  isDetectionLoading,
  facialAnalysis,
  isAnalyzing,
  analysisResult,
  currentStep,
  currentRecommendation,
  onStartCamera,
  onStopCamera,
  onAnalyze,
  onNextStep,
  onPreviousStep,
  onResetAnalysis,
  videoRef,
  canvasRef
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Camera Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera View
            {faceDetected && (
              <Badge variant="secondary" className="ml-auto">
                <Eye className="h-3 w-3 mr-1" />
                Face Detected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {/* Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {/* Detection Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ zIndex: 10 }}
            />
            
            {/* Status Overlays */}
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Camera is off</p>
                </div>
              </div>
            )}
            
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                <div className="text-center text-white">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Camera Controls */}
          <div className="flex gap-2 mt-4">
            {!isActive ? (
              <Button 
                onClick={onStartCamera}
                disabled={isLoading}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                {isLoading ? 'Starting...' : 'Start Camera'}
              </Button>
            ) : (
              <Button 
                onClick={onStopCamera}
                variant="outline"
                className="flex-1"
              >
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Camera
              </Button>
            )}
            
            <Button
              onClick={onAnalyze}
              disabled={!faceDetected || isAnalyzing}
              variant="default"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Analyzing...
                </>
              ) : (
                'Analyze Makeup'
              )}
            </Button>
          </div>
          
          {/* Face Detection Info */}
          {isActive && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Face Detection:</span>
                <Badge variant={faceDetected ? "default" : "secondary"}>
                  {faceDetected ? "Active" : "Searching..."}
                </Badge>
              </div>
              
              {facialAnalysis && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Age:</span> {facialAnalysis.age}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Face:</span> {facialAnalysis.faceShape}
                  </div>
                  {facialAnalysis.expression && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Expression:</span> {facialAnalysis.expression}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Analysis Results Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smile className="h-5 w-5" />
            Makeup Analysis
            {analysisResult && (
              <Badge variant="outline" className="ml-auto">
                Step {currentStep + 1} of {analysisResult.recommendations.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!analysisResult ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                {!faceDetected ? (
                  <>
                    <Eye className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Position your face in the camera view</p>
                    <p className="text-sm mt-1">Make sure your face is well-lit and clearly visible</p>
                  </>
                ) : (
                  <>
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Ready for analysis!</p>
                    <p className="text-sm mt-1">Click "Analyze Makeup" to get personalized recommendations</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((currentStep + 1) / analysisResult.recommendations.length) * 100)}%</span>
                </div>
                <Progress 
                  value={((currentStep + 1) / analysisResult.recommendations.length) * 100} 
                  className="h-2"
                />
              </div>
              
              {/* Current Recommendation */}
              {currentRecommendation && (
                <div className="space-y-3">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {currentRecommendation.area}
                    </Badge>
                    <h3 className="font-medium">{currentRecommendation.instruction}</h3>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Recommended products:</p>
                    <div className="flex flex-wrap gap-1">
                      {currentRecommendation.products.map((product: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Difficulty: {currentRecommendation.difficulty}</span>
                    <span>Time: {currentRecommendation.estimatedTime}</span>
                  </div>
                </div>
              )}
              
              {/* Navigation Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={onPreviousStep}
                  disabled={currentStep === 0}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  onClick={onNextStep}
                  disabled={currentStep >= analysisResult.recommendations.length - 1}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                
                <Button
                  onClick={onResetAnalysis}
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
              
              {/* Summary Info */}
              <div className="pt-3 border-t space-y-2">
                <h4 className="text-sm font-medium">Your Analysis Summary:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Skin tone:</span> {analysisResult.skinTone}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Face shape:</span> {analysisResult.faceShape}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};