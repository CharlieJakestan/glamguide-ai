
export interface FacialAttributes {
  age?: number;
  gender?: string;
  expression?: string;
  skinType?: string;
  skinTone?: string;
  faceShape?: string;
}

export interface MovementData {
  x: number;
  y: number;
  magnitude: number;
  headPose?: {
    pitch: number; // up/down
    yaw: number;   // left/right
    roll: number;  // tilt
  };
  eyeMovement?: {
    left: { x: number; y: number };
    right: { x: number; y: number };
  };
  mouthMovement?: {
    open: boolean;
    smiling: boolean;
  };
}

export interface DetectedObject {
  type: string;
  position: { x: number; y: number };
  confidence: number;
}

export interface DetectedAction {
  action: string;
  confidence: number;
  timestamp: number;
}

export interface MakeupRegion {
  type: string;
  region: {
    points: { x: number; y: number }[];
    center: { x: number; y: number };
  };
  color?: string;
}
