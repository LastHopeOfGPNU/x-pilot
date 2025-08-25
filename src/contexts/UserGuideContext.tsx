import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userGuideService, UserGuideStatus, UserGuideStep } from '../lib/userGuideService';
import { devConfigService } from '../lib/devConfigService';

// Context接口定义
interface UserGuideContextType {
  userGuideStatus: UserGuideStatus | null;
  loading: boolean;
  error: string | null;
  refreshUserGuideStatus: () => Promise<void>;
  startUserGuideStep: (step: UserGuideStep) => Promise<void>;
  completeUserGuideStep: (step: UserGuideStep) => Promise<void>;
  skipUserGuide: () => Promise<void>;
  resetUserGuide: () => Promise<void>;
}

// 创建Context
const UserGuideContext = createContext<UserGuideContextType | undefined>(undefined);

// Provider组件属性
interface UserGuideProviderProps {
  children: ReactNode;
}

// Provider组件
export const UserGuideProvider: React.FC<UserGuideProviderProps> = ({ children }) => {
  const [userGuideStatus, setUserGuideStatus] = useState<UserGuideStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户指导状态
  const fetchUserGuideStatus = async () => {
    // 检查是否启用用户指南
    if (!devConfigService.getEnableUserGuide()) {
      setUserGuideStatus({
        is_finished: true, // 设置为已完成，避免触发用户指南
        current_step: null,
        completed_steps: [],
        last_updated: new Date().toISOString()
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const status = await userGuideService.getUserGuideProgress();
      setUserGuideStatus(status);
    } catch (err) {
      console.error('Failed to fetch user guide status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      // API调用失败时，设置为已完成状态并标记错误，避免显示用户指导
      setUserGuideStatus({
        is_finished: true,
        current_step: null,
        completed_steps: [],
        last_updated: new Date().toISOString(),
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // 刷新用户指导状态
  const refreshUserGuideStatus = async () => {
    await fetchUserGuideStatus();
  };

  // 开始用户指导步骤
  const startUserGuideStep = async (step: UserGuideStep) => {
    // 检查是否启用用户指南
    if (!devConfigService.getEnableUserGuide()) {
      return;
    }

    try {
      setError(null);
      const updatedStatus = await userGuideService.updateUserGuideProgress(step, 'start');
      setUserGuideStatus(updatedStatus);
    } catch (err) {
      console.error('Failed to start user guide step:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // 完成用户指导步骤
  const completeUserGuideStep = async (step: UserGuideStep) => {
    // 检查是否启用用户指南
    if (!devConfigService.getEnableUserGuide()) {
      return;
    }

    try {
      setError(null);
      const updatedStatus = await userGuideService.updateUserGuideProgress(step, 'complete');
      setUserGuideStatus(updatedStatus);
    } catch (err) {
      console.error('Failed to complete user guide step:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // 跳过用户指导
  const skipUserGuide = async () => {
    // 检查是否启用用户指南
    if (!devConfigService.getEnableUserGuide()) {
      return;
    }

    try {
      setError(null);
      // 跳过所有步骤，直接标记为完成
      const updatedStatus = await userGuideService.updateUserGuideProgress('ai-chat', 'skip');
      setUserGuideStatus(updatedStatus);
    } catch (err) {
      console.error('Failed to skip user guide:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // 重置用户指导
  const resetUserGuide = async () => {
    // 检查是否启用用户指南
    if (!devConfigService.getEnableUserGuide()) {
      return;
    }

    try {
      setError(null);
      const resetStatus = await userGuideService.resetUserGuideProgress();
      setUserGuideStatus(resetStatus);
    } catch (err) {
      console.error('Failed to reset user guide:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // 初始化时获取状态，并监听配置变化
  useEffect(() => {
    fetchUserGuideStatus();

    // 监听开发配置变化
    const handleConfigChange = () => {
      fetchUserGuideStatus();
    };

    devConfigService.addListener(handleConfigChange);

    return () => {
      devConfigService.removeListener(handleConfigChange);
    };
  }, []);

  const value: UserGuideContextType = {
    userGuideStatus,
    loading,
    error,
    refreshUserGuideStatus,
    startUserGuideStep,
    completeUserGuideStep,
    skipUserGuide,
    resetUserGuide
  };

  return (
    <UserGuideContext.Provider value={value}>
      {children}
    </UserGuideContext.Provider>
  );
};

// Hook for using the context
export const useUserGuide = (): UserGuideContextType => {
  const context = useContext(UserGuideContext);
  if (context === undefined) {
    throw new Error('useUserGuide must be used within a UserGuideProvider');
  }
  return context;
};

export default UserGuideContext;