
import React, { RefObject, useEffect, useState, useRef } from 'react';
import { CameraOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as THREE from 'three';

interface VideoDisplayARProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isStreamActive: boolean;
  faceDetected: boolean;
  retryFaceDetection?: () => void;
  showAREffects?: boolean;
  detectedTools?: Array<{ type: string; confidence: number }>;
  makeupRegions?: any;
}

const VideoDisplayAR: React.FC<VideoDisplayARProps> = ({
  videoRef,
  canvasRef,
  isStreamActive,
  faceDetected,
  retryFaceDetection,
  showAREffects = false,
  detectedTools = [],
  makeupRegions
}) => {
  const [detectionAttempts, setDetectionAttempts] = useState(0);
  const arCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const threeContextRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
  } | null>(null);
  
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
        if (threeContextRef.current) {
          threeContextRef.current.scene.clear();
          threeContextRef.current.renderer.dispose();
        }
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [showAREffects, videoRef, makeupRegions]);
  
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
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 5);
    scene.add(directionalLight);
    
    // Store references
    threeContextRef.current = {
      scene,
      camera,
      renderer,
      particles
    };
    
    // Start animation
    animateAREffects();
  };
  
  // Animate AR effects
  const animateAREffects = () => {
    if (!threeContextRef.current) return;
    
    // Animate particles
    if (threeContextRef.current.particles) {
      threeContextRef.current.particles.rotation.y += 0.001;
      
      // Scale particles when face is detected
      const particlesMaterial = threeContextRef.current.particles.material as THREE.PointsMaterial;
      
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
        addToolEffect('brush', threeContextRef.current.scene);
      } else if (tool.includes('lip') || tool.includes('stick')) {
        addToolEffect('lipstick', threeContextRef.current.scene);
      } else if (tool.includes('eye') || tool.includes('shadow')) {
        addToolEffect('eyeshadow', threeContextRef.current.scene);
      }
    }
    
    // Render scene
    threeContextRef.current.renderer.render(threeContextRef.current.scene, threeContextRef.current.camera);
    
    // Request next frame
    animationFrameRef.current = requestAnimationFrame(animateAREffects);
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
    // This would be enhanced with actual tool-specific effects
    // For demonstration purposes, we'll add simple particle effects
    
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2;
      positions[i + 1] = (Math.random() - 0.5) * 2;
      positions[i + 2] = (Math.random() - 0.5) * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    // Set colors based on tool type
    if (toolType === 'brush') {
      material.color.set(0xff9999); // Pink for brush
    } else if (toolType === 'lipstick') {
      material.color.set(0xff0066); // Red for lipstick
    } else if (toolType === 'eyeshadow') {
      material.color.set(0x9966ff); // Purple for eyeshadow
    }
    
    const particles = new THREE.Points(geometry, material);
    particles.position.set(-1 + Math.random() * 2, -1 + Math.random() * 2, 0);
    
    // Add to scene temporarily
    scene.add(particles);
    
    // Remove after a short time
    setTimeout(() => {
      scene.remove(particles);
    }, 1000);
  };
  
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

export default VideoDisplayAR;
