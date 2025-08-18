import React, { useState, useEffect } from 'react';
import { Settings, Globe, Server, RotateCcw, Terminal } from 'lucide-react';
import { apiConfigService } from '../lib/apiConfigService';
import { devConfigService } from '../lib/devConfigService';
import { supabase } from '../lib/supabase';

interface EnvSwitcherProps {
  className?: string;
}

const EnvSwitcher: React.FC<EnvSwitcherProps> = ({ className = '' }) => {
  const [isLocalEnv, setIsLocalEnv] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showCopilotDevConsole, setShowCopilotDevConsole] = useState(false);

  useEffect(() => {
    // 只在开发环境显示
    if (import.meta.env.PROD) return;
    
    setIsLocalEnv(apiConfigService.isUsingLocalApi());
    setShowCopilotDevConsole(devConfigService.getShowCopilotDevConsole());
    
    const handleApiChange = () => {
      setIsLocalEnv(apiConfigService.isUsingLocalApi());
    };
    
    const handleDevConfigChange = (config: any) => {
      setShowCopilotDevConsole(config.showCopilotDevConsole);
    };
    
    apiConfigService.addListener(handleApiChange);
    devConfigService.addListener(handleDevConfigChange);
    
    return () => {
      apiConfigService.removeListener(handleApiChange);
      devConfigService.removeListener(handleDevConfigChange);
    };
  }, []);

  // 生产环境不显示
  if (import.meta.env.PROD) {
    return null;
  }

  const handleToggle = () => {
    const newIsLocal = apiConfigService.toggleApiEnvironment();
    setIsLocalEnv(newIsLocal);
  };

  const handleCopilotDevConsoleToggle = () => {
    const newValue = devConfigService.toggleCopilotDevConsole();
    setShowCopilotDevConsole(newValue);
  };

  // 获取认证头
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('用户未登录');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  };

  const handleOnboardingReset = async () => {
    setIsResetting(true);
    try {
      const headers = await getAuthHeaders();
      const baseUrl = apiConfigService.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/onboarding/reset`, {
        method: 'DELETE',
        headers,
      });
      
      if (response.ok) {
        // 清除本地存储的onboarding状态
        localStorage.removeItem('onboarding-status');
        localStorage.removeItem('onboarding-step');
        // 刷新页面以重新开始引导流程
        window.location.reload();
      } else {
        console.error('重置引导流程失败:', response.statusText);
        alert('重置引导流程失败，请稍后重试');
      }
    } catch (error) {
      console.error('重置引导流程出错:', error);
      alert('重置引导流程出错，请稍后重试');
    } finally {
      setIsResetting(false);
    }
  };

  const environments = apiConfigService.getAvailableEnvironments();

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {isExpanded ? (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Settings size={16} />
              开发环境切换
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            {Object.entries(environments).map(([key, env]) => (
              <div
                key={key}
                className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all ${
                  env.active 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={handleToggle}
              >
                <div className="flex items-center gap-2">
                  {key === 'local' ? <Server size={16} /> : <Globe size={16} />}
                  <div>
                    <div className="font-medium text-sm">{env.name}</div>
                    <div className="text-xs text-gray-500">{env.description}</div>
                  </div>
                </div>
                {env.active && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Onboarding控制选项 */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="mb-2">
              <div className="text-sm font-medium text-gray-700 mb-2">开发选项</div>
              
              <div className="p-3 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={16} className="text-blue-600" />
                    <div>
                      <div className="font-medium text-sm text-gray-700">重置引导流程</div>
                      <div className="text-xs text-gray-500">调用API重新开始引导流程</div>
                    </div>
                  </div>
                  <button
                    onClick={handleOnboardingReset}
                    disabled={isResetting}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    {isResetting ? (
                      <>
                        <RotateCcw size={12} className="animate-spin" />
                        重置中...
                      </>
                    ) : (
                      '重置'
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mt-2 p-3 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-gray-700">跳过Onboarding</div>
                    <div className="text-xs text-gray-500">直接进入主界面</div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.setItem('onboarding-status', 'finished');
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 transition-colors"
                  >
                    跳过
                  </button>
                </div>
              </div>
              
              <div className="mt-2 p-3 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-purple-600" />
                    <div>
                      <div className="font-medium text-sm text-gray-700">CopilotKit 开发控制台</div>
                      <div className="text-xs text-gray-500">显示/隐藏 AI 助手开发调试面板</div>
                    </div>
                  </div>
                  <button
                     onClick={handleCopilotDevConsoleToggle}
                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                       showCopilotDevConsole ? 'bg-purple-600' : 'bg-gray-200'
                     }`}
                   >
                     <span
                       className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                         showCopilotDevConsole ? 'translate-x-6' : 'translate-x-1'
                       }`}
                     />
                   </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              当前API: <span className="font-mono">{apiConfigService.getApiBaseUrl()}</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border transition-all hover:shadow-xl ${
            isLocalEnv 
              ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600' 
              : 'bg-green-500 text-white border-green-600 hover:bg-green-600'
          }`}
          title={`当前环境: ${isLocalEnv ? '本地开发' : '生产环境'}`}
        >
          {isLocalEnv ? <Server size={16} /> : <Globe size={16} />}
          <span className="text-sm font-medium">
            {isLocalEnv ? 'DEV' : 'PROD'}
          </span>
        </button>
      )}
    </div>
  );
};

export default EnvSwitcher;