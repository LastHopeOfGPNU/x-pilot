import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Twitter, Users, Zap, Sparkles, Loader2, AlertCircle, Star, MessageCircle, Target, Settings } from 'lucide-react';
import { onboardingService, OnboardingStep } from '../lib/onboardingService';
import { twitterService, TwitterConnection } from '../lib/twitterService';
import { inspirationAccountService } from '../lib/inspirationAccountService';
import { useAuth } from '../contexts/AuthContext';
import { InspirationAccount } from '../types';
import EnvSwitcher from './EnvSwitcher';

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
  const [connectLoading, setConnectLoading] = useState(false);
  const [inspirationAccounts, setInspirationAccounts] = useState<InspirationAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
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
          const connection = await twitterService.getUserConnection();
          setTwitterConnection(connection);
        } catch (error) {
          console.error('Error checking Twitter connection:', error);
          // In mock mode, simulate connection status
          if (mockMode) {
            console.log('Mock mode - simulating Twitter connection status');
            setTwitterConnection(null); // Default to not connected for testing
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
      window.open(authUrl, '_blank', 'width=600,height=600');
      
      // Poll for connection status
      const pollConnection = setInterval(async () => {
        try {
          const connection = await twitterService.getUserConnection();
          if (connection) {
            setTwitterConnection(connection);
            clearInterval(pollConnection);
            setActionLoading(false);
          }
        } catch (error) {
          // Continue polling
        }
      }, 2000);
      
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollConnection);
        setActionLoading(false);
      }, 300000);
      
    } catch (error) {
      console.error('Failed to connect Twitter:', error);
      setError('Failed to connect Twitter account');
      setActionLoading(false);
    }
  };

  const handleDisconnectTwitter = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      const result = await twitterService.disconnectTwitter();
      if (result.success) {
        setTwitterConnection(null);
      } else {
        setError(result.error || 'Failed to disconnect Twitter account');
      }
    } catch (error) {
      console.error('Failed to disconnect Twitter:', error);
      setError('Failed to disconnect Twitter account');
    } finally {
      setActionLoading(false);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-y-auto">
      <div className="container mx-auto px-4 py-4 sm:py-8 min-h-full flex flex-col">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-12">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-8 lg:space-x-12 max-w-5xl w-full px-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center min-w-0 flex-1">
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
                          <span className="text-sm sm:text-base font-bold">{index + 1}</span>
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
                      <div className="flex items-center justify-center flex-shrink-0">
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
        <div className="max-w-4xl mx-auto">
          {/* START Step */}
          {currentStep === 'START' && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/30 p-4 sm:p-8 md:p-12">
              <div className="text-center">
                <div className="mb-6 sm:mb-12">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Introducing <span className="text-blue-600">X Pilot</span>
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 mb-2">
                    X Pilot is an AI-powered growth assistant for X (formerly Twitter).
                  </p>
                  <p className="text-lg sm:text-xl text-gray-600 mb-2">
                    It helps <span className="text-blue-600 font-semibold">creators</span>, <span className="text-green-600 font-semibold">indie hackers</span>, and <span className="text-purple-600 font-semibold">operators</span> grow their accounts with
                  </p>
                  <p className="text-lg sm:text-xl text-gray-600">
                    automated engagement, content generation, and strategic planning
                  </p>
                  <p className="text-lg sm:text-xl text-gray-600 font-medium text-blue-600">
                    — all without burning out.
                  </p>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-12 max-w-6xl mx-auto">
                <div className="bg-gradient-to-br from-[#4792E6]/10 to-[#4792E6]/5 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[#4792E6]/20">
                  <div className="mb-4">
                    <svg className="w-10 h-10 text-[#4792E6] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Auto Reply Suggestion</h3>
                  <p className="text-gray-700 text-base leading-snug text-center">
                    Talk to AI and instantly generate high-quality comments or replies.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#4792E6]/10 to-[#4792E6]/5 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[#4792E6]/20">
                  <div className="mb-4">
                    <svg className="w-10 h-10 text-[#4792E6] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Inspiration from top accounts</h3>
                  <p className="text-gray-700 text-base leading-snug text-center">
                    Pick reference accounts and get AI-curated content in your voice.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#4792E6]/10 to-[#4792E6]/5 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[#4792E6]/20">
                  <div className="mb-4">
                    <svg className="w-10 h-10 text-[#4792E6] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Auto Operation strategy</h3>
                  <p className="text-gray-700 text-base leading-snug text-center">
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
                    <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  ) : (
                    <Sparkles className="w-6 h-6 mr-3" />
                  )}
                  Get Started
                </button>
              </div>
            </div>
          )}

          {/* CONNECT Step */}
          {currentStep === 'CONNECT' && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/30 p-4 sm:p-8 md:p-12">
              <div className="text-center">
                <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                      <XIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Connect Your X Account</h1>
                      <p className="text-sm sm:text-base text-gray-600">Link your X account to enable AI-powered growth features</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    connectLoading ? 'bg-blue-100 text-blue-800' :
                    twitterConnection ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {connectLoading ? 'Checking...' : (twitterConnection ? 'Connected' : 'Disconnected')}
                  </div>
                </div>

                {connectLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : twitterConnection ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Account Information</h4>
                        <p className="text-sm text-blue-700">Username: @{twitterConnection.platform_username}</p>
                        <p className="text-sm text-blue-700">Connected: {new Date(twitterConnection.connected_at).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">API Access</h4>
                        <p className="text-sm text-green-700">Status: Active</p>
                        <p className="text-sm text-green-700">Permissions: Read and Post</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDisconnectTwitter}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Disconnect X
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Connection Benefits</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Direct access to your X account via API</li>
                        <li>• Secure OAuth 2.0 authentication</li>
                        <li>• Support for reading and posting tweets</li>
                        <li>• Real-time account status synchronization</li>
                      </ul>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <h4 className="font-medium text-amber-900 mb-2">Connection Requirements</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• Valid X account</li>
                        <li>• Allow third-party app access</li>
                        <li>• Stable internet connection</li>
                        <li>• Properly configured Twitter API credentials</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h4 className="font-medium text-red-900">Configuration Required</h4>
                      </div>
                      <p className="text-sm text-red-700 mb-3">
                        Twitter API credentials are not configured. Please contact support for assistance with setup.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleConnectTwitter}
                      className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      Connect X
                    </button>
                  </div>
                )}
              </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <button
                    onClick={handlePreviousStep}
                    className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                    Previous
                  </button>
                  {twitterConnection && (
                    <button
                      onClick={handleNextStep}
                      disabled={actionLoading}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-br from-[#4792E6] to-[#4792E6]/80 text-white font-medium rounded-lg hover:from-[#4792E6]/90 hover:to-[#4792E6]/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg border border-[#4792E6]/20"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <ArrowRight className="w-5 h-5 mr-2" />
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
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/30 p-8 md:p-12">
              <div className="space-y-6">
              <div className="text-center">
                <Users className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pick Your Inspiration Accounts</h2>
                <p className="text-gray-600 mb-4">
                  Select at least 3 accounts that inspire your content strategy
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {inspirationAccounts.filter(acc => acc.starred).length} / 3+ selected
                </div>
              </div>
              
              {accountsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading inspiration accounts...</p>
                  </div>
                </div>
              ) : inspirationAccounts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No inspiration accounts found</p>
                  <p className="text-sm text-gray-500 mt-2">Please check your outreach requests</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {inspirationAccounts.map((account) => (
                  <div key={account.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <img 
                        src={account.avatar} 
                        alt={account.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 truncate">{account.name}</h3>
                          {account.verified && (
                            <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{account.handle}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{account.bio}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{(account.followers / 1000000).toFixed(1)}M followers</span>
                          <span>{(account.likes / 1000).toFixed(0)}K likes</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
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
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
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
                  className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
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
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-5 h-5 mr-2" />
                  )}
                  Continue Setup
                </button>
              </div>
              </div>
            </div>
          )}

          {/* ENGAGEMENT Step */}
          {currentStep === 'ENGAGEMENT' && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/30 p-8 md:p-12">
              <div className="text-center space-y-8">
              <div className="mb-8">
                <Zap className="mx-auto h-16 w-16 text-purple-600 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Start Your Vibe X Operation
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  Setup complete! Now let X-Pilot help you find suitable replies for Vibe Engagement!
                </p>
              </div>

              {/* Embedded Feature Card */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="p-8 bg-gradient-to-br from-[#4792E6]/10 to-[#4792E6]/5 backdrop-blur-sm rounded-xl border border-[#4792E6]/20 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4792E6] to-[#4792E6]/80 rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">X-Pilot Core Features</h3>
                    <p className="text-gray-600 text-sm">AI-powered engagement for creators, builders & growth operators</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-white/50 rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Auto Reply</h4>
                      <p className="text-gray-600 text-xs">AI-generated quality replies</p>
                    </div>
                    
                    <div className="p-4 bg-white/50 rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2">
                        <Target className="w-5 h-5 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Inspiration</h4>
                      <p className="text-gray-600 text-xs">Learn from top accounts</p>
                    </div>
                    
                    <div className="p-4 bg-white/50 rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mx-auto mb-2">
                        <Settings className="w-5 h-5 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Customized Reply Style</h4>
                      <p className="text-gray-600 text-xs">AI content & engagement plans</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePreviousStep}
                  className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                  Previous
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={actionLoading}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-br from-[#4792E6] to-[#4792E6]/80 text-white font-medium rounded-lg hover:from-[#4792E6]/90 hover:to-[#4792E6]/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl border border-[#4792E6]/20"
                >
                  {actionLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  ) : (
                    <Zap className="w-6 h-6 mr-3" />
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
    </div>
  );
};

export default Onboarding;