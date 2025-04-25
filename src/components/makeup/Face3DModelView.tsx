
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Face3DModel } from '@/lib/face3dModeling';

interface Face3DModelViewProps {
  faceModel: Face3DModel | null;
  makeupConfig?: {
    lipstick?: { color: string; opacity: number; };
    eyeshadow?: { color: string; intensity: number; };
    foundation?: { color: string; coverage: number; };
    blush?: { color: string; intensity: number; position: { x: number; y: number; } };
  };
  width?: number;
  height?: number;
  className?: string;
  rotateModel?: boolean;
}

const Face3DModelView: React.FC<Face3DModelViewProps> = ({
  faceModel,
  makeupConfig = {},
  width = 300,
  height = 300,
  className = '',
  rotateModel = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const faceMeshRef = useRef<THREE.Mesh | null>(null);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 2);
    scene.add(directionalLight);
    
    // Create placeholder face mesh if no model provided
    if (!faceModel) {
      const geometry = new THREE.SphereGeometry(2, 32, 32);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xffdbac, 
        roughness: 0.8,
        metalness: 0.1
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      faceMeshRef.current = mesh;
    }
    
    // Animation loop
    let frameId: number;
    
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rotateModel && faceMeshRef.current) {
        faceMeshRef.current.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Clean up
    return () => {
      cancelAnimationFrame(frameId);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      renderer.dispose();
    };
  }, [width, height, rotateModel]);
  
  // Update face model when it changes
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Remove existing face mesh
    if (faceMeshRef.current) {
      sceneRef.current.remove(faceMeshRef.current);
      faceMeshRef.current = null;
    }
    
    // Add new face mesh if model is provided
    if (faceModel) {
      // In a real implementation, this would use the vertices, indices, etc. from the 3D model
      // For demo purposes, we'll create a face-like geometry
      
      const geometry = new THREE.SphereGeometry(2, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.75);
      geometry.scale(1, 1.3, 0.9);
      
      // Create base material with skin texture
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xffdbac,
        roughness: 0.8,
        metalness: 0.1,
      });
      
      // Apply makeup effects if provided
      if (makeupConfig.foundation) {
        material.color.set(makeupConfig.foundation.color);
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      sceneRef.current.add(mesh);
      faceMeshRef.current = mesh;
      
      // Add eyes
      const eyeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x3333aa });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(0.7, 0.2, 0.9);
      mesh.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(-0.7, 0.2, 0.9);
      mesh.add(rightEye);
      
      // Add lips
      const lipGeometry = new THREE.TorusGeometry(0.5, 0.1, 16, 32, Math.PI);
      const lipColor = makeupConfig.lipstick?.color || '#ff6b81';
      const lipMaterial = new THREE.MeshStandardMaterial({ 
        color: lipColor,
        roughness: 0.3,
        metalness: 0.2
      });
      
      const lips = new THREE.Mesh(lipGeometry, lipMaterial);
      lips.rotation.x = Math.PI / 2;
      lips.position.set(0, -0.6, 0.9);
      lips.scale.set(0.8, 0.8, 0.8);
      mesh.add(lips);
      
      // Add eyeshadow if in makeup config
      if (makeupConfig.eyeshadow) {
        const eyeshadowGeometry = new THREE.CircleGeometry(0.3, 16);
        const eyeshadowMaterial = new THREE.MeshBasicMaterial({ 
          color: makeupConfig.eyeshadow.color,
          opacity: makeupConfig.eyeshadow.intensity,
          transparent: true
        });
        
        const leftEyeshadow = new THREE.Mesh(eyeshadowGeometry, eyeshadowMaterial);
        leftEyeshadow.position.set(0.7, 0.3, 0.91);
        mesh.add(leftEyeshadow);
        
        const rightEyeshadow = new THREE.Mesh(eyeshadowGeometry, eyeshadowMaterial);
        rightEyeshadow.position.set(-0.7, 0.3, 0.91);
        mesh.add(rightEyeshadow);
      }
      
      // Add blush if in makeup config
      if (makeupConfig.blush) {
        const blushGeometry = new THREE.CircleGeometry(0.4, 16);
        const blushMaterial = new THREE.MeshBasicMaterial({ 
          color: makeupConfig.blush.color,
          opacity: makeupConfig.blush.intensity * 0.5,
          transparent: true
        });
        
        const leftBlush = new THREE.Mesh(blushGeometry, blushMaterial);
        leftBlush.position.set(1.1, -0.3, 0.7);
        leftBlush.rotation.y = -Math.PI / 4;
        mesh.add(leftBlush);
        
        const rightBlush = new THREE.Mesh(blushGeometry, blushMaterial);
        rightBlush.position.set(-1.1, -0.3, 0.7);
        rightBlush.rotation.y = Math.PI / 4;
        mesh.add(rightBlush);
      }
    }
  }, [faceModel, makeupConfig]);
  
  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width, height }}
    />
  );
};

export default Face3DModelView;
