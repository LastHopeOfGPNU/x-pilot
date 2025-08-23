import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Twitter, Users, Zap, Sparkles, Loader2, AlertCircle, Star, MessageCircle, Target, Settings } from 'lucide-react';
import { onboardingService, OnboardingStep } from '../../lib/onboardingService';
import { twitterService, TwitterConnection, TwitterConnectionStatus } from '../../lib/twitterService';
import { inspirationAccountService } from '../../lib/inspirationAccountService';
import { useAuth } from '../../contexts/AuthContext';
import { InspirationAccount } from '../../types';
import EnvSwitcher from '../config/EnvSwitcher';
import ConfirmationModal from './ConfirmationModal';

interface OnboardingProps {
  onComplete: () => void;
  initialStep?: string;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialStep = 'START' }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep as OnboardingStep);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twitterConnection, setTwitterConnection] = useState<TwitterConnection | null>(null);
  const [twitterStatus, setTwitterStatus] = useState<TwitterConnectionStatus | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [inspirationAccounts, setInspirationAccounts] = useState<InspirationAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const { user } = useAuth();
  
  // Fetch inspiration accounts from API or use mock data
  const fetchInspirationAccounts = async () => {
    try {
      setAccountsLoading(true);
      
      // Check if we're in mock mode
      const mockMode = localStorage.getItem('dev-onboarding-mode') === 'true';
      
      try {
        // Always make real API request to get actual content
        const response = await inspirationAccountService.getInspirationAccounts({
          type: 'outreach',
          page_size: 20
        });
        
        const transformedAccounts = response.data.map(account => 
          inspirationAccountService.transformToInspirationAccount(account)
        );
        
        setInspirationAccounts(transformedAccounts);
      } catch (apiError) {
        console.error('API request failed:', apiError);
        
        // In mock mode, fallback to mock data if API fails
        if (mockMode) {
          console.log('API failed, using mock inspiration accounts data in mock mode');
          const mockAccounts = [
            { id: 1, username: 'elonmusk', display_name: 'Elon Musk', followers_count: 150000000, starred: false, isTargeted: false, profile_image_url: 'https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg' },
            { id: 2, username: 'naval', display_name: 'Naval', followers_count: 2000000, starred: false, isTargeted: false, profile_image_url: 'https://pbs.twimg.com/profile_images/1296667294148382721/9Pr6XrPB_400x400.jpg' },
            { id: 3, username: 'paulg', display_name: 'Paul Graham', followers_count: 1500000, starred: false, isTargeted: false, profile_image_url: 'https://pbs.twimg.com/profile_images/1723071264038912000/yr1KSdaM_400x400.jpg' },
            { id: 4, username: 'sama', display_name: 'Sam Altman', followers_count: 3000000, starred: false, isTargeted: false, profile_image_url: 'https://pbs.twimg.com/profile_images/1696002545646563328/ytsX5Eme_400x400.jpg' },
            { id: 5, username: 'dhh', display_name: 'DHH', followers_count: 800000, starred: false, isTargeted: false, profile_image_url: 'https://pbs.twimg.com/profile_images/1397357516779687936/QKjqKzKJ_400x400.jpg' }
          ];
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          setInspirationAccounts(mockAccounts);
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Failed to fetch inspiration accounts:', error);
      setError('Failed to load inspiration accounts');
    } finally {
      setAccountsLoading(false);
    }
  };

  // Initialize component - only basic setup, no API calls
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setLoading(true);
        
        // Basic initialization without API calls
        console.log('Onboarding component initialized');
        
      } catch (error) {
        console.error('Failed to initialize onboarding component:', error);
        setError(`Failed to initialize: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    initializeComponent();
  }, [user]);

  // Check Twitter connection when entering CONNECT step
  useEffect(() => {
    const checkTwitterConnection = async () => {
      if (currentStep === 'CONNECT') {
        const mockMode = localStorage.getItem('dev-onboarding-mode') === 'true';
        
        if (!user && !mockMode) {
          console.log('No user and not in mock mode - skipping Twitter connection check');
          return;
        }

        setConnectLoading(true);
        try {
          // Always try real API request first
          const status = await twitterService.getConnectionStatus();
          setTwitterStatus(status);
          
          // Also get connection details if has records and is active
          if (status.has_records && status.is_active) {
            const connection = await twitterService.getUserConnection();
            setTwitterConnection(connection);
          } else {
            setTwitterConnection(null);
          }
        } catch (error) {
          console.error('Error checking Twitter connection:', error);
          // In mock mode, simulate connection status
          if (mockMode) {
            console.log('Mock mode - simulating Twitter connection status');
            setTwitterConnection(null); // Default to not connected for testing
            setTwitterStatus({
              has_records: false,
              is_active: false,
              is_expired: false
            });
          }
        } finally {
          setConnectLoading(false);
        }
      }
    };

    checkTwitterConnection();
  }, [currentStep, user]);

  // Fetch inspiration accounts when entering PICK_ACCOUNTS step
  useEffect(() => {
    const loadInspirationAccounts = async () => {
      if (currentStep === 'PICK_ACCOUNTS' && inspirationAccounts.length === 0) {
        await fetchInspirationAccounts();
      }
    };

    loadInspirationAccounts();
  }, [currentStep]);

  // Handle account selection toggle (both star and target)
  const handleAccountToggle = (accountId: number) => {
    const account = inspirationAccounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    const newSelectedState = !account.starred;
    
    // Update UI state locally
    setInspirationAccounts(prev => 
      prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, starred: newSelectedState, isTargeted: newSelectedState }
          : acc
      )
    );
    
    // Update selected accounts for validation
    setSelectedAccounts(prev => {
      if (newSelectedState) {
        return [...prev, accountId];
      } else {
        return prev.filter(id => id !== accountId);
      }
    });
  };
  
  // Removed handleBenchmarkToggle as it's now combined with handleAccountToggle
  
  // Check if can continue (at least 3 accounts selected)
  const canContinuePickAccounts = () => {
    const starredCount = inspirationAccounts.filter(acc => acc.starred).length;
    return starredCount >= 3;
  };

  const handleNextStep = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      // If we're on PICK_ACCOUNTS step, use batch APIs for star and target
       if (currentStep === 'PICK_ACCOUNTS') {
         const mockMode = localStorage.getItem('dev-onboarding-mode') === 'true';
         
         if (!mockMode) {
           const selectedAccountIds = inspirationAccounts
             .filter(acc => acc.starred)
             .map(acc => acc.id);
           
           if (selectedAccountIds.length > 0) {
             try {
               // Use batch APIs - batch-target and batch-star
               await Promise.all([
                 inspirationAccountService.batchSetAccountsAsTarget(selectedAccountIds, 'add'),
                 inspirationAccountService.batchToggleStarAccounts(selectedAccountIds, 'add')
               ]);
             } catch (error) {
               console.error('Failed to save inspiration accounts:', error);
               setError('Failed to save inspiration accounts');
               return;
             }
           }
         } else {
           console.log('Mock mode - skipping account processing API calls but progressing step');
         }
       }
      
      const nextStep = await onboardingService.completeStep(currentStep);
      
      if (nextStep.is_finished) {
        setIsFinished(true);
        onComplete();
      } else {
        setCurrentStep(nextStep.current_step);
      }
    } catch (error) {
      console.error('Failed to proceed to next step:', error);
      setError('Failed to proceed to next step');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreviousStep = () => {
    const steps: OnboardingStep[] = ['START', 'CONNECT', 'PICK_ACCOUNTS', 'ENGAGEMENT'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleConnectTwitter = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      // 首先检查是否已有连接且token是否有效
      const tokenCheck = await twitterService.checkAndRefreshToken();
      
      if (tokenCheck.isValid && tokenCheck.connection) {
        // Token有效，更新连接状态
        setTwitterConnection(tokenCheck.connection);
        setActionLoading(false);
        console.log('Twitter connection is valid and refreshed if needed');
        return;
      }
      
      // 如果没有有效连接，启动新的OAuth流程
      const authUrl = await twitterService.getAuthUrl();
      const popup = window.open(authUrl, '_blank', 'width=600,height=600');
      
      // 监听来自弹出窗口的消息
      const handleMessage = (event: MessageEvent) => {
        // 验证消息来源
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data.type === 'TWITTER_AUTH_SUCCESS') {
          // 授权成功，更新连接状态
          setTwitterConnection(event.data.data);
          setActionLoading(false);
          setError(null);
          window.removeEventListener('message', handleMessage);
          console.log('Twitter authorization successful via popup');
        } else if (event.data.type === 'TWITTER_AUTH_ERROR') {
          // 授权失败
          setError(event.data.error || 'Twitter authorization failed');
          setActionLoading(false);
          window.removeEventListener('message', handleMessage);
          console.error('Twitter authorization failed:', event.data.error);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // 检查弹出窗口是否被关闭（用户手动关闭）
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setActionLoading(false);
          window.removeEventListener('message', handleMessage);
          // 不设置错误，因为用户可能是主动取消的
        }
      }, 1000);
      
      // 5分钟后停止监听（超时保护）
      setTimeout(() => {
        clearInterval(checkClosed);
        setActionLoading(false);
        window.removeEventListener('message', handleMessage);
        if (!popup?.closed) {
          setError('Authorization timeout. Please try again.');
        }
      }, 300000);
      
    } catch (error) {
      console.error('Failed to connect Twitter:', error);
      setError('Failed to connect Twitter account');
      setActionLoading(false);
    }
  };

  // 重连函数 - 数据库覆盖刷新
  const handleReconnectTwitter = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      // 重连时直接启动OAuth流程，不检查现有token（数据库覆盖刷新）
      const authUrl = await twitterService.getAuthUrl();
      const popup = window.open(authUrl, '_blank', 'width=600,height=600');
      
      // 监听来自弹出窗口的消息
      const handleMessage = (event: MessageEvent) => {
        // 验证消息来源
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data.type === 'TWITTER_AUTH_SUCCESS') {
          // 授权成功，更新连接状态
          setTwitterConnection(event.data.data);
          setActionLoading(false);
          setError(null);
          window.removeEventListener('message', handleMessage);
          console.log('Twitter reconnection successful via popup - database overwrite refresh');
        } else if (event.data.type === 'TWITTER_AUTH_ERROR') {
          // 授权失败
          setError(event.data.error || 'Twitter reconnection failed');
          setActionLoading(false);
          window.removeEventListener('message', handleMessage);
          console.error('Twitter reconnection failed:', event.data.error);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // 检查弹出窗口是否被关闭（用户手动关闭）
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setActionLoading(false);
          window.removeEventListener('message', handleMessage);
          // 不设置错误，因为用户可能是主动取消的
        }
      }, 1000);
      
      // 5分钟后停止监听（超时保护）
      setTimeout(() => {
        clearInterval(checkClosed);
        setActionLoading(false);
        window.removeEventListener('message', handleMessage);
        if (!popup?.closed) {
          setError('Reconnection timeout. Please try again.');
        }
      }, 300000);
      
    } catch (error) {
      console.error('Failed to reconnect Twitter:', error);
      setError('Failed to reconnect Twitter account');
      setActionLoading(false);
    }
  };

  const handleDisconnectTwitter = () => {
    setShowDisconnectModal(true);
  };

  const confirmDisconnectTwitter = async () => {
    try {
      setDisconnectLoading(true);
      setError(null);
      
      const result = await twitterService.disconnectTwitter();
      if (result.success) {
        // 清除本地状态
        setTwitterConnection(null);
        setTwitterStatus(null);
        
        // 重新检查连接状态以确保界面同步
        const checkTwitterConnection = async () => {
          if (currentStep === 'CONNECT') {
            const mockMode = localStorage.getItem('dev-onboarding-mode') === 'true';
            
            if (!user && !mockMode) {
              console.log('No user and not in mock mode - skipping Twitter connection check');
              return;
            }

            setConnectLoading(true);
            try {
              // Always try real API request first
              const status = await twitterService.getConnectionStatus();
              setTwitterStatus(status);
              
              // Also get connection details if connected
              if (status.is_twitter_connected) {
                const connection = await twitterService.getUserConnection();
                setTwitterConnection(connection);
              } else {
                setTwitterConnection(null);
              }
            } catch (error) {
              console.error('Error checking Twitter connection:', error);
              // In mock mode, simulate connection status
              if (mockMode) {
                console.log('Mock mode - simulating Twitter connection status');
                setTwitterConnection(null); // Default to not connected for testing
                setTwitterStatus({
                  has_records: false,
                  is_active: false,
                  is_expired: false
                });
              }
            } finally {
              setConnectLoading(false);
            }
          }
        };
        
        await checkTwitterConnection();
        console.log('Twitter connection successfully disconnected');
        setShowDisconnectModal(false);
      } else {
        setError(result.error || 'Failed to disconnect Twitter account');
      }
    } catch (error) {
      console.error('Failed to disconnect Twitter:', error);
      setError('Failed to disconnect Twitter account');
    } finally {
      setDisconnectLoading(false);
    }
  };

  // Custom X Icon component
  const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 w-12 h-12 text-red-600" />
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-br from-[#4792E6] to-[#4792E6]/80 text-white rounded-lg hover:from-[#4792E6]/90 hover:to-[#4792E6]/70 transition-all duration-300 shadow-md hover:shadow-lg border border-[#4792E6]/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { 
      id: 'START', 
      name: 'Welcome', 
      icon: Sparkles,
      completed: ['CONNECT', 'PICK_ACCOUNTS', 'ENGAGEMENT'].includes(currentStep) 
    },
    { 
      id: 'CONNECT', 
      name: 'Connect X', 
      icon: XIcon,
      completed: ['PICK_ACCOUNTS', 'ENGAGEMENT'].includes(currentStep) 
    },
    { 
      id: 'PICK_ACCOUNTS', 
      name: 'Pick Accounts', 
      icon: Users,
      completed: ['ENGAGEMENT'].includes(currentStep) 
    },
    { 
      id: 'ENGAGEMENT', 
      name: 'Setup Complete', 
      icon: Zap,
      completed: false 
    }
  ];

  return (
    <div className="overflow-y-auto min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container flex flex-col px-4 py-4 mx-auto min-h-full sm:py-8">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-12">
          <div className="flex justify-center items-center">
            <div className="flex items-center px-4 space-x-2 w-full max-w-5xl sm:space-x-4 md:space-x-8 lg:space-x-12">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col flex-1 items-center min-w-0">
                      <div className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 transition-all duration-200 ${
                        step.id === currentStep
                          ? 'bg-gradient-to-br from-[#4792E6] to-[#4792E6]/80 border-[#4792E6] text-white shadow-lg scale-110'
                          : step.completed
                          ? 'bg-gradient-to-br from-[#4792E6]/90 to-[#4792E6]/70 border-[#4792E6]/80 text-white shadow-md'
                          : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                        ) : step.id === currentStep ? (
                          <StepIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                        ) : (
                          <span className="text-sm font-bold sm:text-base">{index + 1}</span>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <span className={`text-xs sm:text-sm font-medium block leading-tight ${
                          step.id === currentStep ? 'text-[#4792E6]' : step.completed ? 'text-[#4792E6]' : 'text-gray-500'
                        }`}>
                          {step.name}
                        </span>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex flex-shrink-0 justify-center items-center">
                        <div className={`w-8 sm:w-12 md:w-16 lg:w-20 h-0.5 transition-colors duration-200 ${
                          step.completed ? 'bg-gradient-to-r from-[#4792E6]/80 to-[#4792E6]/60' : 'bg-gray-300'
                        }`} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mx-auto max-w-4xl">
          {/* START Step */}
          {currentStep === 'START' && (
            <div className="p-4 rounded-2xl border shadow-lg backdrop-blur-sm bg-white/60 border-gray-200/30 sm:p-8 md:p-12">
              <div className="text-center">
                <div className="mb-6 sm:mb-12">
                  <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl sm:mb-6">
                    Introducing <span className="text-blue-600">X Pilot</span>
                  </h1>
                  <p className="mb-2 text-lg text-gray-600 sm:text-xl">
                    X Pilot is an AI-powered growth assistant for X (formerly Twitter).
                  </p>
                  <p className="mb-2 text-lg text-gray-600 sm:text-xl">
                    It helps <span className="font-semibold text-blue-600">creators</span>, <span className="font-semibold text-green-600">indie hackers</span>, and <span className="font-semibold text-purple-600">operators</span> grow their accounts with
                  </p>
                  <p className="text-lg text-gray-600 sm:text-xl">
                    automated engagement, content generation, and strategic planning
                  </p>
                  <p className="text-lg font-medium text-blue-600 text-gray-600 sm:text-xl">
                    — all without burning out.
                  </p>
                </div>

              <div className="grid grid-cols-1 gap-4 mx-auto mb-6 max-w-6xl md:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:mb-12">
                <div className="bg-gradient-to-br from-[#4792E6]/10 to-[#4792E6]/5 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[#4792E6]/20">
                  <div className="mb-4">
                    <svg className="w-10 h-10 text-[#4792E6] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-center text-gray-900">Auto Reply Suggestion</h3>
                  <p className="text-base leading-snug text-center text-gray-700">
                    Talk to AI and instantly generate high-quality comments or replies.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#4792E6]/10 to-[#4792E6]/5 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[#4792E6]/20">
                  <div className="mb-4">
                    <svg className="w-10 h-10 text-[#4792E6] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-center text-gray-900">Inspiration from top accounts</h3>
                  <p className="text-base leading-snug text-center text-gray-700">
                    Pick reference accounts and get AI-curated content in your voice.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#4792E6]/10 to-[#4792E6]/5 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[#4792E6]/20">
                  <div className="mb-4">
                    <svg className="w-10 h-10 text-[#4792E6] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-center text-gray-900">Auto Operation strategy</h3>
                  <p className="text-base leading-snug text-center text-gray-700">
                    AI-generated content plans, posting schedules, and engagement blueprints.
                  </p>
                </div>
              </div>

                <button
                  onClick={handleNextStep}
                  disabled={actionLoading}
                  className="inline-flex items-center px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-br from-[#4792E6] to-[#4792E6]/80 text-white font-semibold text-lg sm:text-xl rounded-xl hover:from-[#4792E6]/90 hover:to-[#4792E6]/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-[#4792E6]/20"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                  ) : (
                    <Sparkles className="mr-3 w-6 h-6" />
                  )}
                  Get Started
                </button>
              </div>
            </div>
          )}

          {/* CONNECT Step */}
          {currentStep === 'CONNECT' && (
            <div className="p-4 rounded-2xl border shadow-lg backdrop-blur-sm bg-white/60 border-gray-200/30 sm:p-8 md:p-12">
              <div className="text-center">
                <div className="mb-6 sm:mb-8">
                <div className="flex flex-col justify-between items-center mb-4 space-y-4 sm:flex-row sm:mb-6 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 bg-blue-100 rounded-full sm:p-3">
                      <XIcon className="w-6 h-6 text-blue-600 sm:h-8 sm:w-8" />
                    </div>
                    <div className="text-left">
                      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Connect Your X Account</h1>
                      <p className="text-sm text-gray-600 sm:text-base">Link your X account to enable AI-powered growth features</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    connectLoading ? 'bg-blue-100 text-blue-800' :
                    !twitterStatus?.has_records ? 'bg-gray-100 text-gray-800' :
                    !twitterStatus?.is_active ? 'bg-red-100 text-red-800' :
                    twitterStatus?.is_expired ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {connectLoading ? 'Checking...' : 
                     !twitterStatus?.has_records ? 'Disconnected' :
                     !twitterStatus?.is_active ? 'Manually Disabled' :
                     twitterStatus?.is_expired ? 'Token Expired' : 'Connected'}
                  </div>
                </div>

                {connectLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : twitterStatus?.has_records ? (
                  !twitterStatus.is_active ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center mb-2 space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <h4 className="font-medium text-red-900">Connection Manually Disabled</h4>
                        </div>
                        <p className="text-sm text-red-700">
                          User manually canceled connection or abnormal interruption, need to reconnect.
                        </p>
                      </div>
                      <button
                        onClick={handleReconnectTwitter}
                        disabled={actionLoading}
                        className="flex justify-center items-center px-4 py-3 space-x-2 w-full font-medium text-white bg-black rounded-lg transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{actionLoading ? 'Reconnecting...' : 'Reconnect X'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {twitterStatus.is_expired && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-center mb-2 space-x-2">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            <h4 className="font-medium text-amber-900">Token Expired</h4>
                          </div>
                          <p className="mb-3 text-sm text-amber-700">Your X connection token has expired. Please reconnect to continue using X features.</p>
                          <button
                            onClick={handleReconnectTwitter}
                            className="px-4 py-2 text-white bg-amber-600 rounded-lg transition-colors hover:bg-amber-700"
                          >
                            Reconnect X
                          </button>
                        </div>
                      )}
                    
                    {(twitterStatus.platform_username || twitterConnection) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg ${twitterStatus.is_expired ? 'bg-amber-50' : 'bg-blue-50'}`}>
                          <h4 className={`font-medium mb-2 ${twitterStatus.is_expired ? 'text-amber-900' : 'text-blue-900'}`}>Account Information</h4>
                          <p className={`text-sm ${twitterStatus.is_expired ? 'text-amber-700' : 'text-blue-700'}`}>Username: @{twitterStatus.platform_username || (twitterConnection && twitterConnection.platform_username)}</p>
                        <p className={`text-sm ${twitterStatus.is_expired ? 'text-amber-700' : 'text-blue-700'}`}>Connected: {new Date(twitterStatus.connected_at || (twitterConnection && twitterConnection.connected_at)).toLocaleDateString()}</p>
                        </div>
                        <div className={`p-4 rounded-lg ${twitterStatus.is_expired ? 'bg-red-50' : 'bg-green-50'}`}>
                          <h4 className={`font-medium mb-2 ${twitterStatus.is_expired ? 'text-red-900' : 'text-green-900'}`}>API Access</h4>
                          <p className={`text-sm ${twitterStatus.is_expired ? 'text-red-700' : 'text-green-700'}`}>
                            Status: {twitterStatus.is_expired ? 'Expired' : 'Active'}
                          </p>
                          <p className={`text-sm ${twitterStatus.is_expired ? 'text-red-700' : 'text-green-700'}`}>
                            Permissions: {twitterStatus.is_expired ? 'None' : 'Read and Post'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                      {!twitterStatus.is_expired && (
                        <div className="flex space-x-3">
                          <button
                            onClick={handleDisconnectTwitter}
                            className="px-4 py-2 text-white bg-red-600 rounded-lg transition-colors hover:bg-red-700"
                          >
                            Disconnect X
                          </button>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="mb-2 font-medium text-blue-900">Connection Benefits</h4>
                      <ul className="space-y-1 text-sm text-blue-700">
                        <li>• Direct access to your X account via API</li>
                        <li>• Secure OAuth 2.0 authentication</li>
                        <li>• Support for reading and posting tweets</li>
                        <li>• Real-time account status synchronization</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <h4 className="mb-2 font-medium text-amber-900">Connection Requirements</h4>
                      <ul className="space-y-1 text-sm text-amber-700">
                        <li>• Valid X account</li>
                        <li>• Allow third-party app access</li>
                        <li>• Stable internet connection</li>
                        <li>• Properly configured Twitter API credentials</li>
                      </ul>
                    </div>

                    <button
                      onClick={handleConnectTwitter}
                      disabled={actionLoading}
                      className="flex justify-center items-center px-4 py-3 space-x-2 w-full font-medium text-white bg-black rounded-lg transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>{actionLoading ? 'Connecting...' : 'Connect X'}</span>
                    </button>
                  </div>
                )}
              </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <button
                    onClick={handlePreviousStep}
                    className="inline-flex items-center px-6 py-3 font-medium text-gray-700 bg-gray-200 rounded-lg transition-colors hover:bg-gray-300"
                  >
                    <ArrowRight className="mr-2 w-5 h-5 rotate-180" />
                    Previous
                  </button>
                  {twitterConnection && (
                    <button
                      onClick={handleNextStep}
                      disabled={actionLoading}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-br from-[#4792E6] to-[#4792E6]/80 text-white font-medium rounded-lg hover:from-[#4792E6]/90 hover:to-[#4792E6]/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg border border-[#4792E6]/20"
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 w-5 h-5" />
                      )}
                      Continue
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PICK_ACCOUNTS Step */}
          {currentStep === 'PICK_ACCOUNTS' && (
            <div className="p-8 rounded-2xl border shadow-lg backdrop-blur-sm bg-white/60 border-gray-200/30 md:p-12">
              <div className="space-y-6">
              <div className="text-center">
                <Users className="mx-auto mb-4 w-16 h-16 text-blue-600" />
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Pick Your Inspiration Accounts</h2>
                <p className="mb-4 text-gray-600">
                  Select at least 3 accounts that inspire your content strategy
                </p>
                <div className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                  {inspirationAccounts.filter(acc => acc.starred).length} / 3+ selected
                </div>
              </div>
              
              {accountsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <Loader2 className="mx-auto mb-4 w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-gray-600">Loading inspiration accounts...</p>
                  </div>
                </div>
              ) : inspirationAccounts.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                  <p className="text-gray-600">No inspiration accounts found</p>
                  <p className="mt-2 text-sm text-gray-500">Please check your outreach requests</p>
                </div>
              ) : (
                <div className="grid overflow-y-auto grid-cols-1 gap-4 max-h-96 md:grid-cols-2">
                  {inspirationAccounts.map((account) => (
                  <div key={account.id} className="p-4 bg-white rounded-lg border border-gray-200 transition-shadow hover:shadow-md">
                    <div className="flex items-start space-x-3">
                      <img 
                        src={account.avatar} 
                        alt={account.name}
                        className="object-cover w-12 h-12 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 truncate">{account.name}</h3>
                          {account.verified && (
                            <CheckCircle className="flex-shrink-0 w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{account.handle}</p>
                        <p className="mt-1 text-xs text-gray-400 line-clamp-2">{account.bio}</p>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span>{(account.followers / 1000000).toFixed(1)}M followers</span>
                          <span>{(account.likes / 1000).toFixed(0)}K likes</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <button
                        onClick={() => handleAccountToggle(account.id)}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          account.starred 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${account.starred ? 'fill-current' : ''}`} />
                        <span>{account.starred ? 'Selected' : 'Select'}</span>
                      </button>
                    </div>
                  </div>
                ))}  
              </div>
            )}
              
              {!canContinuePickAccounts() && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Please select at least 3 accounts to continue
                    </p>
                  </div>
                </div>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  onClick={handlePreviousStep}
                  className="inline-flex items-center px-6 py-3 font-medium text-gray-700 bg-gray-200 rounded-lg transition-colors hover:bg-gray-300"
                >
                  <ArrowRight className="mr-2 w-5 h-5 rotate-180" />
                  Previous
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={actionLoading || !canContinuePickAccounts()}
                  className={`inline-flex items-center px-6 py-3 font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg ${
                    canContinuePickAccounts() 
                      ? 'bg-gradient-to-br from-[#4792E6] to-[#4792E6]/80 text-white hover:from-[#4792E6]/90 hover:to-[#4792E6]/70 border border-[#4792E6]/20' 
                      : 'bg-gray-300 text-gray-500 border border-gray-200'
                  }`}
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 w-5 h-5" />
                  )}
                  Continue Setup
                </button>
              </div>
              </div>
            </div>
          )}

          {/* ENGAGEMENT Step */}
          {currentStep === 'ENGAGEMENT' && (
            <div className="p-8 rounded-2xl border shadow-lg backdrop-blur-sm bg-white/60 border-gray-200/30 md:p-12">
              <div className="space-y-8 text-center">
              <div className="mb-8">
                <Zap className="mx-auto mb-4 w-16 h-16 text-purple-600" />
                <h1 className="mb-4 text-3xl font-bold text-gray-900">
                  Start Your Vibe X Operation
                </h1>
                <p className="mb-6 text-lg text-gray-600">
                  Setup complete! Now let X-Pilot help you find suitable replies for Vibe Engagement!
                </p>
              </div>

              {/* Embedded Feature Card */}
              <div className="mx-auto mb-8 max-w-2xl">
                <div className="p-8 bg-gradient-to-br from-[#4792E6]/10 to-[#4792E6]/5 backdrop-blur-sm rounded-xl border border-[#4792E6]/20 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4792E6] to-[#4792E6]/80 rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900">X-Pilot Core Features</h3>
                    <p className="text-sm text-gray-600">AI-powered engagement for creators, builders & growth operators</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
                    <div className="p-4 rounded-lg bg-white/50">
                      <div className="flex justify-center items-center mx-auto mb-2 w-10 h-10 bg-blue-100 rounded-full">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="mb-1 text-sm font-semibold text-gray-900">Auto Reply</h4>
                      <p className="text-xs text-gray-600">AI-generated quality replies</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-white/50">
                      <div className="flex justify-center items-center mx-auto mb-2 w-10 h-10 bg-purple-100 rounded-full">
                        <Target className="w-5 h-5 text-purple-600" />
                      </div>
                      <h4 className="mb-1 text-sm font-semibold text-gray-900">Inspiration</h4>
                      <p className="text-xs text-gray-600">Learn from top accounts</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-white/50">
                      <div className="flex justify-center items-center mx-auto mb-2 w-10 h-10 bg-green-100 rounded-full">
                        <Settings className="w-5 h-5 text-green-600" />
                      </div>
                      <h4 className="mb-1 text-sm font-semibold text-gray-900">Customized Reply Style</h4>
                      <p className="text-xs text-gray-600">AI content & engagement plans</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePreviousStep}
                  className="inline-flex items-center px-6 py-3 font-medium text-gray-700 bg-gray-200 rounded-lg transition-colors hover:bg-gray-300"
                >
                  <ArrowRight className="mr-2 w-5 h-5 rotate-180" />
                  Previous
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={actionLoading}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-br from-[#4792E6] to-[#4792E6]/80 text-white font-medium rounded-lg hover:from-[#4792E6]/90 hover:to-[#4792E6]/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl border border-[#4792E6]/20"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                  ) : (
                    <Zap className="mr-3 w-6 h-6" />
                  )}
                  Enter App
                </button>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 环境切换器 */}
      <EnvSwitcher />

      {/* Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={confirmDisconnectTwitter}
        title="Disconnect X Account"
        message="Are you sure you want to disconnect your X (Twitter) account? This will stop all automated activities and you'll need to reconnect to use XPilot features."
        confirmText="Disconnect"
        cancelText="Cancel"
        isLoading={disconnectLoading}
      />
    </div>
  );
};

export default Onboarding;