import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-copilotcloud-public-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface SaveConnectionRequest {
  token_data: {
    access_token: string
    refresh_token?: string
    token_type: string
    expires_in?: number
    scope?: string
  }
  user_info: {
    id: string
    username: string
    name: string
    profile_image_url?: string
    verified?: boolean
    public_metrics?: {
      followers_count: number
      following_count: number
      tweet_count: number
    }
  }
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

    const { token_data, user_info }: SaveConnectionRequest = await req.json()

    if (!token_data || !user_info) {
      return new Response(
        JSON.stringify({ error: 'Missing token_data or user_info parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 使用upsert模式：如果记录存在则更新，不存在则插入
    // 这确保每个用户只有一条Twitter连接记录
    const connectionData = {
      user_id: user.id,
      platform: 'twitter',
      platform_user_id: user_info.id,
      platform_username: user_info.username,
      access_token: token_data.access_token,
      refresh_token: token_data.refresh_token,
      token_type: token_data.token_type || 'Bearer',
      expires_at: token_data.expires_in ? 
        new Date(Date.now() + token_data.expires_in * 1000).toISOString() : null,
      scope: token_data.scope,
      is_active: true,
      updated_at: new Date().toISOString()
    }

    // 首先检查是否已有记录，如果有则更新，没有则插入
    const { data: existingConnection } = await supabase
      .from('user_social_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'twitter')
      .single()

    let data, error
    
    if (existingConnection) {
      // 更新现有记录
      const result = await supabase
        .from('user_social_connections')
        .update(connectionData)
        .eq('user_id', user.id)
        .eq('platform', 'twitter')
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // 插入新记录
      const result = await supabase
        .from('user_social_connections')
        .insert(connectionData)
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Failed to save connection:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save connection', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        connection: data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in save-twitter-connection:', error)
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