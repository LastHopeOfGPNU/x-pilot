import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { CopilotKit } from '@copilotkit/react-core';
import Sidebar from './components/Sidebar';
import EngagementQueue from './components/EngagementQueue';
import PostThreadQueue from './components/PostThreadQueue';
import ResultsArea from './components/ResultsArea';
import Config, { ConfigItem } from './components/Config';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import MarketingStrategy from './components/MarketingStrategy';
import Login from './components/Login';
import TwitterAuthCallback from './pages/TwitterAuthCallback';
import TwitterDirectCallback from './components/TwitterDirectCallback';
// Removed PlanDemo import - demo page deleted

import { Card, InspirationAccount, Post } from './types/index';
import AIAssistant from './components/AIAssistant';
import EnvSwitcher from './components/EnvSwitcher';
import Onboarding from './components/Onboarding';

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

// Create layout context for AI chat state
const LayoutContext = createContext<{
  isAIChatExpanded: boolean;
  setIsAIChatExpanded: (expanded: boolean) => void;
}>({ isAIChatExpanded: false, setIsAIChatExpanded: () => {} });

export const useLayout = () => useContext(LayoutContext);

const AppContent: React.FC = () => {
  const { user, loading, session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [onboardingStatus, setOnboardingStatus] = useState<{
    isFinished: boolean;
    currentStep: string;
    loading: boolean;
    error?: string;
  }>({ isFinished: false, currentStep: 'START', loading: true });
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
    setOnboardingStatus({ isFinished: true, currentStep: 'ENGAGEMENT', loading: false, error: undefined });
    // 导航到 Engagement Queue (Inspiration Accounts)
    setActiveMenuItem('Inspiration Accounts');
    // 清除其他选择状态
    setSelectedCard(null);
    setSelectedAccount(null);
    setSelectedConfigItem(null);
    setSelectedPostId(null);
    setSelectedPost(null);
    setSelectedStrategy(null);
  }, []);

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
    };
    
    devConfigService.addListener(handleDevConfigChange);
    
    return () => {
      devConfigService.removeListener(handleDevConfigChange);
    };
  }, []);

  // 检查onboarding状态
  const checkOnboardingStatus = useCallback(async () => {
      const isOnboardingMockMode = localStorage.getItem('dev-onboarding-mode') === 'true';
      
      
      // 如果启用了mock模式，强制显示onboarding
      if (isOnboardingMockMode) {
        console.log('App.tsx: Mock mode enabled, forcing onboarding display');
        setOnboardingStatus({ isFinished: false, currentStep: 'START', loading: false, error: undefined });
        return;
      }
      
      // 如果没有用户且不是mock模式，直接跳过onboarding检查
      if (!user && !isOnboardingMockMode) {
        console.log('App.tsx: No user and not mock mode, skipping onboarding');
        setOnboardingStatus({ isFinished: true, currentStep: 'ENGAGEMENT', loading: false, error: undefined });
        return;
      }

      try {
        const status = await onboardingService.getCurrentStep();
        setOnboardingStatus({
          isFinished: status.is_finished,
          currentStep: status.current_step,
          loading: false,
          error: undefined
        });
      } catch (error) {
        // 接口失败时直接显示主页面，不显示错误信息
        setOnboardingStatus({
          isFinished: true,
          currentStep: 'ENGAGEMENT',
          loading: false,
          error: undefined
        });
       }
     }, [user]);

  // 移除重试功能，因为接口失败时直接显示主页面

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

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
  if (onboardingStatus.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-blue-200 animate-spin border-t-[#4792E6]"></div>
          <p className="text-gray-600">Checking setup status...</p>
        </div>
      </div>
    );
  }

  // 移除错误处理UI，接口失败时直接显示主页面

  // 如果用户需要完成onboarding
  if (!onboardingStatus.isFinished) {
    return (
      <Onboarding 
        onComplete={handleOnboardingComplete}
        initialStep={onboardingStatus.currentStep}
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
  const showConfig = activeMenuItem === 'Config';
  const showProfile = activeMenuItem === 'Profile';

  return (
    <CopilotKit 
      runtimeUrl={`${apiBaseUrl}/copilotkit`}
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
              canShowBothPanels ? 'w-auto' : 'flex-1'
            } min-w-[500px] overflow-hidden`}>
              {showDashboard ? (
                <Dashboard onNavigate={handleDashboardNavigate} />
              ) : showProfile ? (
                <Profile 
                  initialSection={profileInitialSection} 
                  onNavigate={handleDashboardNavigate}
                />
              ) : showConfig ? (
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
              !showDashboard && !showProfile && canShowBothPanels ? 'block' : 'hidden'
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
  
      </LayoutContext.Provider>
    </CopilotKit>
  );
};

function App() {
  return (
    <DataCacheProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth/supabase/twitter/callback" element={<TwitterAuthCallback />} />
            <Route path="/auth/twitter/direct/callback" element={<TwitterDirectCallback />} />
            {/* Removed PlanDemo route - demo page deleted */}
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </Router>
      </AuthProvider>
    </DataCacheProvider>
  );
}

export default App;