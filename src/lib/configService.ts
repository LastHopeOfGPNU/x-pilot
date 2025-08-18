import { supabase } from './supabase';
import { apiConfigService } from './apiConfigService';

// 配置项接口定义
export interface ConfigItem {
  id: string;
  type: 'reply' | 'repost';
  name: string;
  description: string;
  reply_style: string;
  prompt_content: string;
  example_content: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// 配置列表响应接口
export interface ConfigsListResponse {
  data: ConfigItem[];
  pagination: {
    page_num: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

// 配置详情响应接口
export interface ConfigResponse {
  id: string;
  type: 'reply' | 'repost';
  name: string;
  description: string;
  reply_style: string;
  prompt_content: string;
  example_content: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Error response interface
export interface ErrorResponse {
  detail: string;
}

class ConfigService {
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

  // 获取配置列表
  async getConfigs(params?: {
    type?: 'reply' | 'repost';
    q?: string;
    page_num?: number;
    page_size?: number;
  }): Promise<ConfigsListResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      // 构建查询参数
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.append('type', params.type);
      if (params?.q) searchParams.append('q', params.q);
      if (params?.page_num) searchParams.append('page_num', params.page_num.toString());
      if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

      const url = `${this.baseUrl}/api/configs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {

      throw error;
    }
  }

  // 根据ID获取单个配置详情
  async getConfigById(configId: string): Promise<ConfigItem> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}/api/configs/${configId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get configuration details: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }
}

// 导出单例实例
export const configService = new ConfigService();