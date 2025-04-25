
import { supabase } from '@/lib/supabase';

export interface MakeupKnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  source?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export async function fetchMakeupKnowledge(category?: string): Promise<MakeupKnowledgeEntry[]> {
  try {
    let query = supabase
      .from('makeup_knowledge')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching makeup knowledge:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchMakeupKnowledge:', error);
    return [];
  }
}

export async function getKnowledgeForFacialTraits(traits: {
  skinTone?: string;
  faceShape?: string;
  features?: string[];
}): Promise<Record<string, string[]>> {
  try {
    // Fetch relevant knowledge based on facial traits
    const recommendations: Record<string, string[]> = {
      foundation: [],
      eyeshadow: [],
      lips: [],
      blush: [],
      techniques: []
    };
    
    // Get specific color recommendations based on skin tone
    if (traits.skinTone) {
      const { data: colorData } = await supabase
        .from('makeup_knowledge')
        .select('content')
        .eq('category', 'color')
        .textSearch('content', traits.skinTone, { config: 'english' });
      
      if (colorData && colorData.length > 0) {
        const colorContent = colorData[0].content;
        
        // Extract foundation recommendations
        const foundationMatch = colorContent.match(/foundation[^.]*/i);
        if (foundationMatch) recommendations.foundation.push(foundationMatch[0].trim());
        
        // Extract eyeshadow recommendations
        const eyeshadowMatch = colorContent.match(/eyeshadow[^.]*/i);
        if (eyeshadowMatch) recommendations.eyeshadow.push(eyeshadowMatch[0].trim());
      }
    }
    
    // Get specific technique recommendations based on face shape
    if (traits.faceShape) {
      const { data: shapeData } = await supabase
        .from('makeup_knowledge')
        .select('content')
        .eq('category', 'face_shapes')
        .textSearch('content', traits.faceShape, { config: 'english' });
      
      if (shapeData && shapeData.length > 0) {
        const shapeContent = shapeData[0].content;
        
        // Parse the content and add relevant recommendations
        const lines = shapeContent.split('\n').filter(line => line.trim().length > 0);
        lines.forEach(line => {
          if (line.toLowerCase().includes('contour')) recommendations.techniques.push(line.trim());
          if (line.toLowerCase().includes('highlight')) recommendations.techniques.push(line.trim());
          if (line.toLowerCase().includes('blush')) recommendations.blush.push(line.trim());
        });
      }
    }
    
    // Get general application techniques
    const { data: basicsData } = await supabase
      .from('makeup_knowledge')
      .select('content')
      .eq('category', 'basics');
    
    if (basicsData && basicsData.length > 0) {
      const basicsContent = basicsData[0].content;
      const lines = basicsContent.split('\n').filter(line => line.trim().length > 0);
      
      lines.forEach(line => {
        if (line.toLowerCase().includes('foundation')) recommendations.foundation.push(line.trim());
        if (line.toLowerCase().includes('eyeshadow')) recommendations.eyeshadow.push(line.trim());
        if (line.toLowerCase().includes('lip')) recommendations.lips.push(line.trim());
        if (line.toLowerCase().includes('blush')) recommendations.blush.push(line.trim());
      });
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error getting knowledge for facial traits:', error);
    return {};
  }
}

export async function enhanceMakeupGuidanceWithKnowledge(
  baseGuidance: string,
  facialTraits?: { skinTone?: string; faceShape?: string; },
  makeupArea?: string
): Promise<string> {
  try {
    let enhancedGuidance = baseGuidance;
    
    // If we know what makeup area we're working on, fetch specific knowledge
    if (makeupArea) {
      let category = '';
      let searchTerm = '';
      
      if (makeupArea.toLowerCase().includes('eye')) {
        category = 'basics';
        searchTerm = 'eyeshadow';
      } else if (makeupArea.toLowerCase().includes('lip')) {
        category = 'basics';
        searchTerm = 'lip';
      } else if (makeupArea.toLowerCase().includes('foundation') || makeupArea.toLowerCase().includes('face')) {
        category = 'basics';
        searchTerm = 'foundation';
      } else if (makeupArea.toLowerCase().includes('cheek') || makeupArea.toLowerCase().includes('blush')) {
        category = 'basics';
        searchTerm = 'blush';
      }
      
      if (category && searchTerm) {
        const { data } = await supabase
          .from('makeup_knowledge')
          .select('content')
          .eq('category', category)
          .textSearch('content', searchTerm, { config: 'english' });
        
        if (data && data.length > 0) {
          // Extract the relevant line from the content
          const content = data[0].content;
          const relevantLines = content
            .split('\n')
            .filter(line => line.toLowerCase().includes(searchTerm));
          
          if (relevantLines.length > 0) {
            // Add the tip to the guidance
            enhancedGuidance += ` Pro tip: ${relevantLines[0].replace(/^-\s*/, '').trim()}`;
          }
        }
      }
    }
    
    // If we know the person's facial traits, add personalized advice
    if (facialTraits?.faceShape) {
      const { data } = await supabase
        .from('makeup_knowledge')
        .select('content')
        .eq('category', 'face_shapes')
        .textSearch('content', facialTraits.faceShape, { config: 'english' });
      
      if (data && data.length > 0) {
        enhancedGuidance += ` For your ${facialTraits.faceShape} face shape: ${
          data[0].content
            .split('\n')
            .filter(line => line.trim().length > 0)[0]
            .replace(/^-\s*/, '')
            .trim()
        }`;
      }
    }
    
    return enhancedGuidance;
  } catch (error) {
    console.error('Error enhancing makeup guidance:', error);
    return baseGuidance; // Return original guidance if enhancement fails
  }
}
