import { supabase } from './supabase';
import { apiConfigService } from './apiConfigService';

// 用户指导步骤类型 - 保持与前端组件兼容
export type UserGuideStep = 'auto-reply-tab' | 'auto-repost-tab' | 'starred-tab' | 'ai-chat';

// 用户指导状态接口 - 内部使用
export interface UserGuideStatus {
  is_finished: boolean;           // 是否已完成所有指导步骤
  current_step: UserGuideStep | null;  // 当前步骤
  completed_steps: UserGuideStep[];    // 已完成的步骤
  last_updated: string;          // 最后更新时间
  error?: string;                // API调用错误信息
}

// API响应接口 - 匹配后端API规范
export interface UserGuideProgressResponse {
  dashboard: boolean;
  inspiration_account: boolean;
  engagement_queue: boolean;
  get_post: boolean;
  strategy: boolean;
  property: boolean;
}

// API请求接口 - 匹配后端API规范
export interface UserGuideProgressRequest {
  dashboard: boolean;
  inspiration_account: boolean;
  engagement_queue: boolean;
  get_post: boolean;
  strategy: boolean;
  property: boolean;
}

// API更新响应接口
export interface UserGuideUpdateResponse {
  code: number;
  msg: string;
  data: null;
}

// 步骤映射 - 前端步骤到API字段的映射
const STEP_MAPPING: Record<UserGuideStep, keyof UserGuideProgressResponse> = {
  'auto-reply-tab': 'engagement_queue',
  'auto-repost-tab': 'get_post', 
  'starred-tab': 'inspiration_account',
  'ai-chat': 'strategy'
};

// 更新用户指导进度请求接口 - 内部使用
interface UpdateUserGuideProgressRequest {
  step: UserGuideStep;
  action: 'start' | 'complete' | 'skip';
}

// 更新用户指导进度响应接口 - 内部使用
interface UpdateUserGuideProgressResponse {
  success: boolean;
  is_finished: boolean;
  current_step: UserGuideStep | null;
  completed_steps: UserGuideStep[];
  last_updated: string;
}

// 错误响应接口
export interface ErrorResponse {
  detail: string;
}

class UserGuideService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = apiConfigService.getApiBaseUrl();
    
    // 监听API配置变更
    apiConfigService.addListener((newUrl: string) => {
      this.baseUrl = newUrl;
    });
  }

  /**
   * 获取认证头
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * 将API响应转换为内部状态格式
   */
  private convertApiResponseToStatus(apiResponse: UserGuideProgressResponse): UserGuideStatus {
    const completedSteps: UserGuideStep[] = [];
    let currentStep: UserGuideStep | null = null;
    
    // 检查每个步骤的完成状态
    Object.entries(STEP_MAPPING).forEach(([step, apiField]) => {
      if (apiResponse[apiField]) {
        completedSteps.push(step as UserGuideStep);
      } else if (!currentStep) {
        // 第一个未完成的步骤作为当前步骤
        currentStep = step as UserGuideStep;
      }
    });
    
    // 检查是否所有步骤都已完成
    const allSteps = Object.keys(STEP_MAPPING) as UserGuideStep[];
    const isFinished = allSteps.every(step => completedSteps.includes(step));
    
    return {
      is_finished: isFinished,
      current_step: isFinished ? null : currentStep,
      completed_steps: completedSteps,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * 将内部状态转换为API请求格式
   */
  private convertStatusToApiRequest(status: UserGuideStatus): UserGuideProgressRequest {
    const apiRequest: UserGuideProgressRequest = {
      dashboard: false,
      inspiration_account: false,
      engagement_queue: false,
      get_post: false,
      strategy: false,
      property: false
    };
    
    // 根据已完成的步骤设置API字段
    status.completed_steps.forEach(step => {
      const apiField = STEP_MAPPING[step];
      if (apiField) {
        apiRequest[apiField] = true;
      }
    });
    
    return apiRequest;
  }

  /**
   * 获取用户指导进度
   */
  async getUserGuideProgress(): Promise<UserGuideStatus> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/user-guide`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: UserGuideProgressResponse = await response.json();
      return this.convertApiResponseToStatus(data);
    } catch (error) {
      console.error('Failed to get user guide progress:', error);
      throw error;
    }
  }

  /**
   * 更新用户指导进度
   */
  async updateUserGuideProgress(step: UserGuideStep, action: 'start' | 'complete' | 'skip'): Promise<UserGuideStatus> {

    try {
      // 获取当前状态
      const currentStatus = await this.getUserGuideProgress();
      let updatedStatus: UserGuideStatus;
      
      if (action === 'start') {
        updatedStatus = {
          ...currentStatus,
          current_step: step,
          last_updated: new Date().toISOString()
        };
      } else if (action === 'complete') {
        const completedSteps = [...currentStatus.completed_steps];
        if (!completedSteps.includes(step)) {
          completedSteps.push(step);
        }
        
        // 检查是否所有步骤都已完成
        const allSteps: UserGuideStep[] = ['auto-reply-tab', 'auto-repost-tab', 'starred-tab', 'ai-chat'];
        const isFinished = allSteps.every(s => completedSteps.includes(s));
        
        updatedStatus = {
          ...currentStatus,
          current_step: isFinished ? null : step,
          completed_steps: completedSteps,
          is_finished: isFinished,
          last_updated: new Date().toISOString()
        };
      } else { // skip
        updatedStatus = {
          ...currentStatus,
          is_finished: true,
          current_step: null,
          completed_steps: Object.keys(STEP_MAPPING) as UserGuideStep[],
          last_updated: new Date().toISOString()
        };
      }
      
      // 转换为API请求格式
      const apiRequest = this.convertStatusToApiRequest(updatedStatus);
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/api/user-guide`, {
        method: 'POST',
        headers,
        body: JSON.stringify(apiRequest)
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: UserGuideUpdateResponse = await response.json();
      
      // 检查响应是否成功
      if (data.code !== 200) {
        throw new Error(data.msg || 'Update failed');
      }
      
      return updatedStatus;
    } catch (error) {
      console.error('Failed to update user guide progress:', error);
      throw error;
    }
  }

  /**
   * 重置用户指导进度
   */
  async resetUserGuideProgress(): Promise<UserGuideStatus> {
    try {
      // 创建重置请求 - 所有字段设为false
      const resetRequest: UserGuideProgressRequest = {
        dashboard: false,
        inspiration_account: false,
        engagement_queue: false,
        get_post: false,
        strategy: false,
        property: false
      };
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/user-guide`, {
        method: 'POST',
        headers,
        body: JSON.stringify(resetRequest)
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: UserGuideUpdateResponse = await response.json();
      
      // 检查响应是否成功
      if (data.code !== 200) {
        throw new Error(data.msg || 'Reset failed');
      }
      
      // 返回重置后的状态
      return {
        is_finished: false,
        current_step: Object.keys(STEP_MAPPING)[0] as UserGuideStep,
        completed_steps: [],
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to reset user guide progress:', error);
      throw error;
    }
  }


}

// 导出单例实例
export const userGuideService = new UserGuideService();
export default userGuideService;