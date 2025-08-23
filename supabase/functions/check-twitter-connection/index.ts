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
    // 查询用户的Twitter连接记录（每个用户只有一条记录）
    const { data, error } = await supabase
      .from('user_social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'twitter')
      .single(); // 使用single()因为每个用户只有一条记录
    
    // 添加调试日志
    console.log('Debug - User ID:', user.id);
    console.log('Debug - Query result:', { data, error });
    
    if (error) {
      console.log('Debug - Query error:', error);
      // 如果是 PGRST116 错误（表不存在）或 PGRST106 错误（没有记录），返回未授权状态
      if (error.code === 'PGRST116') {
        return new Response(JSON.stringify({
          is_twitter_connected: false,
          is_authorized: false,
          is_expired: false,
          connection_details: null,
          debug_info: 'Table does not exist'
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // PGRST106 表示没有找到记录，说明用户未授权
      if (error.code === 'PGRST106') {
        return new Response(JSON.stringify({
          is_twitter_connected: false,
          is_authorized: false,
          is_expired: false,
          connection_details: null,
          debug_info: 'No connection record found - user not authorized'
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
        is_authorized: false,
        is_expired: false,
        debug_info: 'Database query error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 处理查询结果 - data 现在是单个对象
    const connection = data;
    let isAuthorized = true; // 有记录说明已授权
    let isExpired = false;
    let isConnected = false;
    
    console.log('Debug - Connection found:', { connection });
    
    // 根据新的逻辑判断连接状态
    if (connection.is_active === false) {
      // 情况3: is_active为false，可能是用户手动断链或其他异常
      isConnected = false;
      isExpired = true; // 返回已过期，需要用户手动建链
      console.log('Debug - Connection is inactive, user needs to manually reconnect');
    } else if (connection.expires_at) {
      // 情况4: 检查token是否过期
      const expirationTime = new Date(connection.expires_at);
      const currentTime = new Date();
      
      console.log('Debug - Time comparison:', {
        currentTime: currentTime.toISOString(),
        expirationTime: expirationTime.toISOString(),
        isExpired: currentTime >= expirationTime
      });
      
      if (currentTime >= expirationTime) {
        // Token已过期，显示已过期，由系统自动刷新
        isExpired = true;
        isConnected = false;
        console.log('Debug - Token expired, system should auto-refresh');
      } else {
        // Token有效且活跃
        isConnected = true;
        console.log('Debug - Connection is active and valid');
      }
    } else {
      // 没有过期时间，假设token有效
      isConnected = true;
      console.log('Debug - No expiration time set, assuming token is valid');
    }
    
    const result = {
      is_twitter_connected: isConnected,
      is_authorized: isAuthorized,
      is_expired: isExpired,
      connection_details: connection,
      debug_info: {
        user_id: user.id,
        is_connected: isConnected,
        is_authorized: isAuthorized,
        is_expired: isExpired,
        is_active: connection.is_active,
        expires_at: connection.expires_at,
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
      is_twitter_connected: false,
      is_authorized: false,
      is_expired: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
