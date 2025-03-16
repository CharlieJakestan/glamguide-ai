
/**
 * Utility functions for image processing in the makeup app
 */

// Convert a base64 image to a Blob or File
export const base64ToBlob = (base64Data: string, contentType = 'image/jpeg'): Blob => {
  // Remove data URL prefix if it exists
  const base64WithoutPrefix = base64Data.includes('base64,') 
    ? base64Data.split('base64,')[1] 
    : base64Data;
  
  const byteCharacters = atob(base64WithoutPrefix);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: contentType });
};

// Create object URL for a base64 image
export const createObjectUrlFromBase64 = (base64Data: string, contentType = 'image/jpeg'): string => {
  const blob = base64ToBlob(base64Data, contentType);
  return URL.createObjectURL(blob);
};

// Compress an image to reduce size
export const compressImage = (file: File, maxSizeMB: number = 1): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Adjust quality based on file size
        let quality = 0.9;
        if (file.size > maxSizeMB * 1024 * 1024) {
          quality = Math.min(0.9, (maxSizeMB * 1024 * 1024) / file.size);
        }
        
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Could not create blob from canvas'));
              return;
            }
            
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve(newFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
};

// Generate a color palette from an image
export const generateColorPalette = async (imageUrl: string, numColors: number = 5): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Sample pixels at regular intervals
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const pixels: { r: number; g: number; b: number }[] = [];
      
      // Sample every 10th pixel
      for (let i = 0; i < data.length; i += 40) {
        pixels.push({
          r: data[i],
          g: data[i + 1],
          b: data[i + 2]
        });
      }
      
      // Simple clustering to find dominant colors
      const dominantColors = simpleClustering(pixels, numColors);
      
      // Convert RGB to HEX
      const hexColors = dominantColors.map(color => 
        `#${((1 << 24) | (color.r << 16) | (color.g << 8) | color.b).toString(16).slice(1)}`
      );
      
      resolve(hexColors);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
};

// Simple k-means clustering for color extraction
const simpleClustering = (
  pixels: { r: number; g: number; b: number }[], 
  k: number
): { r: number; g: number; b: number }[] => {
  // Very simple algorithm that just averages pixels in chunks
  // (A real k-means would be more accurate but more complex)
  
  if (pixels.length === 0) return [];
  if (pixels.length <= k) return pixels;
  
  const chunkSize = Math.floor(pixels.length / k);
  const results: { r: number; g: number; b: number }[] = [];
  
  for (let i = 0; i < k; i++) {
    const startIdx = i * chunkSize;
    const endIdx = (i === k - 1) ? pixels.length : (i + 1) * chunkSize;
    
    let sumR = 0, sumG = 0, sumB = 0;
    for (let j = startIdx; j < endIdx; j++) {
      sumR += pixels[j].r;
      sumG += pixels[j].g;
      sumB += pixels[j].b;
    }
    
    const count = endIdx - startIdx;
    results.push({
      r: Math.round(sumR / count),
      g: Math.round(sumG / count),
      b: Math.round(sumB / count)
    });
  }
  
  return results;
};
