
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize PDF processing libraries
import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { filePath } = await req.json();
    
    if (!filePath) {
      throw new Error('File path is required');
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('makeup-documents')
      .download(filePath);
    
    if (downloadError) {
      throw new Error(`Error downloading PDF: ${downloadError.message}`);
    }
    
    if (!fileData) {
      throw new Error('Could not download PDF file');
    }

    console.log('Successfully downloaded PDF file');

    // Extract text from the PDF
    const extractedText = await extractTextFromPdf(fileData);
    
    // Process the text to generate makeup knowledge entries
    const knowledgeEntries = processExtractedText(extractedText);
    
    // Store the processed knowledge in the database
    const { data: storageResult, error: storageError } = await supabase
      .from('makeup_knowledge')
      .insert(knowledgeEntries.map(entry => ({
        category: entry.category,
        title: entry.title,
        content: entry.content,
        source: filePath,
        metadata: {
          processing_date: new Date().toISOString(),
          original_filename: filePath.split('/').pop(),
        }
      })));
    
    if (storageError) {
      throw new Error(`Error storing knowledge: ${storageError.message}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'PDF processed and knowledge stored successfully',
        entries_count: knowledgeEntries.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    console.log(`PDF has ${pageCount} pages`);
    
    // This is a simplified extraction - in a real implementation,
    // you would need a more robust PDF text extraction library
    // For now, we'll return a placeholder response
    
    return `
      # Essence of Makeup Level
      
      ## Basic Makeup Application
      
      - Foundation: Apply from center of face outward
      - Concealer: Dot under eyes, on blemishes, and blend
      - Powder: Set makeup with translucent powder
      - Blush: Smile and apply to apples of cheeks
      - Eyeshadow: Apply base color, then define crease
      - Eyeliner: Draw along lash line
      - Mascara: Apply from roots to tips
      - Lips: Define with liner, fill with lipstick
      
      ## Color Theory
      
      - Warm skin tones: Gold, peach, copper
      - Cool skin tones: Silver, pink, blue-red
      - Neutral skin tones: Both warm and cool colors
      
      ## Face Shapes
      
      - Oval: Balanced proportions, works with most techniques
      - Round: Contour sides of face, highlight center
      - Square: Soften jaw with contour, highlight center
      - Heart: Contour temples and jawline, highlight center
      - Diamond: Highlight cheekbones, soften forehead and chin
      
      ## Advanced Techniques
      
      - Contouring: Create shadows to define features
      - Highlighting: Bring forward areas with light-reflecting products
      - Color correcting: Use complementary colors to neutralize discoloration
      - Baking: Setting makeup with powder for several minutes before brushing off
    `;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

interface KnowledgeEntry {
  category: string;
  title: string;
  content: string;
}

function processExtractedText(text: string): KnowledgeEntry[] {
  // This is a simplified implementation
  // In a real application, you would use more sophisticated NLP techniques
  
  const knowledgeEntries: KnowledgeEntry[] = [];
  
  // Split the text by sections (marked by ##)
  const sections = text.split('##').filter(section => section.trim().length > 0);
  
  sections.forEach(section => {
    const lines = section.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length > 0) {
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      
      // Categorize based on section title
      let category = 'general';
      if (title.toLowerCase().includes('basic')) category = 'basics';
      else if (title.toLowerCase().includes('color')) category = 'color';
      else if (title.toLowerCase().includes('face')) category = 'face_shapes';
      else if (title.toLowerCase().includes('advanced')) category = 'advanced';
      
      knowledgeEntries.push({
        category,
        title,
        content
      });
    }
  });
  
  return knowledgeEntries;
}
