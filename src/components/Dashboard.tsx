import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Heart, 
  BarChart3, 
  Zap, 
  Target,
  ArrowUpRight,
  Calendar,
  Activity,
  Eye,
  ChevronRight,
  Rocket,
  Crosshair,
  PenTool,
  Star,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDataCache } from '../contexts/DataCacheContext';
import { dashboardService, DashboardData } from '../lib/dashboardService';

// Loading Card Component
const LoadingCard: React.FC = () => (
  <div className="p-6 rounded-xl border backdrop-blur-sm bg-white/60 border-white/50">
    <div className="flex justify-center items-center h-20">
      <Loader className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  </div>
);

// Error Card Component
const ErrorCard: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="p-6 rounded-xl border backdrop-blur-sm bg-white/60 border-white/50">
    <div className="flex flex-col justify-center items-center h-20 text-center">
      <AlertCircle className="mb-2 w-6 h-6 text-red-500" />
      <p className="mb-2 text-sm text-red-600">{message}</p>
      <button 
        onClick={onRetry}
        className="px-3 py-1 text-xs text-white bg-blue-600 rounded transition-colors hover:bg-blue-700"
      >
        Retry
      </button>
    </div>
  </div>
);

interface DashboardProps {
  onNavigate?: (section: string, profileSection?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const {
    getDashboardData,
    setDashboardData,
    isDashboardLoading,
    setDashboardLoading
  } = useDataCache();
  
  // 从缓存获取数据
  const dashboardData = getDashboardData();
  const loading = isDashboardLoading();
  
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animatedStats, setAnimatedStats] = useState({
    totalReplies: 0,
    totalLikes: 0,
    totalReposts: 0,
    engagementRate: 0
  });
  
  // 缓存数据的引用
  const cachedDataRef = useRef<DashboardData | null>(null);
  
  // 获取Dashboard数据
  const fetchDashboardData = async (isBackgroundUpdate = false) => {
    try {
      if (isBackgroundUpdate) {
        setBackgroundLoading(true);
        // 如果有缓存数据，先显示缓存数据
        if (cachedDataRef.current) {
          setDashboardData(cachedDataRef.current);
          setDashboardLoading(false);
        }
      } else {
        setDashboardLoading(true);
      }
      setError(null);
      
      const data = await dashboardService.getDashboardData();
      
      // 更新缓存
      cachedDataRef.current = data;
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setDashboardLoading(false);
      setBackgroundLoading(false);
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // 组件加载时获取Dashboard数据
  useEffect(() => {
    // 首次加载时，如果有缓存数据则优先显示
    if (dashboardData) {
      // 已有缓存数据，后台更新
      cachedDataRef.current = dashboardData;
      fetchDashboardData(true);
    } else {
      // 没有缓存数据时正常加载
      fetchDashboardData();
    }
  }, []);

  // Number animation effect
  useEffect(() => {
    if (!dashboardData) return;
    
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setAnimatedStats({
        totalReplies: Math.floor((dashboardData?.stats?.total_replies || 0) * easeOutQuart),
      engagementRate: Number(((dashboardData?.stats?.engagement_rate || 0) * easeOutQuart).toFixed(1))
      });
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          totalReplies: dashboardData?.stats?.total_replies || 0,
      engagementRate: dashboardData?.stats?.engagement_rate || 0
        });
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [dashboardData]);



  // 前端配置的快捷操作
  const quickActions = [
    {
      id: 1,
      title: "Inspiration Accounts",
      description: "Manage and discover new accounts",
      icon: "users",
      color: "blue",
      url: "/inspiration-accounts",
      disabled: false
    },
    {
      id: 2,
      title: "Auto Engagement",
      description: "Configure automated interactions",
      icon: "heart",
      color: "green",
      url: "/auto-engagement",
      disabled: false
    },
    {
      id: 3,
      title: "Get Post/Thread",
      description: "Create and schedule content (Coming Soon)",
      icon: "message-square",
      color: "purple",
      url: "/posts-topics",
      disabled: true
    },
    {
      id: 4,
      title: "Marketing Strategy",
      description: "Plan your content calendar (Coming Soon)",
      icon: "target",
      color: "orange",
      url: "/content-strategy",
      disabled: true
    }
  ];

  // 根据URL映射到section
  const getNavigationSection = (url: string) => {
    const urlMap: { [key: string]: string } = {
      '/inspiration-accounts': 'Inspiration Accounts',
      '/auto-engagement': 'Auto Engagement',
      '/posts-topics': 'Posts & Topics',
      '/content-strategy': 'Content Strategy'
    };
    return urlMap[url] || 'Dashboard';
  };

  const handleQuickActionClick = (section: string) => {
    onNavigate?.(section);
  };

  // Handle account click to open Twitter profile
  const handleAccountClick = (username: string) => {
    const twitterUrl = `https://x.com/${username}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  // Loading component for individual sections
  const LoadingCard = ({ className = "" }: { className?: string }) => (
    <div className={`p-6 rounded-xl border backdrop-blur-sm bg-white/60 border-white/50 ${className}`}>
      <div className="flex justify-center items-center h-20">
        <Loader className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    </div>
  );

  // Error component for individual sections (without retry button)
const ErrorCard = ({ message, className = "" }: { message: string; className?: string }) => (
  <div className={`p-6 rounded-xl border backdrop-blur-sm bg-white/60 border-white/50 ${className}`}>
    <div className="flex flex-col justify-center items-center h-20 text-center">
      <AlertCircle className="mb-2 w-6 h-6 text-red-500" />
      <p className="text-sm text-red-600">{message}</p>
    </div>
  </div>
);

  return (
    <div className="flex overflow-hidden relative flex-col h-full bg-gradient-to-br via-blue-50 to-indigo-50 rounded-lg border border-gray-200 shadow-sm from-slate-50">
      {/* Animated background elements */}
      <div className="overflow-hidden absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br rounded-full blur-3xl animate-pulse from-blue-400/10 to-blue-400/10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr rounded-full blur-3xl animate-pulse from-indigo-400/10 to-pink-400/10" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-gradient-to-r rounded-full blur-3xl animate-pulse from-cyan-400/5 to-blue-400/5" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 p-6 border-b backdrop-blur-sm border-white/50 bg-white/30">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="flex items-center text-2xl font-bold text-gray-900">
              <Rocket className="mr-3 w-7 h-7 text-blue-600" />
              Dashboard
              {backgroundLoading && (
                <div className="ml-3 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              )}
            </h1>
            <p className="mt-1 text-gray-600">Welcome back, {getUserDisplayName()}! Click the Quick Actions below to quickly use features.</p>
          </div>
          <div className="flex items-center space-x-3">
            {error && (
              <button
                onClick={() => fetchDashboardData()}
                disabled={loading || backgroundLoading}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg transition-all duration-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${(loading || backgroundLoading) ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
              true
                ? 'text-green-800 bg-green-100' 
                : 'text-red-800 bg-red-100'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                true? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span>{true ? 'All Systems Active' : 'System Issues'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto relative z-10 flex-1 p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {loading || error ? (
            <>
              {error ? (
                <ErrorCard message="Failed to load metrics" />
              ) : (
                <LoadingCard />
              )}
              {error ? (
                <ErrorCard message="Failed to load metrics" />
              ) : (
                <LoadingCard />
              )}
            </>
          ) : dashboardData ? (
            <>
              <div className="p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/60 border-white/50 hover:shadow-lg group">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 transition-transform duration-300 group-hover:scale-110">
                      {animatedStats.totalReplies.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Replies</div>
                    <div className="flex items-center mt-2 text-xs text-green-600">
                      <ArrowUpRight className="mr-1 w-3 h-3" />
                      {dashboardData?.stats?.total_replies_change || 0}
                    </div>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-600 transition-transform duration-300 group-hover:rotate-12" />
                </div>
              </div>

              <div className="p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/60 border-white/50 hover:shadow-lg group">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600 transition-transform duration-300 group-hover:scale-110">
                      {animatedStats.engagementRate}%
                    </div>
                    <div className="text-sm text-gray-600">Engagement Rate</div>
                    <div className="flex items-center mt-2 text-xs text-green-600">
                      <ArrowUpRight className="mr-1 w-3 h-3" />
                      {dashboardData?.stats?.engagement_rate_change || 0}
                    </div>
                  </div>
                  <Heart className="w-8 h-8 text-green-600 transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Inspiration Accounts Overview */}
        <div className="p-6 rounded-xl border backdrop-blur-sm bg-white/60 border-white/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center text-lg font-semibold text-gray-900">
              <Crosshair className="mr-2 w-5 h-5 text-blue-500" />
              Inspiration Accounts Overview
            </h3>
            <button 
              onClick={() => onNavigate?.('Inspiration Accounts')}
              className="flex items-center text-sm text-blue-600 transition-colors hover:text-blue-800"
            >
              View All
              <ChevronRight className="ml-1 w-4 h-4" />
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-32 text-center">
              <AlertCircle className="mb-2 w-6 h-6 text-red-500" />
              <p className="text-sm text-red-600">Failed to load accounts</p>
            </div>
          ) : dashboardData?.inspiration_accounts_overview?.accounts && dashboardData.inspiration_accounts_overview.accounts.length > 0 ? (
            <div className="space-y-4">
              {/* Account List */}
              <div className="space-y-3">
                {dashboardData.inspiration_accounts_overview.accounts.slice(0, 4).map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center p-3 space-x-4 rounded-lg border border-gray-100 transition-all duration-200 hover:bg-white/80 hover:shadow-sm group"
                  >
                    {/* Profile Image */}
                    <div className="relative flex-shrink-0">
                      {account.profile_image_url ? (
                        <img
                          src={account.profile_image_url}
                          alt={account.display_name}
                          className="object-cover w-10 h-10 rounded-full border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="flex justify-center items-center w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white shadow-sm">
                          <span className="text-sm font-semibold text-white">
                            {account.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {account.verified && (
                        <CheckCircle className="absolute -right-1 -bottom-1 w-4 h-4 text-blue-500 bg-white rounded-full" />
                      )}
                    </div>

                    {/* Account Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {account.display_name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {account.is_starred && (
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          )}
                          {account.is_target && (
                            <Target className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span>@{account.username}</span>
                        <span>•</span>
                        <span>{account.followers_count.toLocaleString()} followers</span>
                      </div>
                    </div>

                    {/* Action Indicator */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccountClick(account.username);
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      aria-label={`Open ${account.display_name}'s Twitter profile`}
                    >
                      <ChevronRight className="w-4 h-4 text-gray-400 transition-colors group-hover:text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Users className="mr-1 w-4 h-4" />
                    {dashboardData.inspiration_accounts_overview.total_count} total
                  </span>
                  <span className="flex items-center">
                    <Star className="mr-1 w-4 h-4 text-yellow-500" />
                    {dashboardData.inspiration_accounts_overview.starred_count} starred
                  </span>
                  <span className="flex items-center">
                    <Target className="mr-1 w-4 h-4 text-green-500" />
                    {dashboardData.inspiration_accounts_overview.target_count} targeted
                  </span>
                </div>
                <button 
                  onClick={() => onNavigate?.('Inspiration Accounts')}
                  className="px-3 py-1 text-xs text-white bg-blue-600 rounded transition-colors hover:bg-blue-700"
                >
                  Manage Accounts
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Users className="mx-auto mb-3 w-12 h-12 text-gray-400" />
              <p className="mb-4 text-gray-500">No inspiration accounts found</p>
              <button 
                onClick={() => onNavigate?.('Inspiration Accounts')}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
              >
                Add Accounts
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-xl border backdrop-blur-sm bg-white/60 border-white/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center text-lg font-semibold text-gray-900">
              <Rocket className="mr-2 w-5 h-5 text-blue-500" />
              Quick Actions
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const IconComponent = dashboardService.getIconComponent(action.icon);
              const colorClasses = dashboardService.getColorClasses(action.color);
              const isDisabled = action.disabled;
              
              return (
                <button
                  key={action.id}
                  onClick={() => !isDisabled && onNavigate?.(getNavigationSection(action.url))}
                  disabled={isDisabled}
                  className={`p-4 rounded-lg border transition-all duration-200 text-left group ${
                    isDisabled 
                      ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white/50 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg transition-transform duration-200 ${
                      isDisabled 
                        ? 'bg-gray-200' 
                        : `${colorClasses.bg} group-hover:scale-110`
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        isDisabled 
                          ? 'text-gray-400' 
                          : colorClasses.icon
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm mb-1 transition-colors ${
                        isDisabled 
                          ? 'text-gray-500' 
                          : 'text-gray-900 group-hover:text-blue-600'
                      }`}>
                        {action.title}
                      </h4>
                      <p className={`text-xs line-clamp-2 ${
                        isDisabled 
                          ? 'text-gray-400' 
                          : 'text-gray-500'
                      }`}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-xl border backdrop-blur-sm bg-white/60 border-white/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center text-lg font-semibold text-gray-900">
              <Activity className="mr-2 w-5 h-5 text-blue-500" />
              Recent Activity
            </h3>
            {!loading && !error && (
              <button 
                onClick={() => onNavigate?.('Profile', 'activity')}
                className="flex items-center text-sm text-blue-600 transition-colors hover:text-blue-800"
              >
                View All
                <ChevronRight className="ml-1 w-4 h-4" />
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-32 text-center">
              <AlertCircle className="mb-2 w-6 h-6 text-red-500" />
              <p className="mb-2 text-sm text-red-600">Failed to load recent activity</p>
              <button 
                onClick={fetchDashboardData}
                className="px-3 py-1 text-xs text-white bg-blue-600 rounded transition-colors hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : dashboardData ? (
            <div className="space-y-3">
               {dashboardData?.recent_activities?.map((activity) => {
                 const activityStyle = dashboardService.getActivityStyle(activity.type);
                 const IconComponent = activityStyle.icon;
                 const colorClasses = dashboardService.getColorClasses(activityStyle.color);
                 
                 return (
                   <div
                     key={activity.id}
                     className="flex items-center p-3 space-x-4 rounded-lg transition-colors cursor-pointer hover:bg-white/50 group"
                   >
                     <div className={`p-2 rounded-full group-hover:scale-110 transition-transform duration-200 ${colorClasses.bg}`}>
                       <IconComponent className={`w-4 h-4 ${colorClasses.text}`} />
                     </div>
                     <div className="flex-1">
                       <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                       <p className="text-xs text-gray-500">{activity.time_ago}</p>
                     </div>
                     <ChevronRight className="w-4 h-4 text-gray-400 transition-colors group-hover:text-gray-600" />
                   </div>
                 );
                })}
             </div>
          ) : null}
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-2 gap-4">
          {loading || error ? (
            <>
              {error ? (
                <ErrorCard message="Failed to load growth metrics" onRetry={fetchDashboardData} />
              ) : (
                <LoadingCard />
              )}
              {error ? (
                <ErrorCard message="Failed to load system status" onRetry={fetchDashboardData} />
              ) : (
                <LoadingCard />
              )}
            </>
          ) : dashboardData ? (
            <>
              <div className="p-6 rounded-xl border backdrop-blur-sm bg-white/60 border-white/50">
                <h4 className="flex items-center mb-4 font-semibold text-gray-900">
                  <TrendingUp className="mr-2 w-5 h-5 text-green-500" />
                  Growth Metrics
                </h4>
                <div className="flex justify-center items-center h-20">
                   <div className="text-center">
                     <div className="mb-1 text-xl font-bold text-gray-600">{dashboardData?.growth_metrics?.status || 'N/A'}</div>
                <div className="text-sm text-gray-500">{dashboardData?.growth_metrics?.description || 'No data available'}</div>
                   </div>
                 </div>
              </div>

              <div className="p-6 rounded-xl border backdrop-blur-sm bg-white/60 border-white/50">
                <h4 className="flex items-center mb-4 font-semibold text-gray-900">
                  <Activity className="mr-2 w-5 h-5 text-blue-500" />
                  System Status
                </h4>
                {/* <div className="space-y-3">
                   <div className="flex items-center space-x-2">
                     <div className={`w-2 h-2 rounded-full ${
                       dashboardData?.system_status?.auto_engagement_active ? 'bg-green-500' : 'bg-red-500'
                     }`}></div>
                     <span className="text-sm text-gray-700">Auto Engagement {dashboardData?.system_status?.auto_engagement_active ? 'Active' : 'Inactive'}</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <div className={`w-2 h-2 rounded-full ${
                       dashboardData?.system_status?.reply_queue_processing ? 'bg-green-500' : 'bg-red-500'
                     }`}></div>
                     <span className="text-sm text-gray-700">Reply Queue {dashboardData?.system_status?.reply_queue_processing ? 'Processing' : 'Stopped'}</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <div className={`w-2 h-2 rounded-full ${
                       dashboardData?.system_status?.all_accounts_connected ? 'bg-green-500' : 'bg-red-500'
                     }`}></div>
                     <span className="text-sm text-gray-700">All Accounts {dashboardData?.system_status?.all_accounts_connected ? 'Connected' : 'Disconnected'}</span>
                   </div>
                 </div> */}
                    <div className="flex justify-center items-center h-20">
                   <div className="text-center">
                     <div className="mb-1 text-xl font-bold text-gray-600">{dashboardData?.growth_metrics?.status || 'N/A'}</div>
                <div className="text-sm text-gray-500">{dashboardData?.growth_metrics?.description || 'No data available'}</div>
                   </div>
                 </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;