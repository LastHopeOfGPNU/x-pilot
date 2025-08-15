import React, { useState, useEffect } from 'react';
import { Settings, Globe, Server, Sparkles } from 'lucide-react';
import { apiConfigService } from '../lib/apiConfigService';

interface EnvSwitcherProps {
  className?: string;
}

const EnvSwitcher: React.FC<EnvSwitcherProps> = ({ className = '' }) => {
  const [isLocalEnv, setIsLocalEnv] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOnboardingMode, setIsOnboardingMode] = useState(false);

  useEffect(() => {
    // 只在开发环境显示
    if (import.meta.env.PROD) return;
    
    setIsLocalEnv(apiConfigService.isUsingLocalApi());
    
    // 从localStorage读取onboarding模式状态
    const savedOnboardingMode = localStorage.getItem('dev-onboarding-mode') === 'true';
    setIsOnboardingMode(savedOnboardingMode);
    
    const handleApiChange = () => {
      setIsLocalEnv(apiConfigService.isUsingLocalApi());
    };
    
    apiConfigService.addListener(handleApiChange);
    
    return () => {
      apiConfigService.removeListener(handleApiChange);
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

  const handleOnboardingToggle = () => {
    const newOnboardingMode = !isOnboardingMode;
    setIsOnboardingMode(newOnboardingMode);
    localStorage.setItem('dev-onboarding-mode', newOnboardingMode.toString());
    
    // 如果开启onboarding模式，刷新页面以触发重新检查
    if (newOnboardingMode) {
      window.location.reload();
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
          
          {/* Onboarding模式选项 */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="mb-2">
              <div className="text-sm font-medium text-gray-700 mb-2">开发选项</div>
              <div
                className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all ${
                  isOnboardingMode
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={handleOnboardingToggle}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} />
                  <div>
                    <div className="font-medium text-sm">Onboarding模式</div>
                    <div className="text-xs text-gray-500">使用Mock数据进入引导流程</div>
                  </div>
                </div>
                {isOnboardingMode && (
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                )}
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