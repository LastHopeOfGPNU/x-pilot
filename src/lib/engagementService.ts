import { Card } from '../types/index';
import { supabase } from './supabase';
import { apiConfigService } from './apiConfigService';
import { logger } from '../utils/logger';

// 互动队列API响应类型（实际API返回的扁平化结构）
interface EngagementItem {
  id: string;
  user_id: string;
  tweet_id: string;
  tweet_text: string;
  tweet_author_id: string;
  tweet_author_username: string;
  tweet_author_display_name: string;
  tweet_author_profile_image_url: string;
  tweet_author_verified: boolean;
  tweet_reply_count: number;
  tweet_repost_count: number;
  tweet_like_count: number;
  tweet_view_count: number;
  tweet_created_at: string;
  interaction_type: 'autoReply' | 'autoRepost';
  suggested_content: string;
  status: 'pending' | 'posted' | 'rejected';
  priority: number;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface EngagementsListResponse {
  data: EngagementItem[];
  pagination: {
    page_num: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

interface PostReplyRequest {
  engagement_id: string;
  content: string;
}

interface PostReplyResponse {
  success: boolean;
  message: string;
  tweet_id?: string;
  posted_at?: string;
}

interface RejectReplyRequest {
  engagement_id: string;
}

interface RejectReplyResponse {
  success: boolean;
  message: string;
  rejected_at?: string;
}

class EngagementService {
  private get baseUrl(): string {
    return apiConfigService.getApiBaseUrl();
  }
  
  constructor() {
    // baseUrl 现在通过 getter 动态获取
  }
  
  // 获取认证头
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('用户未登录');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }

  // 获取互动队列列表
  async getEngagements(params?: {
    type?: 'reply' | 'repost';
    status?: 'pending' | 'posted' | 'rejected';
    page_num?: number;
    page_size?: number;
  }): Promise<EngagementsListResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const searchParams = new URLSearchParams();
      
      if (params?.type) {
        // API使用interaction_type参数，并且reply对应autoReply
        const interactionType = params.type === 'reply' ? 'autoReply' : 'autoRepost';
        searchParams.append('interaction_type', interactionType);
      }
      if (params?.status) {
        searchParams.append('status', params.status);
      }
      if (params?.page_num) {
        searchParams.append('page_num', params.page_num.toString());
      }
      if (params?.page_size) {
        searchParams.append('page_size', params.page_size.toString());
      }

      const url = `${this.baseUrl}/api/engagements${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      
      // 直接调用API接口
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  // 发布回复
  async postReply(request: PostReplyRequest): Promise<PostReplyResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const url = `${this.baseUrl}/api/engagements/reply`;
      
      // 直接调用API接口
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error in postReply:', error);
      throw error;
    }
  }

  // 拒绝回复
  async rejectReply(request: RejectReplyRequest): Promise<RejectReplyResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const url = `${this.baseUrl}/api/engagements/reply`;
      
      // 直接调用API接口
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error in rejectReply:', error);
      throw error;
    }
  }

  // 将API响应转换为Card类型
  transformToCard(item: EngagementItem): Card {
    return {
      id: item.id,
      type: 'tweet',
      content: item.tweet_text,
      author: item.tweet_author_display_name,
      handle: `@${item.tweet_author_username}`,
      avatar: item.tweet_author_profile_image_url,
      time: this.formatTime(item.tweet_created_at),
      likes: item.tweet_like_count,
      retweets: item.tweet_repost_count,
      replies: item.tweet_reply_count,
      views: item.tweet_view_count,
      stats: {
        comments: item.tweet_reply_count,
        retweets: item.tweet_repost_count,
        likes: item.tweet_like_count,
        views: item.tweet_view_count,
        bookmarks: 0 // API中没有提供bookmarks数据
      },
      suggestedReply: item.suggested_content,
      replyActions: {
        reject: true,
        postReply: true
      },
      tweetId: item.tweet_id,
      username: item.tweet_author_username
    };
  }

  // 格式化时间显示
  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }
}

export const engagementService = new EngagementService();