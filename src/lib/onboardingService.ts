import { supabase } from './supabase';
import { apiConfigService } from './apiConfigService';

// Onboarding步骤类型
export type OnboardingStep = 'START' | 'CONNECT' | 'PICK_ACCOUNTS' | 'ENGAGEMENT';

// Onboarding状态响应接口
export interface OnboardingStatusResponse {
  is_finished: boolean;
  current_step: OnboardingStep;
}

// Onboarding前进响应接口
export interface OnboardingForwardResponse {
  success: boolean;
  current_step: OnboardingStep;
  is_finished: boolean;
}

// Mock data for development
let mockOnboardingState = {
  current_step: 'START' as OnboardingStep,
  is_finished: false,
};

const stepOrder: OnboardingStep[] = ['START', 'CONNECT', 'PICK_ACCOUNTS', 'ENGAGEMENT'];

class OnboardingService {
  // Mock implementation for development
  async getCurrentStep(): Promise<OnboardingStatusResponse> {
    // Mock implementation - 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Mock: Getting current onboarding step:', mockOnboardingState);
    return { ...mockOnboardingState };
  }

  async moveToNextStep(): Promise<OnboardingForwardResponse> {
    // Mock implementation - 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const currentIndex = stepOrder.indexOf(mockOnboardingState.current_step);
    
    if (currentIndex < stepOrder.length - 1) {
      // 移动到下一步
      mockOnboardingState.current_step = stepOrder[currentIndex + 1];
    } else {
      // 已完成所有步骤
      mockOnboardingState.is_finished = true;
    }
    
    console.log('Mock: Moving to next step:', mockOnboardingState);
    return {
      success: true,
      current_step: mockOnboardingState.current_step,
      is_finished: mockOnboardingState.is_finished
    };
  }

  // 完成当前步骤并移动到下一步 (Mock implementation)
  async completeStep(currentStep: OnboardingStep): Promise<OnboardingForwardResponse> {
    // Mock implementation - 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.log('Mock: Completing step:', currentStep);
    
    // 验证当前步骤是否匹配
    if (mockOnboardingState.current_step !== currentStep) {
      console.warn('Mock: Step mismatch, syncing state');
      mockOnboardingState.current_step = currentStep;
    }
    
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      // 移动到下一步
      mockOnboardingState.current_step = stepOrder[currentIndex + 1];
    } else {
      // 已完成所有步骤
      mockOnboardingState.is_finished = true;
    }
    
    console.log('Mock: Step completed, new state:', mockOnboardingState);
    return {
      success: true,
      current_step: mockOnboardingState.current_step,
      is_finished: mockOnboardingState.is_finished
    };
  }

  // 重置mock状态的辅助方法（用于测试）
  resetMockState() {
    mockOnboardingState = {
      current_step: 'START',
      is_finished: false,
    };
    console.log('Mock: Reset onboarding state');
  }

  /* 真实API实现（暂时注释掉）
  private get baseUrl(): string {
    return apiConfigService.getApiBaseUrl();
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

  // 获取当前onboarding步骤
  async getCurrentStep(): Promise<OnboardingStatusResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const url = `${this.baseUrl}/api/onboarding/step`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting onboarding step:', error);
      throw error;
    }
  }

  // 前进到下一步
  async moveToNextStep(): Promise<OnboardingForwardResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const url = `${this.baseUrl}/api/onboarding/step/forward`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error moving to next step:', error);
      throw error;
    }
  }
  */
}

// 导出单例实例
export const onboardingService = new OnboardingService();
export default onboardingService;