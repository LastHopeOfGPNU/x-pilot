import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onboardingService, OnboardingStatusResponse } from '../lib/onboardingService';
import { logger } from '../utils/logger';

interface OnboardingContextType {
  onboardingStatus: OnboardingStatusResponse | null;
  loading: boolean;
  error: string | null;
  refreshOnboardingStatus: () => Promise<void>;
  completeOnboarding: () => void;
  skipOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOnboardingStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isOnboardingMockMode = localStorage.getItem('dev-onboarding-mode') === 'true';
      
      if (isOnboardingMockMode) {
        const mockStatus: OnboardingStatusResponse = {
          is_finished: false,
          current_step: 'TWITTER_AUTH'
        };
        setOnboardingStatus(mockStatus);
        return;
      }

      const status = await onboardingService.getCurrentStep();
      setOnboardingStatus(status);
    } catch (err) {
      logger.error('Failed to fetch onboarding status:', err);
      setError('获取onboarding状态失败');
      // 如果获取失败，默认为已完成状态
      setOnboardingStatus({ is_finished: true, current_step: 'ENGAGEMENT' });
    } finally {
      setLoading(false);
    }
  };

  const refreshOnboardingStatus = async () => {
    await fetchOnboardingStatus();
  };

  const completeOnboarding = () => {
    setOnboardingStatus({ is_finished: true, current_step: 'ENGAGEMENT' });
  };

  const skipOnboarding = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await onboardingService.skipOnboarding();
      
      if (result.success) {
        setOnboardingStatus({
          is_finished: result.is_finished,
          current_step: result.current_step
        });
      } else {
        throw new Error('跳过onboarding失败');
      }
    } catch (err) {
      logger.error('Failed to skip onboarding:', err);
      setError('跳过onboarding失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingStatus();
  }, []);

  const value: OnboardingContextType = {
    onboardingStatus,
    loading,
    error,
    refreshOnboardingStatus,
    completeOnboarding,
    skipOnboarding
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};