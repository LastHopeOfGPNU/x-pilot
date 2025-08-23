import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Twitter连接状态响应接口
export interface TwitterConnectionStatus {
  has_records: boolean;
  is_active: boolean;
  is_expired: boolean;
  connected_at?: string;
  platform_username?: string;
}

// Twitter连接信息接口
export interface TwitterConnection {
  id?: string;
  user_id?: string;
  platform_user_id: string;
  platform_username: string;
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at?: string;
  scope?: string;
  connected_at?: string;
  is_active?: boolean;
}

// Twitter用户信息接口
export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  verified?: boolean;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

class TwitterService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly bearerToken: string;
  private readonly appUrl: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = import.meta.env.VITE_TWITTER_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_TWITTER_CLIENT_SECRET || '';
    this.bearerToken = import.meta.env.VITE_TWITTER_BEARER_TOKEN || '';
    this.appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5177';
    this.redirectUri = `${this.appUrl}/auth/twitter/direct/callback`;

    if (!this.clientId || !this.clientSecret) {

    }
  }

  // 检查Twitter API配置是否完整
  isConfigured(): boolean {
    return !!(
      this.clientId && 
      this.clientSecret && 
      this.clientId !== 'your_twitter_client_id' &&
      this.clientSecret !== 'your_twitter_client_secret'
    );
  }

  // 获取配置状态（用于调试）
  getConfigStatus() {
    return {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      redirectUri: this.redirectUri,
      clientIdLength: this.clientId?.length || 0,
      clientSecretLength: this.clientSecret?.length || 0,
      environment: {
        VITE_TWITTER_CLIENT_ID: !!import.meta.env.VITE_TWITTER_CLIENT_ID,
        VITE_TWITTER_CLIENT_SECRET: !!import.meta.env.VITE_TWITTER_CLIENT_SECRET,
        VITE_APP_URL: import.meta.env.VITE_APP_URL
      }
    };
  }

  // 生成随机字符串
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  // 生成PKCE代码挑战
  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // 获取Twitter OAuth授权URL
  async getAuthUrl(): Promise<string> {
    try {
      // 检查配置是否完整
      if (!this.isConfigured()) {
        throw new Error('Twitter API 配置不完整。请在 .env 文件中配置正确的 VITE_TWITTER_CLIENT_ID 和 VITE_TWITTER_CLIENT_SECRET');
      }

      // 生成state和code_verifier
      const state = this.generateRandomString(32);
      const codeVerifier = this.generateRandomString(128);
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);

      // 将state和code_verifier存储到localStorage
      localStorage.setItem('twitter_oauth_state', state);
      localStorage.setItem('twitter_code_verifier', codeVerifier);

      // 构建授权URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope: 'tweet.read tweet.write users.read offline.access',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
    } catch (error) {
      logger.error('Failed to get auth URL:', error);
      throw error;
    }
  }
  
  // 处理OAuth回调
  async handleCallback(code: string, state: string): Promise<{ success: boolean; data?: TwitterConnection; error?: string }> {
    try {
      // 验证state - 添加重试机制解决弹出窗口中localStorage同步延迟问题
      let storedState = localStorage.getItem('twitter_oauth_state');
      let retryCount = 0;
      const maxRetries = 5;
      
      // 如果第一次获取失败，重试几次（解决弹出窗口localStorage同步延迟问题）
      while (!storedState && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 等待200ms
        storedState = localStorage.getItem('twitter_oauth_state');
        retryCount++;
      }

      if (!storedState) {
        throw new Error('Authorization session not found. Please restart the connection process.');
      }

      if (storedState !== state) {
        throw new Error('Authorization verification failed. Please restart the connection process.');
      }

      // 获取code_verifier - 同样添加重试机制
      let codeVerifier = localStorage.getItem('twitter_code_verifier');
      retryCount = 0;
      
      while (!codeVerifier && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 200));
        codeVerifier = localStorage.getItem('twitter_code_verifier');
        retryCount++;
      }

      if (!codeVerifier) {
        throw new Error('Authorization verification code not found. Please restart the connection process.');
      }

      // 清理localStorage
      localStorage.removeItem('twitter_oauth_state');
      localStorage.removeItem('twitter_code_verifier');

      // 交换访问令牌
      const tokenResponse = await this.exchangeCodeForTokens(code, codeVerifier);
      
      // 获取用户信息
      const userInfo = await this.getUserInfo(tokenResponse.access_token);

      // 保存连接信息到数据库
      const connection = await this.saveConnection(tokenResponse, userInfo);

      return { success: true, data: connection };
    } catch (error) {
      logger.error('Failed to handle callback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  // 交换访问令牌 - 使用代理避免CORS问题
  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<any> {
    try {
      // 使用 Supabase Edge Function 作为代理
      const { data, error } = await supabase.functions.invoke('twitter-token-exchange', {
        body: {
          code,
          code_verifier: codeVerifier,
          redirect_uri: this.redirectUri
        }
      });

      if (error) {

        throw new Error(`Token exchange failed: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      logger.error('Failed to start Twitter auth:', error);
      throw error;
    }
  }

  // 获取用户信息 - 使用代理避免CORS问题
  private async getUserInfo(accessToken: string): Promise<TwitterUser> {
    // 使用 Supabase Edge Function 作为代理
    const { data, error } = await supabase.functions.invoke('twitter-api-proxy', {
      body: {
        endpoint: '/users/me?user.fields=id,username,name,profile_image_url,verified,public_metrics',
        method: 'GET',
        access_token: accessToken
      }
    });

    if (error) {
      logger.error('Failed to fetch user info:', error);
      throw new Error(`Failed to fetch user info: ${error.message}`);
    }

    return data.data;
  }

  // 保存连接信息到数据库
  private async saveConnection(tokenData: any, userInfo: TwitterUser): Promise<TwitterConnection> {
    // 获取当前session用于认证
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('用户未登录，无法保存 Twitter 连接');
    }

    // 调用边缘函数保存连接
    const { data, error } = await supabase.functions.invoke('save-twitter-connection', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        token_data: tokenData,
        user_info: userInfo
      }
    });

    if (error) {
      throw new Error(`Failed to save connection: ${error.message}`);
    }

    if (!data.success || !data.connection) {
      throw new Error('Failed to save connection: Invalid response from edge function');
    }

    return data.connection;
  }
  
  // 获取用户的Twitter连接
  async getUserConnection(): Promise<TwitterConnection | null> {
    try {
      // 先尝试获取当前session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return null;
      }
      
      if (!currentSession) {
        return null;
      }
      
      // 获取用户信息
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return null;
      }

      // 调用edge function检查Twitter连接
      const { data, error } = await supabase.functions.invoke('check-twitter-connection', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) {
        return null;
      }

      // 处理edge function的响应结构
      if (data && data.is_twitter_connected && data.connection_details) {
        return data.connection_details as TwitterConnection;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // 获取详细的连接状态信息
  async getConnectionStatus(): Promise<TwitterConnectionStatus | null> {
    try {
      // 先尝试获取当前session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return null;
      }
      
      if (!currentSession) {
        return null;
      }
      
      // 获取用户信息
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return null;
      }

      // 调用edge function检查Twitter连接
      const { data, error } = await supabase.functions.invoke('check-twitter-connection', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) {
        return null;
      }

      // 返回完整的状态信息
      return data as TwitterConnectionStatus;
    } catch (error) {
      return null;
    }
  }
  
  // 断开Twitter连接
  async disconnectTwitter(): Promise<{ success: boolean; error?: string }> {
    try {
      // 获取当前认证用户
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { success: false, error: '用户未登录' };
      }

      // 获取session来获取access_token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: false, error: '无法获取用户会话' };
      }

      // 调用edge function断开Twitter连接
      const { data, error } = await supabase.functions.invoke('disconnect-twitter-connection', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        logger.error('Failed to disconnect Twitter:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to disconnect Twitter:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // 基本的Twitter API调用方法 - 使用代理避免CORS问题
  async makeTwitterApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const connection = await this.getUserConnection();
    if (!connection) {
      throw new Error('Twitter not connected');
    }

    // 使用 Supabase Edge Function 作为代理
    const { data, error } = await supabase.functions.invoke('twitter-api-proxy', {
      body: {
        endpoint: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body as string) : undefined,
        headers: options.headers,
        access_token: connection.access_token
      }
    });

    if (error) {
      logger.error('Twitter API call failed:', error);
      throw new Error(`Twitter API call failed: ${error.message}`);
    }

    return data;
  }

  // 获取当前用户信息
  async getCurrentUser(): Promise<TwitterUser | null> {
    try {
      const data = await this.makeTwitterApiCall('users/me?user.fields=id,username,name,profile_image_url,verified,public_metrics');
      return data.data;
    } catch (error) {
      logger.error('Failed to get current user:', error);
      return null;
    }
  }

  // 检查连接状态
  async isConnected(): Promise<boolean> {
    const connection = await this.getUserConnection();
    return connection !== null && connection.is_active;
  }

  // 检查token是否过期并自动刷新
  async checkAndRefreshToken(): Promise<{ isValid: boolean; connection?: TwitterConnection | null }> {
    try {
      const connection = await this.getUserConnection();
      
      if (!connection || !connection.is_active) {
        return { isValid: false, connection: null };
      }

      // 检查token是否过期
      if (connection.expires_at) {
        const expiresAt = new Date(connection.expires_at);
        const now = new Date();
        
        // 如果token已过期或即将在5分钟内过期，尝试刷新
        if (expiresAt <= new Date(now.getTime() + 5 * 60 * 1000)) {
          try {
            await this.refreshTwitterToken();
            // 重新获取更新后的连接信息
            const refreshedConnection = await this.getUserConnection();
            return { isValid: true, connection: refreshedConnection };
          } catch (refreshError) {
            logger.error('Failed to refresh token:', refreshError);
            return { isValid: false, connection };
          }
        }
      }

      return { isValid: true, connection };
    } catch (error) {
      logger.error('Error checking token validity:', error);
      return { isValid: false, connection: null };
    }
  }

  // 获取当前认证用户
  async getCurrentAppUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    return error ? null : user;
  }

  // 启动Twitter OAuth流程
  async startTwitterAuth(): Promise<void> {
    try {
      const authUrl = await this.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      logger.error('Failed to post tweet:', error);
      throw error;
    }
  }

  // 发送推文
  async postTweet(text: string): Promise<any> {
    try {
      const result = await this.makeTwitterApiCall('tweets', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      return result;
    } catch (error) {

      throw error;
    }
  }

  // 刷新Twitter token - 使用代理避免CORS问题
  async refreshTwitterToken(): Promise<string | null> {
    try {
      const connection = await this.getUserConnection();
      if (!connection || !connection.refresh_token) {
        throw new Error('No refresh token available');
      }

      // 获取当前session用于认证
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('用户未登录');
      }

      // 使用 Supabase Edge Function 刷新token（现在包含数据库更新）
      const { data, error } = await supabase.functions.invoke('twitter-refresh-token', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          refresh_token: connection.refresh_token
        }
      });

      if (error) {
        throw new Error(`Failed to refresh token: ${error.message}`);
      }

      const tokenData = data;
      
      // twitter-refresh-token边缘函数现在已经处理了数据库更新
      // 直接返回新的access token
      return tokenData.access_token;
    } catch (error) {
      throw error;
    }
  }
  
}

// 导出单例实例
export const twitterService = new TwitterService();