
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Edge function get-gan-model invoked");
    
    // Create Supabase client with service role key for full access to storage
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!Deno.env.get('SUPABASE_URL') || !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      console.error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      throw new Error("Server configuration error: Missing environment variables");
    }

    // Use hardcoded file list instead of relying on the unreliable list() method
    const files = ['makeup_gan_models_final_resized.h5']
    console.log("Using hardcoded file list:", files)

    // Get requested style or use default
    const { style = 'casual_day' } = await req.json().catch(() => ({ style: 'casual_day' }));
    console.log("Requested style:", style);
    
    // Initialize response data structure
    const response = {
      status: 'ok',
      files,
      downloadUrls: {}
    }

    // Get signed URLs for each file
    for (const file of files) {
      try {
        console.log(`Creating signed URL for file: ${file}`);
        const { data, error } = await supabaseClient
          .storage
          .from('gantrainingfiles')
          .createSignedUrl(file, 60 * 60) // 1 hour expiry

        if (error) {
          console.error(`Error creating signed URL for ${file}:`, error);
          throw error;
        }

        response.downloadUrls[file] = data.signedUrl;
        console.log(`Successfully created signed URL for ${file}`);
      } catch (err) {
        console.error(`Error processing file ${file}:`, err);
        throw err;
      }
    }

    console.log("Edge function completed successfully");
    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in get-gan-model function:', error);
    
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
