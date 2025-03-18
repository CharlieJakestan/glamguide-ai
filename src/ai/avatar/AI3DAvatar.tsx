
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface AI3DAvatarProps {
  isSpeaking: boolean;
  mood?: 'neutral' | 'happy' | 'thinking' | 'concerned';
  size?: 'small' | 'medium' | 'large';
  colorTheme?: 'purple' | 'blue' | 'pink' | 'green';
}

const AI3DAvatar: React.FC<AI3DAvatarProps> = ({
  isSpeaking = false,
  mood = 'neutral',
  size = 'medium',
  colorTheme = 'purple'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Calculate dimensions based on size prop
  useEffect(() => {
    if (!containerRef.current) return;
    
    let width: number, height: number;
    
    switch (size) {
      case 'small':
        width = 80;
        height = 80;
        break;
      case 'large':
        width = 200;
        height = 200;
        break;
      case 'medium':
      default:
        width = 120;
        height = 120;
        break;
    }
    
    setDimensions({ width, height });
  }, [size]);
  
  // Get primary color based on theme
  const getPrimaryColor = (): number => {
    switch (colorTheme) {
      case 'blue':
        return 0x4285f4;
      case 'pink':
        return 0xea4c89;
      case 'green':
        return 0x34a853;
      case 'purple':
      default:
        return 0x9c27b0;
    }
  };
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || dimensions.width === 0) return;
    
    // Clean up previous renderer
    if (rendererRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
      containerRef.current.removeChild(rendererRef.current.domElement);
    }
    
    // Cancel any ongoing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(50, dimensions.width / dimensions.height, 0.1, 2000);
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(dimensions.width, dimensions.height);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create base geometry based on mood
    let geometry: THREE.BufferGeometry;
    
    switch (mood) {
      case 'happy':
        geometry = new THREE.TorusGeometry(1, 0.4, 16, 50);
        break;
      case 'thinking':
        geometry = new THREE.OctahedronGeometry(1, 1);
        break;
      case 'concerned':
        geometry = new THREE.DodecahedronGeometry(1, 0);
        break;
      case 'neutral':
      default:
        geometry = new THREE.SphereGeometry(1, 32, 32);
        break;
    }
    
    // Create material
    const material = new THREE.MeshPhongMaterial({
      color: getPrimaryColor(),
      flatShading: false,
      transparent: true,
      opacity: 0.9,
      shininess: 100
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;
    
    // Animation function
    const animate = () => {
      if (!meshRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      
      // Rotate mesh
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.01;
      
      // Add "speaking" effect when isSpeaking is true
      if (isSpeaking) {
        const time = Date.now() * 0.001;
        const scaleFactor = 1 + Math.sin(time * 8) * 0.05;
        meshRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Pulse the color
        const pulseColor = getPrimaryColor() + Math.sin(time * 10) * 0x222222;
        (meshRef.current.material as THREE.MeshPhongMaterial).color.setHex(pulseColor);
      } else {
        meshRef.current.scale.set(1, 1, 1);
        (meshRef.current.material as THREE.MeshPhongMaterial).color.setHex(getPrimaryColor());
      }
      
      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // Request next frame
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Clean up on unmount
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (rendererRef.current && containerRef.current?.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (meshRef.current) {
        geometry.dispose();
        (meshRef.current.material as THREE.MeshPhongMaterial).dispose();
        scene.remove(meshRef.current);
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, [dimensions.width, dimensions.height, mood, colorTheme]);
  
  // Update animation when isSpeaking changes
  useEffect(() => {
    if (!meshRef.current) return;
    
    // Update material color
    const material = meshRef.current.material as THREE.MeshPhongMaterial;
    material.color.setHex(getPrimaryColor());
    
    // Update emissive for speaking effect
    if (isSpeaking) {
      material.emissive.setHex(0x222222);
    } else {
      material.emissive.setHex(0x000000);
    }
  }, [isSpeaking, colorTheme]);
  
  return (
    <div 
      ref={containerRef}
      className="ai-avatar-container"
      style={{ 
        width: dimensions.width, 
        height: dimensions.height,
        margin: '0 auto'
      }}
    />
  );
};

export default AI3DAvatar;
