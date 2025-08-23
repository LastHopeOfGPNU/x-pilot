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
      success: false,
      error: 'Supabase configuration missing'
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
      success: false,
      error: 'No valid bearer token provided'
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
        success: false,
        error: 'Invalid authentication token'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    console.log('Debug - Disconnecting Twitter for user:', user.id);
    
    // 查询当前用户的Twitter连接记录（每个用户只有一条记录）
    const { data: connection, error: queryError } = await supabase
      .from('user_social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'twitter')
      .single();
    
    if (queryError) {
      console.log('Debug - Query error:', queryError);
      
      // 如果没有找到记录，说明用户没有Twitter连接
      if (queryError.code === 'PGRST106') {
        return new Response(JSON.stringify({
          success: true,
          message: 'No Twitter connection found',
          was_active: false
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: `Database query error: ${queryError.message}`
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    console.log('Debug - Found connection:', { connection });
    
    // 检查连接是否已经是非活跃状态
    if (connection.is_active === false) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Twitter connection already disconnected',
        was_active: false
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // 将Twitter连接设置为非活跃状态（保留记录，只更新is_active字段）
    const { data: updateResult, error: updateError } = await supabase
      .from('user_social_connections')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('platform', 'twitter')
      .select()
      .single();
    
    if (updateError) {
      console.log('Debug - Update error:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to disconnect Twitter: ${updateError.message}`
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    console.log('Debug - Update result:', updateResult);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Twitter connection disconnected successfully',
      was_active: true,
      updated_connection: updateResult
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (catchError) {
    console.log('Debug - Unexpected error:', catchError);
    return new Response(JSON.stringify({
      success: false,
      error: catchError instanceof Error ? catchError.message : 'Unknown error occurred',
      error_type: 'unexpected_error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});