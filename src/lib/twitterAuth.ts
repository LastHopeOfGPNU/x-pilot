import { supabase } from './supabase';
import { logger } from '../utils/logger';

export interface TwitterAuthResult {
  user: any;
  session: any;
  provider_token?: string;
  provider_refresh_token?: string;
}

export class TwitterAuthService {
  /**
   * 使用 Supabase 原生 Twitter OAuth 登录
   * 这会自动处理 OAuth 流程并返回 Twitter token
   */
  async signInWithTwitter(): Promise<{ data: any; error: any }> {
    try {
      // 使用环境变量中的APP_URL，如果没有则回退到当前域名
      const redirectUrl = import.meta.env.VITE_APP_URL || window.location.origin
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${redirectUrl}/auth/supabase/twitter/callback`,
          scopes: 'tweet.read tweet.write users.read offline.access',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        logger.error('Supabase Twitter OAuth 错误:', error);
        throw new Error(`Twitter 登录失败: ${error.message}`);
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Twitter OAuth 登录失败:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Twitter 登录过程中发生未知错误') 
      };
    }
  }

  /**
   * 获取当前用户的 Twitter token
   * Supabase 会自动存储 provider_token
   */
  async getTwitterToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(`获取会话失败: ${error.message}`);
      }

      if (!session) {
        return null;
      }

      // Supabase 会在 session 中存储 provider_token
      return session.provider_token || null;
    } catch (error) {
      logger.error('获取 Twitter token 错误:', error);
      return null;
    }
  }

  /**
   * 获取 Twitter refresh token
   */
  async getTwitterRefreshToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      return session.provider_refresh_token || null;
    } catch (error) {
      logger.error('获取 Twitter refresh token 错误:', error);
      return null;
    }
  }

  /**
   * 刷新 Twitter token
   */
  async refreshTwitterToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw new Error(`刷新 token 失败: ${error.message}`);
      }

      return data.session?.provider_token || null;
    } catch (error) {
      logger.error('刷新 Twitter token 错误:', error);
      return null;
    }
  }

  /**
   * 使用 Twitter token 调用 Twitter API - 通过代理避免CORS问题
   */
  async callTwitterAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getTwitterToken();
    
    if (!token) {
      throw new Error('未找到 Twitter token，请先登录');
    }

    // 使用 Supabase Edge Function 作为代理
    const { data, error } = await supabase.functions.invoke('twitter-api-proxy', {
      body: {
        endpoint,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body as string) : undefined,
        headers: options.headers,
        accessToken: token
      }
    });

    if (error) {
      logger.error('Twitter API 代理调用失败:', error);
      throw new Error(`Twitter API 调用失败: ${error.message}`);
    }

    return data;
  }

  /**
   * 获取当前用户的 Twitter 信息
   */
  async getTwitterUserInfo(): Promise<any> {
    return this.callTwitterAPI('users/me?user.fields=id,name,username,profile_image_url');
  }

  /**
   * 发送推文
   */
  async postTweet(text: string): Promise<any> {
    return this.callTwitterAPI('tweets', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  /**
   * 登出并清除 Twitter 连接
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(`登出失败: ${error.message}`);
      }
    } catch (error) {
      logger.error('登出错误:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const twitterAuth = new TwitterAuthService();