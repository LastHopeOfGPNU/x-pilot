import { supabase } from './supabase';
import { logger } from '../utils/logger';

export interface TwitterApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Twitter API 代理服务
 * 通过 Supabase Edge Functions 调用 Twitter API，避免 CORS 问题
 */
export class TwitterApiProxy {
  
  /**
   * 通过代理调用 Twitter API
   */
  async callTwitterAPI<T = any>(
    endpoint: string, 
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<TwitterApiResponse<T>> {
    try {
      // 获取当前用户的 Twitter token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return {
          success: false,
          error: '用户未登录或会话已过期'
        };
      }

      const twitterToken = session.provider_token;
      if (!twitterToken) {
        return {
          success: false,
          error: '未找到 Twitter 访问令牌，请重新连接 Twitter 账户'
        };
      }

      // 调用 Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('twitter-api-proxy', {
        body: {
          endpoint,
          method: options.method || 'GET',
          body: options.body,
          headers: options.headers,
          accessToken: twitterToken
        }
      });

      if (error) {
        logger.error('Twitter API 代理调用失败:', error);
        return {
          success: false,
          error: `API 调用失败: ${error.message}`
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      logger.error('Twitter API 代理错误:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取当前用户的 Twitter 信息
   */
  async getCurrentUser(): Promise<TwitterApiResponse> {
    return this.callTwitterAPI('users/me?user.fields=id,name,username,profile_image_url,verified,public_metrics');
  }

  /**
   * 发送推文
   */
  async postTweet(text: string): Promise<TwitterApiResponse> {
    return this.callTwitterAPI('tweets', {
      method: 'POST',
      body: { text }
    });
  }

  /**
   * 获取用户的推文
   */
  async getUserTweets(userId: string, maxResults: number = 10): Promise<TwitterApiResponse> {
    return this.callTwitterAPI(`users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics`);
  }

  /**
   * 搜索推文
   */
  async searchTweets(query: string, maxResults: number = 10): Promise<TwitterApiResponse> {
    const encodedQuery = encodeURIComponent(query);
    return this.callTwitterAPI(`tweets/search/recent?query=${encodedQuery}&max_results=${maxResults}&tweet.fields=created_at,public_metrics,author_id`);
  }

  /**
   * 关注用户
   */
  async followUser(targetUserId: string): Promise<TwitterApiResponse> {
    const userInfo = await this.getCurrentUser();
    if (!userInfo.success || !userInfo.data?.data?.id) {
      return {
        success: false,
        error: '无法获取当前用户信息'
      };
    }

    return this.callTwitterAPI(`users/${userInfo.data.data.id}/following`, {
      method: 'POST',
      body: { target_user_id: targetUserId }
    });
  }

  /**
   * 取消关注用户
   */
  async unfollowUser(targetUserId: string): Promise<TwitterApiResponse> {
    const userInfo = await this.getCurrentUser();
    if (!userInfo.success || !userInfo.data?.data?.id) {
      return {
        success: false,
        error: '无法获取当前用户信息'
      };
    }

    return this.callTwitterAPI(`users/${userInfo.data.data.id}/following/${targetUserId}`, {
      method: 'DELETE'
    });
  }

  /**
   * 点赞推文
   */
  async likeTweet(tweetId: string): Promise<TwitterApiResponse> {
    const userInfo = await this.getCurrentUser();
    if (!userInfo.success || !userInfo.data?.data?.id) {
      return {
        success: false,
        error: '无法获取当前用户信息'
      };
    }

    return this.callTwitterAPI(`users/${userInfo.data.data.id}/likes`, {
      method: 'POST',
      body: { tweet_id: tweetId }
    });
  }

  /**
   * 取消点赞推文
   */
  async unlikeTweet(tweetId: string): Promise<TwitterApiResponse> {
    const userInfo = await this.getCurrentUser();
    if (!userInfo.success || !userInfo.data?.data?.id) {
      return {
        success: false,
        error: '无法获取当前用户信息'
      };
    }

    return this.callTwitterAPI(`users/${userInfo.data.data.id}/likes/${tweetId}`, {
      method: 'DELETE'
    });
  }

  /**
   * 转发推文
   */
  async retweetTweet(tweetId: string): Promise<TwitterApiResponse> {
    const userInfo = await this.getCurrentUser();
    if (!userInfo.success || !userInfo.data?.data?.id) {
      return {
        success: false,
        error: '无法获取当前用户信息'
      };
    }

    return this.callTwitterAPI(`users/${userInfo.data.data.id}/retweets`, {
      method: 'POST',
      body: { tweet_id: tweetId }
    });
  }

  /**
   * 取消转发推文
   */
  async unretweetTweet(tweetId: string): Promise<TwitterApiResponse> {
    const userInfo = await this.getCurrentUser();
    if (!userInfo.success || !userInfo.data?.data?.id) {
      return {
        success: false,
        error: '无法获取当前用户信息'
      };
    }

    return this.callTwitterAPI(`users/${userInfo.data.data.id}/retweets/${tweetId}`, {
      method: 'DELETE'
    });
  }
}

// 导出单例实例
export const twitterApiProxy = new TwitterApiProxy();