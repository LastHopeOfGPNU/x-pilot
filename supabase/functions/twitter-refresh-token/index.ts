import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-copilotcloud-public-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface RefreshTokenRequest {
  refresh_token: string
}

interface TwitterTokenResponse {
  token_type: string
  expires_in: number
  access_token: string
  scope: string
  refresh_token?: string
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { refresh_token }: RefreshTokenRequest = await req.json()

    if (!refresh_token) {
      return new Response(
        JSON.stringify({ error: 'Missing refresh_token parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Twitter API credentials from environment
    const clientId = Deno.env.get('TWITTER_CLIENT_ID')
    const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Twitter API credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare refresh token request
    const refreshParams = new URLSearchParams({
      refresh_token,
      grant_type: 'refresh_token',
      client_id: clientId,
    })

    // Request new access token using refresh token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: refreshParams.toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Twitter token refresh failed:', errorData)
      return new Response(
        JSON.stringify({ 
          error: 'Token refresh failed', 
          details: errorData 
        }),
        { 
          status: tokenResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData: TwitterTokenResponse = await tokenResponse.json()

    // Update the existing Twitter connection record with new tokens
    const { data: updateResult, error: updateError } = await supabase
      .from('user_social_connections')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refresh_token, // Use new refresh token if provided, otherwise keep the old one
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('platform', 'twitter')
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update connection record:', updateError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update connection record', 
          details: updateError.message,
          token_data: tokenData // Still return the token data for fallback handling
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        ...tokenData,
        connection_updated: true,
        updated_connection: updateResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in twitter-refresh-token:', error)
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