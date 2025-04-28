
import { supabase } from '@/lib/supabase';

export interface MakeupReference {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
}

// Fetch makeup reference images from Supabase Storage
export const fetchMakeupReferenceImages = async (): Promise<{url: string, name: string}[]> => {
  try {
    // List all files in the makeup-references folder
    const { data: files, error } = await supabase.storage
      .from('makeup-references')
      .list('references', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error('Error fetching makeup reference images:', error);
      return [];
    }
    
    if (!files || files.length === 0) {
      return [];
    }
    
    // Get public URLs for each file
    return await Promise.all(
      files
        .filter(file => !file.metadata?.mimetype || file.metadata?.mimetype.startsWith('image/'))
        .map(async (file) => {
          const { data: url } = supabase.storage
            .from('makeup-references')
            .getPublicUrl(`references/${file.name}`);
          
          return {
            url: url.publicUrl,
            name: file.name
          };
        })
    );
  } catch (error) {
    console.error('Error in fetchMakeupReferenceImages:', error);
    return [];
  }
};

// Get reference looks with their images
export const getReferenceLooks = (): MakeupReference[] => {
  // This would ideally fetch from a database, but for now we'll use mock data
  return [
    {
      id: 'look1',
      name: 'Natural Everyday Look',
      description: 'A subtle, everyday makeup look that enhances your natural features',
      imageUrl: '/lovable-uploads/makeup-reference-1.jpg',
      category: 'everyday',
      tags: ['natural', 'subtle', 'daily']
    },
    {
      id: 'look2',
      name: 'Bold Evening Glam',
      description: 'A dramatic evening look with bold eyes and lips',
      imageUrl: '/lovable-uploads/makeup-reference-2.jpg',
      category: 'evening',
      tags: ['dramatic', 'bold', 'glam']
    },
    {
      id: 'look3',
      name: 'Professional Office Look',
      description: 'Polished and professional makeup for the workplace',
      imageUrl: '/lovable-uploads/makeup-reference-3.jpg',
      category: 'professional',
      tags: ['office', 'polished', 'subdued']
    },
    {
      id: 'look4',
      name: 'Summer Glow',
      description: 'A bright, dewy look perfect for summer',
      imageUrl: '/lovable-uploads/makeup-reference-4.jpg',
      category: 'seasonal',
      tags: ['dewy', 'bright', 'summer']
    }
  ];
};

// Train AI with reference images using the files fetched from storage
export const trainAIWithReferenceImages = async (): Promise<boolean> => {
  try {
    const images = await fetchMakeupReferenceImages();
    
    if (images.length === 0) {
      console.warn('No reference images found for AI training');
      return false;
    }
    
    console.log(`Training AI with ${images.length} reference images...`);
    
    // In a real app, this would send the images to a backend for model training
    // For now, we'll simulate successful training
    
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('AI makeup reference training complete');
    return true;
  } catch (error) {
    console.error('Error training AI with reference images:', error);
    return false;
  }
};
