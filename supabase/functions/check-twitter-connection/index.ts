import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-copilotcloud-public-api-key',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // 创建 Supabase 管理员客户端
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://amugncveoxslbbxpyiar.supabase.co';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({
      error: 'Supabase configuration missing',
      is_twitter_connected: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  // 从 Authorization 头部获取 Bearer Token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      error: 'No valid bearer token provided',
      is_twitter_connected: false
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    // 验证 Token 并获取用户 ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid authentication token',
        is_twitter_connected: false
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    // 查询 user_social_connections 表
    const { data, error } = await supabase.from('user_social_connections').select('*').eq('user_id', user.id).eq('platform', 'twitter');
    
    // 添加调试日志
    console.log('Debug - User ID:', user.id);
    console.log('Debug - Query result:', { data, error });
    
    if (error) {
      console.log('Debug - Query error:', error);
      // 如果是 PGRST116 错误（表不存在），返回未连接状态而不是错误
      if (error.code === 'PGRST116') {
        return new Response(JSON.stringify({
          is_twitter_connected: false,
          connection_details: null,
          debug_info: 'Table does not exist'
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      return new Response(JSON.stringify({
        error: error.message,
        error_code: error.code,
        is_twitter_connected: false,
        debug_info: 'Database query error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 处理查询结果 - data 现在是数组
    let hasActiveConnection = data && data.length > 0;
    let latestConnection = hasActiveConnection ? data[0] : null;
    let isAuthorized = false;
    let isExpired = false;
    
    console.log('Debug - Initial connection check:', { hasActiveConnection, connectionCount: data?.length });
    
    // 检查授权状态和过期状态
    if (hasActiveConnection && latestConnection) {
      isAuthorized = true; // 有连接记录说明已授权
      
      const expiresAt = latestConnection.expires_at;
      console.log('Debug - Expires at:', expiresAt);
      
      if (expiresAt) {
        const expirationTime = new Date(expiresAt);
        const currentTime = new Date();
        
        console.log('Debug - Time comparison:', {
          currentTime: currentTime.toISOString(),
          expirationTime: expirationTime.toISOString(),
          isExpired: currentTime >= expirationTime
        });
        
        // 如果token已过期，标记为过期但保持授权状态
        if (currentTime >= expirationTime) {
          isExpired = true;
          hasActiveConnection = false; // 保持原有逻辑，过期时标记为未连接
          console.log('Debug - Token expired, marking as disconnected but authorized');
        }
      } else {
        console.log('Debug - No expiration time set, assuming token is valid');
      }
    } else {
      // 没有连接记录说明未授权
      isAuthorized = false;
      isExpired = false;
    }
    
    const result = {
      is_twitter_connected: hasActiveConnection,
      is_authorized: isAuthorized,
      is_expired: isExpired,
      connection_details: latestConnection,
      total_connections: data ? data.length : 0,
      debug_info: {
        user_id: user.id,
        query_returned_records: data?.length || 0,
        has_active_connection: hasActiveConnection,
        is_authorized: isAuthorized,
        is_expired: isExpired,
        expires_at: latestConnection?.expires_at,
        current_time: new Date().toISOString()
      }
    };
    
    console.log('Debug - Final result:', result);
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (catchError) {
    return new Response(JSON.stringify({
      error: catchError instanceof Error ? catchError.message : 'Unknown error occurred',
      error_type: 'unexpected_error',
      is_twitter_connected: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
