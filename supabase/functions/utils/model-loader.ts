
import * as tf from "https://esm.sh/@tensorflow/tfjs@4.11.0";

/**
 * Loads a TensorFlow.js model from a URL or remote storage
 */
export async function loadTFModel(modelPath: string): Promise<tf.LayersModel> {
  try {
    console.log(`Loading model from path: ${modelPath}`);
    const model = await tf.loadLayersModel(modelPath);
    console.log('Model loaded successfully');
    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    throw new Error(`Failed to load model: ${error.message}`);
  }
}

/**
 * Preprocesses an image for model input
 */
export function preprocessImage(imageData: ImageData | HTMLImageElement, targetSize: number): tf.Tensor {
  return tf.tidy(() => {
    let tensor;
    
    // Convert ImageData or HTMLImageElement to tensor
    if ('data' in imageData && 'width' in imageData && 'height' in imageData) {
      // ImageData object
      tensor = tf.browser.fromPixels(imageData as ImageData, 3);
    } else {
      // HTMLImageElement
      tensor = tf.browser.fromPixels(imageData as HTMLImageElement, 3);
    }
    
    // Resize to target size
    const resized = tf.image.resizeBilinear(tensor, [targetSize, targetSize]);
    
    // Normalize pixel values to [-1, 1]
    const normalized = resized.toFloat().div(tf.scalar(127.5)).sub(tf.scalar(1));
    
    // Add batch dimension
    return normalized.expandDims(0);
  });
}
