import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Fetching Unsplash image for query: "${query}"`)

    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
      {
        headers: {
          'Authorization': 'Client-ID UsCjZ6W7Dv2rBgJgRpFSvuIg_Yp-SVZzFMzJ9Y44Ms8'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Unsplash API error: ${response.status}`, errorText)
      
      // If query returns no results, try a fallback query
      if (response.status === 404 || response.status === 400) {
        console.log("Using fallback query 'travel'")
        const fallbackResponse = await fetch(
          `https://api.unsplash.com/photos/random?query=travel&orientation=landscape`,
          {
            headers: {
              'Authorization': 'Client-ID UsCjZ6W7Dv2rBgJgRpFSvuIg_Yp-SVZzFMzJ9Y44Ms8'
            }
          }
        )
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          console.log("Fallback image found:", fallbackData.urls.regular)
          
          return new Response(
            JSON.stringify({ 
              imageUrl: fallbackData.urls.regular,
              description: fallbackData.description || fallbackData.alt_description,
              photographer: fallbackData.user.name,
              photographerUrl: fallbackData.user.links.html
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
      
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("Image found:", data.urls.regular)
    
    return new Response(
      JSON.stringify({ 
        imageUrl: data.urls.regular,
        description: data.description || data.alt_description,
        photographer: data.user.name,
        photographerUrl: data.user.links.html
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch image from Unsplash', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
