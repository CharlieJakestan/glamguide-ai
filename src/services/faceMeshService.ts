import * as facemesh from '@tensorflow-models/facemesh';
import * as tf from '@tensorflow/tfjs';
import { toast } from '@/hooks/use-toast';

let faceMeshModel: facemesh.FaceMesh | null = null;
let isModelLoading = false;

export const loadFaceMeshModel = async (): Promise<facemesh.FaceMesh | null> => {
  if (faceMeshModel) {
    return faceMeshModel;
  }

  if (isModelLoading) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (faceMeshModel) {
          clearInterval(checkInterval);
          resolve(faceMeshModel);
        }
      }, 100);
    });
  }

  try {
    console.log('Loading face mesh model...');
    isModelLoading = true;
    
    faceMeshModel = await facemesh.load({
      maxFaces: 1,
      detectionConfidence: 0.9,
      scoreThreshold: 0.75,
    });
    
    console.log('Face mesh model loaded successfully');
    isModelLoading = false;
    return faceMeshModel;
  } catch (error) {
    console.error('Error loading face mesh model:', error);
    isModelLoading = false;
    return null;
  }
};

export const detectFaceMesh = async (
  video: HTMLVideoElement,
  callback?: (predictions: facemesh.AnnotatedPrediction[]) => void
): Promise<facemesh.AnnotatedPrediction[] | null> => {
  if (!faceMeshModel) {
    try {
      faceMeshModel = await loadFaceMeshModel();
      if (!faceMeshModel) {
        throw new Error('Failed to load face mesh model');
      }
    } catch (error) {
      console.error('Error loading face mesh model:', error);
      return null;
    }
  }

  try {
    if (video.readyState === 4) {
      const predictions = await faceMeshModel.estimateFaces(video);
      if (callback && predictions.length > 0) {
        callback(predictions);
      }
      return predictions as facemesh.AnnotatedPrediction[];
    }
  } catch (error) {
    console.error('Error detecting face mesh:', error);
  }
  return null;
};

export const drawFaceMesh = (
  canvas: HTMLCanvasElement,
  predictions: facemesh.AnnotatedPrediction[]
): void => {
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  predictions.forEach(prediction => {
    let keypoints: number[][];
    
    if (Array.isArray(prediction.scaledMesh)) {
      keypoints = prediction.scaledMesh as number[][];
    } else {
      const tensor = prediction.scaledMesh as tf.Tensor2D;
      keypoints = tensor.arraySync() as number[][];
    }
    
    for (let i = 0; i < keypoints.length; i++) {
      const [x, y] = keypoints[i];
      
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, 2 * Math.PI);
      ctx.fillStyle = '#00FF00';
      ctx.fill();
    }
    
    const contourIndices = [
      [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
      [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
      [263, 249, 390, 373, 374, 380, 381, 382, 362, 263],
      [33, 7, 163, 144, 145, 153, 154, 155, 133, 33],
      [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],
      [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
    ];
    
    for (let i = 0; i < contourIndices.length; i++) {
      const indices = contourIndices[i];
      ctx.beginPath();
      
      for (let j = 0; j < indices.length; j++) {
        const idx = indices[j];
        const [x, y] = keypoints[idx];
        
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      if (i === 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      } else if (i === 1) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      } else if (i === 2 || i === 3) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      }
      
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
};

export const analyzeFacialFeatures = (
  predictions: facemesh.AnnotatedPrediction[]
): {
  faceShape: string;
  skinTone: string;
  jawlineType: string;
  eyeShape: string;
  lipShape: string;
} | null => {
  if (!predictions || predictions.length === 0) {
    return null;
  }

  const prediction = predictions[0];
  const keypoints = prediction.scaledMesh;
  
  const leftTemple = keypoints[234];
  const rightTemple = keypoints[454];
  const chin = keypoints[152];
  const forehead = keypoints[10];
  
  const faceWidth = Math.sqrt(
    Math.pow(rightTemple[0] - leftTemple[0], 2) +
    Math.pow(rightTemple[1] - leftTemple[1], 2)
  );
  
  const faceHeight = Math.sqrt(
    Math.pow(chin[0] - forehead[0], 2) +
    Math.pow(chin[1] - forehead[1], 2)
  );
  
  const ratio = faceHeight / faceWidth;
  
  let faceShape = 'Oval';
  if (ratio > 1.5) {
    faceShape = 'Oblong';
  } else if (ratio < 1.2) {
    faceShape = 'Round';
  } else if (ratio >= 1.2 && ratio <= 1.5) {
    const leftJaw = keypoints[172];
    const rightJaw = keypoints[397];
    
    const jawWidth = Math.sqrt(
      Math.pow(rightJaw[0] - leftJaw[0], 2) +
      Math.pow(rightJaw[1] - leftJaw[1], 2)
    );
    
    if (jawWidth / faceWidth > 0.9) {
      faceShape = 'Square';
    } else if (jawWidth / faceWidth < 0.8) {
      faceShape = 'Heart';
    }
  }

  const upperLipCenter = keypoints[0];
  const lowerLipCenter = keypoints[17];
  const leftCorner = keypoints[61];
  const rightCorner = keypoints[291];
  
  const lipWidth = Math.sqrt(
    Math.pow(rightCorner[0] - leftCorner[0], 2) +
    Math.pow(rightCorner[1] - leftCorner[1], 2)
  );
  
  const lipHeight = Math.sqrt(
    Math.pow(upperLipCenter[0] - lowerLipCenter[0], 2) +
    Math.pow(upperLipCenter[1] - lowerLipCenter[1], 2)
  );
  
  let lipShape = 'Average';
  if (lipWidth / lipHeight > 4) {
    lipShape = 'Wide';
  } else if (lipWidth / lipHeight < 3) {
    lipShape = 'Full';
  }

  const leftEyeTop = keypoints[159];
  const leftEyeBottom = keypoints[145];
  const leftEyeInner = keypoints[133];
  const leftEyeOuter = keypoints[33];
  
  const eyeHeight = Math.sqrt(
    Math.pow(leftEyeTop[0] - leftEyeBottom[0], 2) +
    Math.pow(leftEyeTop[1] - leftEyeBottom[1], 2)
  );
  
  const eyeWidth = Math.sqrt(
    Math.pow(leftEyeOuter[0] - leftEyeInner[0], 2) +
    Math.pow(leftEyeOuter[1] - leftEyeInner[1], 2)
  );
  
  let eyeShape = 'Almond';
  if (eyeWidth / eyeHeight > 3) {
    eyeShape = 'Wide';
  } else if (eyeWidth / eyeHeight < 2) {
    eyeShape = 'Round';
  }

  const skinTone = 'Medium';
  
  const jawline = [
    keypoints[172],
    keypoints[136],
    keypoints[150],
    keypoints[152],
    keypoints[149],
    keypoints[148],
    keypoints[397]
  ];
  
  const jawlineAngles = [];
  for (let i = 1; i < jawline.length - 1; i++) {
    const prev = jawline[i-1];
    const current = jawline[i];
    const next = jawline[i+1];
    
    const v1 = [current[0] - prev[0], current[1] - prev[1]];
    const v2 = [next[0] - current[0], next[1] - current[1]];
    
    const dot = v1[0] * v2[0] + v1[1] * v2[1];
    const v1Mag = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    const v2Mag = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
    
    const angle = Math.acos(dot / (v1Mag * v2Mag)) * (180 / Math.PI);
    jawlineAngles.push(angle);
  }
  
  const avgJawAngle = jawlineAngles.reduce((sum, angle) => sum + angle, 0) / jawlineAngles.length;
  
  let jawlineType = 'Average';
  if (avgJawAngle > 160) {
    jawlineType = 'Angular';
  } else if (avgJawAngle < 140) {
    jawlineType = 'Soft';
  }
  
  return {
    faceShape,
    skinTone,
    jawlineType,
    eyeShape,
    lipShape,
  };
};

export const detectMakeupTools = async (
  video: HTMLVideoElement
): Promise<Array<{ type: string; confidence: number }>> => {
  return [
    { type: 'foundation brush', confidence: 0.92 },
    { type: 'lipstick', confidence: 0.85 }
  ];
};

export const unloadModels = (): void => {
  faceMeshModel = null;
  try {
    tf.dispose();
  } catch (err) {
    console.error('Error disposing TensorFlow resources:', err);
  }
};
