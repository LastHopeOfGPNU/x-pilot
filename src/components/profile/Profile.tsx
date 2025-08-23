import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, MapPin, Link, Star, Settings, Edit3, Check, X, Camera, Shield, Bell, CreditCard, Users, Activity, TrendingUp, MessageSquare, BarChart3, Clock, Gift, AlertCircle, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { twitterService, TwitterConnection, TwitterConnectionStatus } from '../../lib/twitterService';
import ConfirmationModal from '../common/ConfirmationModal';

interface ProfileProps {
  onClose?: () => void;
  initialSection?: string;
  onNavigate?: (section: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ onClose, initialSection = 'overview', onNavigate }) => {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [isConnectingTwitter, setIsConnectingTwitter] = useState(false);
  const [twitterConnection, setTwitterConnection] = useState<TwitterConnection | null>(null);
  const [twitterStatus, setTwitterStatus] = useState<TwitterConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: 'Building the future of social media automation | XPilot user',
    location: 'San Francisco, CA',
    website: 'https://xpilot.com',
    joinDate: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently',
    avatar: user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    provider: user?.user_metadata?.provider || 'email',
    lastSignIn: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-US') : 'Unknown',
    userId: user?.id || '',
    emailConfirmed: user?.email_confirmed_at ? true : false
  });

  const [tempData, setTempData] = useState(profileData);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      const updatedData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        bio: 'Building the future of social media automation | XPilot user',
        location: 'San Francisco, CA',
        website: 'https://xpilot.com',
        joinDate: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently',
        avatar: user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        provider: user?.user_metadata?.provider || 'email',
        lastSignIn: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-US') : 'Unknown',
        userId: user.id || ''
      };
      setProfileData(updatedData);
      setTempData(updatedData);
    }
  }, [user]);

  // Check Twitter connection status function
  const checkTwitterConnection = async () => {
    if (user) {
      setConnectLoading(true);
      try {
        // 获取详细的连接状态信息
        const status = await twitterService.getConnectionStatus();
        setTwitterStatus(status);
        
        // 保持向后兼容，设置连接信息
        if (status?.connection_details) {
          setTwitterConnection(status.connection_details);
        } else {
          setTwitterConnection(null);
        }
      } catch (error) {
        console.error('Error checking Twitter connection:', error);
        setTwitterStatus(null);
        setTwitterConnection(null);
      } finally {
        setConnectLoading(false);
      }
    }
  };

  // Auto-check Twitter connection when user changes
  useEffect(() => {
    checkTwitterConnection();
  }, [user]);

  // Update active section when initialSection changes
  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const handleSave = () => {
    setProfileData(tempData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempData(profileData);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setTempData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectTwitter = async () => {
    setConnectLoading(true);
    try {
      // 检查Twitter API配置
      if (!twitterService.isConfigured()) {
        alert('Twitter API configuration incomplete!\n\nPlease follow these steps to configure:\n1. Visit Twitter Developer Portal (https://developer.twitter.com/)\n2. Create an app and get Client ID and Client Secret\n3. Configure these keys in the .env file in the project root directory\n4. Restart the development server');
        return;
      }

      // 首先检查是否已有连接且token是否有效
      const tokenCheck = await twitterService.checkAndRefreshToken();
      
      if (tokenCheck.isValid && tokenCheck.connection) {
        // Token有效，更新连接状态
        setTwitterConnection(tokenCheck.connection);
        console.log('Twitter connection is valid and refreshed if needed');
        return;
      }

      // 如果没有有效连接，启动新的OAuth流程
      const authUrl = await twitterService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Twitter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while connecting to Twitter';
      alert(`Connection failed: ${errorMessage}`);
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnectTwitter = () => {
    setShowDisconnectModal(true);
  };

  const confirmDisconnectTwitter = async () => {
    try {
      setDisconnectLoading(true);
      const result = await twitterService.disconnectTwitter();
      if (result.success) {
        // 清除本地状态
        setTwitterConnection(null);
        setTwitterStatus(null);
        
        // 重新检查连接状态以确保界面同步
        await checkTwitterConnection();
        
        console.log('Twitter connection successfully disconnected');
        setShowDisconnectModal(false);
      } else {
        console.error('Failed to disconnect Twitter:', result.error);
      }
    } catch (error) {
      console.error('Error disconnecting Twitter:', error);
    } finally {
      setDisconnectLoading(false);
    }
  };

  const recentActivity = [
    { id: 1, content: 'Auto-replied to @techcrunch', time: '2 minutes ago', icon: MessageSquare },
    { id: 2, content: 'Gained 15 new followers', time: '1 hour ago', icon: Users },
    { id: 3, content: 'Connected new Twitter account', time: '1 day ago', icon: Settings },
    { id: 4, content: 'Updated profile information', time: '2 days ago', icon: User },
    { id: 5, content: 'Generated weekly analytics report', time: '3 days ago', icon: BarChart3 }
  ];

  // Custom X/Twitter icon component
  const XIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'connect', label: 'X Connect', icon: XIcon },
    { id: 'activity', label: 'Activity History', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-start space-x-6">
          <div className="relative">
            <img
              src={profileData.avatar}
              alt="Profile"
              className="object-cover w-24 h-24 rounded-full border-4 border-white shadow-lg"
            />
          </div>
          
          <div className="flex-1">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
              <p className="text-gray-600">{profileData.email}</p>
            </div>
            
            <div className="flex items-center mt-3 space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#4792E6] text-white">
                X Piloter
              </span>
            </div>
            
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="mr-1 w-4 h-4" />
                Joined {profileData.joinDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 text-center bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">1,247</div>
          <div className="text-sm text-gray-600">Total Replies</div>
          <div className="mt-2 text-xs text-green-600">+12% this week</div>
        </div>
        <div className="p-6 text-center bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-green-600">8.5%</div>
          <div className="text-sm text-gray-600">Engagement Total</div>
          <div className="mt-2 text-xs text-green-600">+2.3% this month</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center p-3 space-x-3 bg-blue-50 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Auto-replied to @techcrunch</p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center p-3 space-x-3 bg-green-50 rounded-lg">
            <Users className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Gained 15 new followers</p>
              <p className="text-xs text-gray-500">1 hour ago</p>
            </div>
          </div>
          <div className="flex items-center p-3 space-x-3 bg-blue-50 rounded-lg">
          <BarChart3 className="w-5 h-5 text-[#4792E6]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Generated weekly analytics report</p>
              <p className="text-xs text-gray-500">3 days ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Account Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Sign-in Provider</span>
            <span className="text-gray-900 capitalize">{profileData.provider}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Sign In</span>
            <span className="text-gray-900">{profileData.lastSignIn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Account Status</span>
            <span className="font-medium text-green-600">Active</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConnect = () => (
    <div className="space-y-6">
      {/* X (Twitter) Connection */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex justify-center items-center w-10 h-10 bg-black rounded-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">X (formerly Twitter)</h3>
              <p className="text-sm text-gray-500">
                {connectLoading ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Checking connection...
                  </span>
                ) : twitterStatus ? (
                  twitterStatus.is_authorized ? (
                    twitterStatus.is_expired ? (
                      <span className="font-medium text-amber-600">
                        Token Expired - @{twitterConnection?.platform_username}
                      </span>
                    ) : (
                      <span className="font-medium text-green-600">
                        Connected @{twitterConnection?.platform_username}
                      </span>
                    )
                  ) : (
                    <span className="text-gray-500">Not connected</span>
                  )
                ) : (
                  <span className="text-gray-500">Not connected</span>
                )}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            connectLoading ? 'bg-blue-100 text-blue-800' :
            twitterStatus?.is_authorized ? (
              twitterStatus.is_expired ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
            ) : 'bg-gray-100 text-gray-800'
          }`}>
            {connectLoading ? 'Checking...' : 
             twitterStatus?.is_authorized ? (
               twitterStatus.is_expired ? 'Token Expired' : 'Connected'
             ) : 'Disconnected'}
          </div>
        </div>

        {connectLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : twitterStatus?.is_authorized ? (
          <div className="space-y-4">
            {/* 过期状态警告 */}
            {twitterStatus.is_expired && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center mb-2 space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h4 className="font-medium text-amber-900">Token Expired</h4>
                </div>
                <p className="mb-3 text-sm text-amber-700">
                  Your X (Twitter) connection token has expired. Please reconnect to continue using X features.
                </p>
                <button
                  onClick={handleConnectTwitter}
                  className="px-4 py-2 text-sm text-white bg-amber-600 rounded-lg transition-colors hover:bg-amber-700"
                >
                  Reconnect X
                </button>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${twitterStatus.is_expired ? 'bg-amber-50' : 'bg-blue-50'}`}>
                <h4 className={`font-medium mb-2 ${twitterStatus.is_expired ? 'text-amber-900' : 'text-blue-900'}`}>Account Information</h4>
                <p className={`text-sm ${twitterStatus.is_expired ? 'text-amber-700' : 'text-blue-700'}`}>Username: @{twitterConnection.platform_username}</p>
                <p className={`text-sm ${twitterStatus.is_expired ? 'text-amber-700' : 'text-blue-700'}`}>Connected: {new Date(twitterConnection.connected_at).toLocaleDateString()}</p>
                {twitterConnection.expires_at && (
                  <p className={`text-sm ${twitterStatus.is_expired ? 'text-amber-700' : 'text-blue-700'}`}>
                    Expires: {new Date(twitterConnection.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className={`p-4 rounded-lg ${twitterStatus.is_expired ? 'bg-red-50' : 'bg-green-50'}`}>
                <h4 className={`font-medium mb-2 ${twitterStatus.is_expired ? 'text-red-900' : 'text-green-900'}`}>API Access</h4>
                <p className={`text-sm ${twitterStatus.is_expired ? 'text-red-700' : 'text-green-700'}`}>
                  Status: {twitterStatus.is_expired ? 'Expired' : 'Active'}
                </p>
                <p className={`text-sm ${twitterStatus.is_expired ? 'text-red-700' : 'text-green-700'}`}>
                  Permissions: {twitterStatus.is_expired ? 'None (Expired)' : 'Read and Post'}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {!twitterStatus.is_expired && (
                <button
                  onClick={handleDisconnectTwitter}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg transition-colors hover:bg-red-700"
                >
                  Disconnect X
                </button>
              )}
            </div>
          </div>
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
              disabled={connectLoading}
              className="flex justify-center items-center px-4 py-3 space-x-2 w-full font-medium text-white bg-black rounded-lg transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connectLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{connectLoading ? 'Connecting...' : 'Connect X'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-4">
      {recentActivity.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center p-4 space-x-4 bg-white rounded-lg border border-gray-200 transition-shadow duration-300 hover:shadow-md"
        >
          <div className="p-2 bg-[#4792E6]/10 rounded-full">
            <activity.icon className="w-5 h-5 text-[#4792E6]" />
          </div>
          <div className="flex-1">
            <p className="text-gray-900">{activity.content}</p>
            <p className="text-sm text-gray-500">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Account Management */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-900">
          <Shield className="w-5 h-5 mr-2 text-[#4792E6]" />
          Account Management
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="flex justify-center items-center px-4 py-3 space-x-2 w-full text-red-600 bg-red-50 rounded-lg transition-colors hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">{loading ? 'Signing Out...' : 'Sign Out'}</span>
          </button>
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="space-y-1 text-xs text-gray-500">
              <p>Last Sign In: {profileData.lastSignIn}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );





  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'connect': return renderConnect();
      case 'activity': return renderActivity();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  return (
    <div className="flex overflow-hidden relative flex-col h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-lg border border-gray-200 shadow-sm">
      {/* Animated background elements */}
      <div className="overflow-hidden absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br rounded-full blur-3xl animate-pulse from-blue-400/20 to-blue-400/20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr rounded-full blur-3xl animate-pulse from-indigo-400/20 to-pink-400/20" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r rounded-full blur-3xl animate-pulse transform -translate-x-1/2 -translate-y-1/2 from-cyan-400/10 to-blue-400/10" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 flex-shrink-0 p-6 border-b backdrop-blur-sm border-white/50 bg-white/30">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        </div>

        {/* Navigation Menu */}
        <div className="flex p-1 mt-4 space-x-1 rounded-lg border backdrop-blur-sm bg-white/40 border-white/50">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                // 当点击X Connect时，触发一次连接检查
                if (item.id === 'connect') {
                  checkTwitterConnection();
                }
              }}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeSection === item.id
                  ? item.id === 'connect'
                    ? 'bg-gradient-to-r from-[#4792E6] to-[#4792E6]/90 text-white shadow-lg transform scale-105 backdrop-blur-sm'
                    : 'bg-white text-[#4792E6] shadow-sm transform scale-105 backdrop-blur-sm'
                  : item.id === 'connect'
                    ? 'text-[#4792E6] hover:text-[#4792E6] hover:bg-[#4792E6]/10 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <item.icon size={16} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto relative z-10 flex-1 p-6">
        {renderContent()}
      </div>

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

export default Profile;