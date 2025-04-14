
import * as faceapi from 'face-api.js';

declare module 'face-api.js' {
  export interface DetectAllFacesOptions {
    // Additional type definitions if needed
  }
}

declare global {
  interface Window {
    faceapi: typeof faceapi;
  }
}
