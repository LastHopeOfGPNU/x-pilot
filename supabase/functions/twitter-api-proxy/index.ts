import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-copilotcloud-public-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface ProxyRequest {
  endpoint: string
  method?: string
  access_token: string
  params?: Record<string, string>
  body?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { endpoint, method = 'GET', access_token, params, body }: ProxyRequest = await req.json()

    if (!endpoint || !access_token) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Construct Twitter API URL
    let apiUrl = `https://api.twitter.com/2${endpoint}`
    
    // Add query parameters for GET requests
    if (params && method === 'GET') {
      const searchParams = new URLSearchParams(params)
      apiUrl += `?${searchParams.toString()}`
    }

    // Prepare request headers
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
    }

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body)
    }

    // Make request to Twitter API
    const response = await fetch(apiUrl, requestOptions)
    
    const responseData = await response.json()

    if (!response.ok) {
      console.error('Twitter API error:', responseData)
      return new Response(
        JSON.stringify({ 
          error: 'Twitter API request failed', 
          status: response.status,
          details: responseData 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in twitter-api-proxy:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})