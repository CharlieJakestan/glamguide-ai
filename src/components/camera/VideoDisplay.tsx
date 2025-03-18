
import React, { RefObject, useEffect, useState, useRef } from 'react';
import { CameraOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as THREE from 'three';

interface VideoDisplayProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isStreamActive: boolean;
  faceDetected: boolean;
  retryFaceDetection?: () => void;
  guidanceHighlight?: {
    x: number;
    y: number;
    radius: number;
  };
  showAREffects?: boolean;
  detectedTools?: Array<{ type: string; confidence: number }>;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({
  videoRef,
  canvasRef,
  isStreamActive,
  faceDetected,
  retryFaceDetection,
  guidanceHighlight,
  showAREffects = false,
  detectedTools = []
}) => {
  const [detectionAttempts, setDetectionAttempts] = useState(0);
  const [highlightCanvas, setHighlightCanvas] = useState<HTMLCanvasElement | null>(null);
  const arEffectsRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
  } | null>(null);
  const arCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Create highlight canvas
  useEffect(() => {
    if (!highlightCanvas) {
      const canvas = document.createElement('canvas');
      canvas.className = 'absolute inset-0 w-full h-full pointer-events-none';
      setHighlightCanvas(canvas);
    }
  }, [highlightCanvas]);
  
  // Create AR effects canvas
  useEffect(() => {
    if (showAREffects && !arCanvasRef.current && videoRef.current && videoRef.current.parentElement) {
      // Create AR canvas
      const canvas = document.createElement('canvas');
      canvas.className = 'absolute inset-0 w-full h-full pointer-events-none';
      canvas.style.zIndex = '1'; // Place behind highlight canvas but above video
      videoRef.current.parentElement.appendChild(canvas);
      arCanvasRef.current = canvas;
      
      // Initialize Three.js
      initializeAREffects();
      
      return () => {
        if (arCanvasRef.current && arCanvasRef.current.parentElement) {
          arCanvasRef.current.parentElement.removeChild(arCanvasRef.current);
        }
        arCanvasRef.current = null;
        
        // Clean up Three.js
        if (arEffectsRef.current) {
          arEffectsRef.current.scene.clear();
          arEffectsRef.current.renderer.dispose();
        }
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [showAREffects, videoRef]);
  
  // Initialize Three.js for AR effects
  const initializeAREffects = () => {
    if (!arCanvasRef.current || !videoRef.current) return;
    
    // Match canvas dimensions to video
    arCanvasRef.current.width = videoRef.current.videoWidth || 640;
    arCanvasRef.current.height = videoRef.current.videoHeight || 480;
    
    // Create scene
    const scene = new THREE.Scene();
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      arCanvasRef.current.width / arCanvasRef.current.height,
      0.1,
      1000
    );
    camera.position.z = 5;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: arCanvasRef.current,
      alpha: true
    });
    renderer.setSize(arCanvasRef.current.width, arCanvasRef.current.height);
    
    // Create particles
    const particleCount = 500;
    const particles = createParticles(particleCount);
    scene.add(particles);
    
    // Store references
    arEffectsRef.current = {
      scene,
      camera,
      renderer,
      particles
    };
    
    // Start animation
    const animate = () => {
      if (!arEffectsRef.current) return;
      
      // Animate particles
      if (arEffectsRef.current.particles) {
        arEffectsRef.current.particles.rotation.y += 0.001;
        
        // Scale particles when face is detected
        const particlesMaterial = arEffectsRef.current.particles.material as THREE.PointsMaterial;
        
        if (faceDetected) {
          particlesMaterial.size = 0.05 + Math.sin(Date.now() * 0.001) * 0.02;
          particlesMaterial.color.setHSL(
            (Date.now() * 0.0001) % 1,
            0.8,
            0.5
          );
        } else {
          particlesMaterial.size = 0.03;
          particlesMaterial.color.set(0x888888);
        }
      }
      
      // Add tool-specific effects
      if (detectedTools.length > 0 && faceDetected) {
        const tool = detectedTools[0].type.toLowerCase();
        
        // Different effects based on tool type
        if (tool.includes('brush') || tool.includes('blush')) {
          addToolEffect('brush', scene);
        } else if (tool.includes('lip') || tool.includes('stick')) {
          addToolEffect('lipstick', scene);
        } else if (tool.includes('eye') || tool.includes('shadow')) {
          addToolEffect('eyeshadow', scene);
        }
      }
      
      // Render scene
      arEffectsRef.current.renderer.render(arEffectsRef.current.scene, arEffectsRef.current.camera);
      
      // Request next frame
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  // Create particle system
  const createParticles = (count: number): THREE.Points => {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(count * 3);
    
    for (let i = 0; i < count * 3; i += 3) {
      // Create spherical distribution
      const radius = 3 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = radius * Math.cos(phi);
    }
    
    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );
    
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.03,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(particlesGeometry, particlesMaterial);
  };
  
  // Add tool-specific effects
  const addToolEffect = (toolType: string, scene: THREE.Scene) => {
    // Mock implementation - would be enhanced in real version
    // This is just a placeholder for tool-specific effects
  };
  
  // Append highlight canvas to DOM
  useEffect(() => {
    if (highlightCanvas && videoRef.current && videoRef.current.parentElement) {
      videoRef.current.parentElement.appendChild(highlightCanvas);
      
      return () => {
        if (highlightCanvas.parentElement) {
          highlightCanvas.parentElement.removeChild(highlightCanvas);
        }
      };
    }
  }, [highlightCanvas, videoRef]);
  
  // Draw guidance highlight
  useEffect(() => {
    if (!highlightCanvas || !guidanceHighlight || !isStreamActive || !videoRef.current) return;
    
    // Match canvas dimensions to video
    highlightCanvas.width = videoRef.current.videoWidth || 640;
    highlightCanvas.height = videoRef.current.videoHeight || 480;
    
    const ctx = highlightCanvas.getContext('2d');
    if (!ctx) return;
    
    // Clear previous highlights
    ctx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    
    // Calculate position based on percentages
    const x = (guidanceHighlight.x / 100) * highlightCanvas.width;
    const y = (guidanceHighlight.y / 100) * highlightCanvas.height;
    const radius = guidanceHighlight.radius;
    
    // Draw highlight circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw pulsing effect
    ctx.beginPath();
    ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(155, 135, 245, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add pulse animation
    let pulseSize = 0;
    let growing = true;
    
    const animatePulse = () => {
      if (!ctx || !isStreamActive) return;
      
      ctx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
      
      // Inner highlight
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Pulsing outer circle
      ctx.beginPath();
      ctx.arc(x, y, radius + pulseSize, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(155, 135, 245, ' + (0.5 - pulseSize/20) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Update pulse size
      if (growing) {
        pulseSize += 0.5;
        if (pulseSize >= 10) growing = false;
      } else {
        pulseSize -= 0.5;
        if (pulseSize <= 0) growing = true;
      }
      
      requestAnimationFrame(animatePulse);
    };
    
    const animationId = requestAnimationFrame(animatePulse);
    
    return () => {
      cancelAnimationFrame(animationId);
      if (ctx) ctx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    };
  }, [highlightCanvas, guidanceHighlight, isStreamActive, videoRef]);
  
  // Reset detection attempts when stream changes
  useEffect(() => {
    if (isStreamActive) {
      setDetectionAttempts(0);
    }
  }, [isStreamActive]);
  
  // Increment attempts when face is not detected for a period
  useEffect(() => {
    let timer: number;
    
    if (isStreamActive && !faceDetected) {
      timer = window.setTimeout(() => {
        setDetectionAttempts(prev => prev + 1);
      }, 3000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isStreamActive, faceDetected]);
  
  const handleRetry = () => {
    setDetectionAttempts(0);
    if (retryFaceDetection) retryFaceDetection();
  };
  
  return (
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
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">
            {detectionAttempts > 2 
              ? "Face detection struggling. Try better lighting or adjust your position."
              : "No face detected. Please position your face in the frame."}
          </div>
          
          {detectionAttempts > 1 && retryFaceDetection && (
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white/80" 
              onClick={handleRetry}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Face Detection
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoDisplay;
