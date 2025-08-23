import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { CopilotKit } from '@copilotkit/react-core';
import Sidebar from './components/dashboard/Sidebar';
import EngagementQueue from './components/auto-engagement/EngagementQueue';
import PostThreadQueue from './components/posts-threads/PostThreadQueue';
import ResultsArea from './components/common/ResultsArea';
import Config, { ConfigItem } from './components/config/Config';
import Profile from './components/profile/Profile';
import Dashboard from './components/dashboard/Dashboard';
import MarketingStrategy from './components/marketing-strategy/MarketingStrategy';
import Login from './components/auth/Login';
import TwitterAuthCallback from './pages/TwitterAuthCallback';
import TwitterDirectCallback from './components/auth/TwitterDirectCallback';
// Removed PlanDemo import - demo page deleted

import { Card, InspirationAccount, Post } from './types/index';
import AIAssistant from './components/ai-assistant/AIAssistant';
import EnvSwitcher from './components/config/EnvSwitcher';
import Onboarding from './components/common/Onboarding';
import GuideTour, { GuideStep } from './components/common/GuideTour';

import { apiConfigService } from './lib/apiConfigService';
import { onboardingService } from './lib/onboardingService';
import { devConfigService } from './lib/devConfigService';

// 定义MarketingStrategy类型
export interface MarketingStrategy {
  id: string;
  type: 'content' | 'operation' | 'engagement' | 'growth' | 'analytics';
  title: string;
  description: string;
  status: 'active' | 'draft' | 'completed';
  priority: 'high' | 'medium' | 'low';
  createdDate: string;
  lastUpdated: string;
  metrics?: {
    reach?: number;
    engagement?: number;
    conversion?: number;
  };
}

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataCacheProvider } from './contexts/DataCacheContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';

// Create layout context for AI chat state
const LayoutContext = createContext<{
  isAIChatExpanded: boolean;
  setIsAIChatExpanded: (expanded: boolean) => void;
}>({ isAIChatExpanded: false, setIsAIChatExpanded: () => {} });

export const useLayout = () => useContext(LayoutContext);

const AppContent: React.FC = () => {
  const { user, loading, session } = useAuth();
  const { onboardingStatus, loading: onboardingLoading, completeOnboarding } = useOnboarding();
  const [searchParams, setSearchParams] = useSearchParams();
  // 初始化时从localStorage读取，避免useEffect执行两次
  const [activeMenuItem, setActiveMenuItem] = useState<string>(() => {
    const savedMenuItem = localStorage.getItem('activeMenuItem');
    const isFirstVisit = localStorage.getItem('hasVisited') !== 'true';
    return savedMenuItem && !isFirstVisit ? savedMenuItem : 'Dashboard';
  });
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<InspirationAccount | null>(null);
  const [selectedConfigItem, setSelectedConfigItem] = useState<ConfigItem | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<MarketingStrategy | null>(null);
  const [profileInitialSection, setProfileInitialSection] = useState<string>('overview');
  const [isAIChatExpanded, setIsAIChatExpanded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(apiConfigService.getApiBaseUrl());
  const [showCopilotDevConsole, setShowCopilotDevConsole] = useState(devConfigService.getShowCopilotDevConsole());
  const [copilotKitRuntimeUrl, setCopilotKitRuntimeUrl] = useState<string>(devConfigService.getCopilotKitRuntimeUrl());
  
  // 引导状态管理
  const [isGuideActive, setIsGuideActive] = useState(false);
  const [currentGuideStep, setCurrentGuideStep] = useState(0);
  const [isFromOnboarding, setIsFromOnboarding] = useState(false);
  
  // 定义引导步骤
  const guideSteps: GuideStep[] = [
    {
      id: 'auto-reply-tab',
      title: '自动回复功能',
      content: '这里是自动回复模块，您可以查看和管理所有需要回复的推文。系统会智能识别需要回复的内容，帮助您提高互动效率。',
      targetSelector: '[data-guide="auto-reply-tab"]',
      position: 'bottom'
    },
    {
      id: 'auto-repost-tab',
      title: '自动转发功能',
      content: '自动转发模块让您可以轻松管理转发内容。选择合适的推文进行转发，扩大您的影响力和内容传播范围。',
      targetSelector: '[data-guide="auto-repost-tab"]',
      position: 'bottom'
    },
    {
      id: 'starred-tab',
      title: '星标内容',
      content: '这里显示您标记为重要的内容。通过星标功能，您可以快速找到需要特别关注的推文和账户。',
      targetSelector: '[data-guide="starred-tab"]',
      position: 'bottom'
    },
    {
      id: 'ai-chat',
      title: 'AI 智能助手',
      content: '我是您的AI助手，可以帮助您制定营销策略、分析数据、生成内容等。随时点击这里与我对话，获得专业的建议和支持。',
      targetSelector: '[data-guide="ai-chat"]',
      position: 'left'
    }
  ];
  
  // 引导处理函数
  const handleGuideComplete = useCallback(() => {
    setIsGuideActive(false);
    setIsFromOnboarding(false);
    setCurrentGuideStep(0);
  }, []);
  
  const handleGuideSkip = useCallback(() => {
    setIsGuideActive(false);
    setIsFromOnboarding(false);
    setCurrentGuideStep(0);
  }, []);
  
  const handleGuideStepChange = useCallback((stepIndex: number) => {
    setCurrentGuideStep(stepIndex);
  }, []);

  // 动态生成 CopilotKit headers，包含 Bearer token
  const copilotHeaders = useMemo(() => {
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };
    }
    return {};
  }, [session?.access_token]);

  // 使用useCallback避免onComplete函数重复创建 - 必须在所有条件渲染之前
  const handleOnboardingComplete = useCallback(() => {
    completeOnboarding();
    // 导航到 Auto Engagement 页面
    setActiveMenuItem('Auto Engagement');
    // 标记来自onboarding，启动引导
    setIsFromOnboarding(true);
    setIsGuideActive(true);
    setCurrentGuideStep(0);
    // 清除其他选择状态
    setSelectedCard(null);
    setSelectedAccount(null);
    setSelectedConfigItem(null);
    setSelectedPostId(null);
    setSelectedPost(null);
    setSelectedStrategy(null);
  }, [completeOnboarding]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 处理 URL 参数和路由持久化
  useEffect(() => {
    // 处理URL参数
    const section = searchParams.get('section');
    const tab = searchParams.get('tab');
    
    if (section === 'profile') {
      
      setActiveMenuItem('Profile');
      if (tab) {
        setProfileInitialSection(tab);
      }
      // 清除 URL 参数，避免刷新时重复处理
      setSearchParams({});
    }
    // 如果是首次访问网站，设置hasVisited标记
    else if (localStorage.getItem('hasVisited') !== 'true') {

      localStorage.setItem('hasVisited', 'true');
    }
  }, [searchParams, setSearchParams]);
  
  // 保存当前路由到localStorage，用于页面刷新后恢复
  useEffect(() => {
    localStorage.setItem('activeMenuItem', activeMenuItem);
    if (activeMenuItem === 'Profile') {
      localStorage.setItem('profileSection', profileInitialSection);
    }
  }, [activeMenuItem, profileInitialSection]);

  // 监听 API 配置变更
  useEffect(() => {
    const handleApiUrlChange = (newUrl: string) => {
      setApiBaseUrl(newUrl);
      // API配置变更时，同时更新CopilotKit URL
      setCopilotKitRuntimeUrl(devConfigService.getCopilotKitRuntimeUrl());
    };
    
    apiConfigService.addListener(handleApiUrlChange);
    
    return () => {
      apiConfigService.removeListener(handleApiUrlChange);
    };
  }, []);

  // 监听开发配置变更
  useEffect(() => {
    const handleDevConfigChange = (config: any) => {
      setShowCopilotDevConsole(config.showCopilotDevConsole);
      setCopilotKitRuntimeUrl(config.copilotKitRuntimeUrl);
    };
    
    devConfigService.addListener(handleDevConfigChange);
    
    return () => {
      devConfigService.removeListener(handleDevConfigChange);
    };
  }, []);



  // Calculate available space for intelligent layout
  const sidebarWidth = 256; // w-64 = 16rem = 256px
  const aiChatWidth = isAIChatExpanded ? Math.min(Math.max(windowWidth * 0.45, 600), 900) : Math.min(Math.max(windowWidth * 0.25, 320), 500); // Expanded: 45vw (min 600px, max 900px), Normal: 25vw (min 320px, max 500px)
  const remainingWidth = windowWidth - sidebarWidth - aiChatWidth;
  const canShowBothPanels = remainingWidth >= 800; // Need at least 800px for both panels

  // 显示加载状态
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-blue-200 animate-spin border-t-[#4792E6]"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 检查是否启用了开发模式的onboarding
  const isOnboardingMockMode = localStorage.getItem('dev-onboarding-mode') === 'true';
  
  // 如果用户未登录且未启用mock模式，显示登录页面
  if (!user && !isOnboardingMockMode) {
    return <Login />;
  }

  // 如果onboarding状态还在加载中
  if (onboardingLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-blue-200 animate-spin border-t-[#4792E6]"></div>
          <p className="text-gray-600">Checking...</p>
        </div>
      </div>
    );
  }

  // 如果用户需要完成onboarding
  if (onboardingStatus && !onboardingStatus.is_finished) {
    return (
      <Onboarding 
        onComplete={handleOnboardingComplete}
        initialStep={onboardingStatus.current_step}
      />
    );
  }

  const handleMenuItemClick = (itemName: string) => {
    setActiveMenuItem(itemName);
    // Clear other selection states
    setSelectedCard(null);
    setSelectedAccount(null);
    setSelectedConfigItem(null);
    setSelectedPostId(null);
    setSelectedPost(null);
    setSelectedStrategy(null);
    // Reset profile section when navigating to profile from menu
    if (itemName === 'Profile') {
      setProfileInitialSection('overview');
    }
  };

  const handleDashboardNavigate = (section: string, profileSection?: string) => {
    setActiveMenuItem(section);
    setSelectedCard(null);
    setSelectedAccount(null);
    setSelectedConfigItem(null);
    setSelectedPostId(null);
    setSelectedPost(null);
    setSelectedStrategy(null);
    // Set profile section if navigating to profile
    if (section === 'Profile' && profileSection) {
      setProfileInitialSection(profileSection);
    }
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setSelectedAccount(null);
    setSelectedConfigItem(null);
    setSelectedPostId(null);
    setSelectedPost(null);
    setSelectedStrategy(null);
  };

  const handleAccountClick = (account: InspirationAccount) => {
    setSelectedAccount(account);
    setSelectedCard(null);
    setSelectedConfigItem(null);
    setSelectedPostId(null);
    setSelectedPost(null);
    setSelectedStrategy(null);
  };

  const handleConfigItemClick = (item: ConfigItem) => {
    setSelectedConfigItem(item);
    setSelectedCard(null);
    setSelectedAccount(null);
    setSelectedPostId(null);
    setSelectedPost(null);
    setSelectedStrategy(null);
  };

  const handleStrategyClick = (strategy: MarketingStrategy) => {
    setSelectedStrategy(strategy);
    setSelectedCard(null);
    setSelectedAccount(null);
    setSelectedConfigItem(null);
    setSelectedPostId(null);
    setSelectedPost(null);
  };

  const handlePostClick = (queueItem: any) => {
    // Convert QueueItem to Post format
    const post: Post = {
      id: queueItem.id,
      type: queueItem.type,
      content: queueItem.content,
      createdTime: queueItem.createdTime,
      status: queueItem.status,
      platform: queueItem.platform,
      aiGenerated: queueItem.aiGenerated,
      tags: queueItem.tags || [],
      stats: {
        comments: 0,
        retweets: 0,
        likes: 0,
        views: 0,
        bookmarks: 0
      }
    };
    
    setSelectedPostId(post.id);
    setSelectedPost(post);
    setSelectedCard(null);
    setSelectedAccount(null);
    setSelectedConfigItem(null);
  };

  const showDashboard = activeMenuItem === 'Dashboard';
  const showInspirationAccounts = activeMenuItem === 'Inspiration Accounts';
  const showAutoEngagement = activeMenuItem === 'Auto Engagement';
  const showPostThreadQueue = activeMenuItem === 'Get Post/Thread';
  const showMarketingStrategy = activeMenuItem === 'Marketing Strategy';
  const showProperties = activeMenuItem === 'Properties';
  const showProfile = activeMenuItem === 'Profile';

  return (
    <CopilotKit 
      runtimeUrl={copilotKitRuntimeUrl}
      agent='chat_agent'
      showDevConsole={showCopilotDevConsole}
      publicLicenseKey={import.meta.env.VITE_COPILOTKIT_PUBLIC_LICENSE_KEY}
      headers={copilotHeaders}
    >
      <LayoutContext.Provider value={{ isAIChatExpanded, setIsAIChatExpanded }}>
        <div className="flex overflow-hidden h-screen bg-gray-50">
          {/* Left Sidebar */}
          <Sidebar 
            onMenuItemClick={handleMenuItemClick} 
            activeMenuItem={activeMenuItem}
          />
          
          {/* Main Content Area */}
          <div className="flex overflow-hidden flex-1">
            {/* Activity Queue / Config / Profile / Dashboard / Marketing Strategy */}
            <div className={`${
              showDashboard || showProfile ? 'w-full' : 
              showProperties ? 'w-1/3' :
              canShowBothPanels ? 'w-auto' : 'flex-1'
            } min-w-[500px] overflow-hidden`}>
              {showDashboard ? (
                <Dashboard onNavigate={handleDashboardNavigate} />
              ) : showProfile ? (
                <Profile 
                  initialSection={profileInitialSection} 
                  onNavigate={handleDashboardNavigate}
                />
              ) : showProperties ? (
                <Config 
                  onItemClick={handleConfigItemClick} 
                  selectedItemId={selectedConfigItem?.id?.toString()}
                />
              ) : showMarketingStrategy ? (
                <MarketingStrategy 
                  onStrategyClick={handleStrategyClick}
                  selectedStrategyId={selectedStrategy?.id}
                />
              ) : showPostThreadQueue ? (
                <PostThreadQueue 
                  onPostClick={handlePostClick}
                  selectedPostId={selectedPostId || undefined}
                />
              ) : (
                <EngagementQueue 
                  showInspirationAccounts={showInspirationAccounts} 
                  onCardClick={handleCardClick}
                  onAccountClick={handleAccountClick}
                  selectedCardId={selectedCard?.id}
                  selectedAccountId={selectedAccount?.id}
                />
              )}
            </div>
            
            {/* Results Area - only show when not Dashboard and not Profile and when there's enough space */}
            <div className={`overflow-hidden flex-1 min-w-0 ${
              !showDashboard && !showProfile && (canShowBothPanels || showProperties) ? 'block' : 'hidden'
            }`}>
              <ResultsArea 
                selectedCard={selectedCard} 
                selectedAccount={selectedAccount} 
                selectedConfigItem={selectedConfigItem}
                selectedPostId={selectedPostId}
                selectedPost={selectedPost}
                selectedStrategy={selectedStrategy}
              />
            </div>
          </div>
          
          {/* Vibe X Operation - Right Sidebar */}
          <AIAssistant onExpandedChange={setIsAIChatExpanded} />
        </div>
        
        {/* 环境切换器 - 仅在开发环境显示 */}
        <EnvSwitcher />
        
        {/* 引导组件 - 只在从onboarding进入且在Auto Engagement页面时显示 */}
        {isGuideActive && isFromOnboarding && activeMenuItem === 'Auto Engagement' && (
          <GuideTour
            steps={guideSteps}
            isActive={isGuideActive}
            currentStepIndex={currentGuideStep}
            onComplete={handleGuideComplete}
            onSkip={handleGuideSkip}
            onStepChange={handleGuideStepChange}
          />
        )}
  
      </LayoutContext.Provider>
    </CopilotKit>
  );
};

function App() {
  return (
    <DataCacheProvider>
      <AuthProvider>
        <OnboardingProvider>
          <Router>
            <Routes>
              <Route path="/auth/supabase/twitter/callback" element={<TwitterAuthCallback />} />
              <Route path="/auth/twitter/direct/callback" element={<TwitterDirectCallback />} />
              {/* Removed PlanDemo route - demo page deleted */}
              <Route path="/*" element={<AppContent />} />
            </Routes>
          </Router>
        </OnboardingProvider>
      </AuthProvider>
    </DataCacheProvider>
  );
}

export default App;