
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { text, voice = "Charlie", modelId = "eleven_multilingual_v2" } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Validate the ElevenLabs API key
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenlabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY is not set');
    }

    console.log(`Generating voice guidance using ElevenLabs: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    // Call the ElevenLabs API to generate speech
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': elevenlabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ElevenLabs API error:', errorData);
      throw new Error(`ElevenLabs API error: ${errorData.detail?.message || response.statusText}`);
    }

    // Get the audio data as an ArrayBuffer
    const audioArrayBuffer = await response.arrayBuffer();
    
    // Convert to base64 for transmission
    const audioBytes = new Uint8Array(audioArrayBuffer);
    let binaryString = '';
    for (let i = 0; i < audioBytes.byteLength; i++) {
      binaryString += String.fromCharCode(audioBytes[i]);
    }
    const base64Audio = btoa(binaryString);

    return new Response(
      JSON.stringify({ 
        status: 'success',
        audio: base64Audio,
        format: 'mp3',
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in voice-guidance function:', error);
    
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
    );
  }
})
