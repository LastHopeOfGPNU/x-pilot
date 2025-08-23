import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-copilotcloud-public-api-key',
};

interface TwitterTokenResponse {
  token_type: string
  expires_in: number
  access_token: string
  scope: string
  refresh_token?: string
}

// 刷新Twitter token的函数
async function refreshTwitterToken(refreshToken: string, userId: string, supabase: any): Promise<{ success: boolean; error?: string }> {
  try {
    // 获取Twitter API凭据
    const clientId = Deno.env.get('TWITTER_CLIENT_ID');
    const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Twitter API credentials not configured' };
    }

    // 准备刷新token请求
    const refreshParams = new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_id: clientId,
    });

    // 请求新的访问令牌
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: refreshParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Twitter token refresh failed:', errorData);
      return { success: false, error: `Token refresh failed: ${errorData}` };
    }

    const tokenData: TwitterTokenResponse = await tokenResponse.json();

    // 更新数据库中的连接记录
    const { error: updateError } = await supabase
      .from('user_social_connections')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', 'twitter');

    if (updateError) {
      console.error('Failed to update connection record:', updateError);
      return { success: false, error: `Failed to update connection record: ${updateError.message}` };
    }

    console.log('Twitter token refreshed successfully for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Error refreshing Twitter token:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

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
      has_records: false,
      is_active: false,
      is_expired: false
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
      has_records: false,
      is_active: false,
      is_expired: false
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
        has_records: false,
        is_active: false,
        is_expired: false
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
          has_records: false,
          is_active: false,
          is_expired: false
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
          has_records: false,
          is_active: false,
          is_expired: false
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      return new Response(JSON.stringify({
        has_records: false,
        is_active: false,
        is_expired: false
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 处理查询结果 - data 现在是单个对象
    let connection = data;
    let isAuthorized = true; // 有记录说明已授权
    let isExpired = false;
    let isConnected = false;
    
    console.log('Debug - Connection found:', { connection });
    
    // 根据新的逻辑判断连接状态
    if (connection.is_active === false) {
      // 情况3: is_active为false，可能是用户手动断链或其他异常
      isConnected = false;
      isExpired = false; // 不是过期，而是手动禁用
      console.log('Debug - Connection is inactive, user manually disabled');
    } else if (connection.expires_at) {
      // 情况4: 检查token是否过期
      const expirationTime = new Date(connection.expires_at);
      const currentTime = new Date();
      
      console.log('Debug - Time comparison:', {
        currentTime: currentTime.toISOString(),
        expirationTime: expirationTime.toISOString(),
        isExpired: currentTime >= expirationTime
      });
      
      if (currentTime >= expirationTime && connection.is_active === true && connection.refresh_token) {
        // Token已过期，但is_active为true且有refresh_token，自动刷新token
        console.log('Debug - Token expired but connection is active, attempting auto-refresh');
        
        try {
          // 调用refresh token逻辑
          const refreshResult = await refreshTwitterToken(connection.refresh_token, user.id, supabase);
          
          if (refreshResult.success) {
            // 刷新成功，重新查询连接状态
            const { data: refreshedConnection, error: refreshQueryError } = await supabase
              .from('user_social_connections')
              .select('*')
              .eq('user_id', user.id)
              .eq('platform', 'twitter')
              .single();
            
            if (!refreshQueryError && refreshedConnection) {
              // 使用刷新后的连接信息
              connection = refreshedConnection;
              isConnected = true;
              isExpired = false;
              console.log('Debug - Token refreshed successfully, connection is now active');
            } else {
              isExpired = true;
              isConnected = false;
              console.log('Debug - Failed to query refreshed connection');
            }
          } else {
            isExpired = true;
            isConnected = false;
            console.log('Debug - Token refresh failed:', refreshResult.error);
          }
        } catch (refreshError) {
          console.error('Debug - Token refresh error:', refreshError);
          isExpired = true;
          isConnected = false;
        }
      } else if (currentTime >= expirationTime) {
        // Token已过期，但无法自动刷新
        isExpired = true;
        isConnected = false;
        console.log('Debug - Token expired, cannot auto-refresh');
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
      has_records: isAuthorized,
      is_active: connection.is_active,
      is_expired: isExpired,
      connected_at: connection.connected_at,
      platform_username: connection.platform_username
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
      has_records: false,
      is_active: false,
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
