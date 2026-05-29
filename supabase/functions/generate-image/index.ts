import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle browser CORS preflight check safely
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt payload parameter target context." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Retrieve your Pollinations API Key from the project's environment vault
    const apiKey = Deno.env.get("IMAGE_API_KEY");
    if (!apiKey) {
      console.error("Missing IMAGE_API_KEY inside Supabase Environment Configuration vault.");
      return new Response(
        JSON.stringify({ error: "Server infrastructure missing active engine authorization key context." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Modern Pollinations AI unified delivery endpoint schema
    // Utilizing default production flux models with safety parameters active
    const cleanPrompt = encodeURIComponent(prompt);
    const targetEndpoint = `https://gen.pollinations.ai/image/${cleanPrompt}?model=flux&width=1024&height=1024&nologo=true&safe=true`;

    console.log(`Forwarding query upstream to Pollinations routing node: ${targetEndpoint}`);

    const response = await fetch(targetEndpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upstream engine network handshake drop: ${response.status} - ${errorText}`);
    }

    // Pull raw image binary array stream from the source network layer
    const imageArrayBuffer = await response.arrayBuffer();

    return new Response(imageArrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error: any) {
    console.error("Edge function execution execution lifecycle runtime drop error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred during canvas processing operations." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});