import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const mouseUpHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

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

  // 拖拽相关函数

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const startPos = { x: e.clientX, y: e.clientY };
    const offset = { x: offsetX, y: offsetY };
    let isDraggingLocal = false;
    let hasDraggedLocal = false;

    setDragStartPos(startPos);
    setDragOffset(offset);
    setHasDragged(false);

    // 创建鼠标移动处理函数
    const mouseMoveHandler = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startPos.x);
      const deltaY = Math.abs(moveEvent.clientY - startPos.y);
      const dragThreshold = 5;

      if (!isDraggingLocal && (deltaX > dragThreshold || deltaY > dragThreshold)) {
        isDraggingLocal = true;
        hasDraggedLocal = true;
        setIsDragging(true);
        setHasDragged(true);
      }

      if (isDraggingLocal || (deltaX > dragThreshold || deltaY > dragThreshold)) {
        const newX = moveEvent.clientX - offset.x;
        const newY = moveEvent.clientY - offset.y;

        const boundedX = Math.max(16, Math.min(newX, window.innerWidth - (containerRef.current?.offsetWidth || 0) - 16));
        const boundedY = Math.max(16, Math.min(newY, window.innerHeight - (containerRef.current?.offsetHeight || 0) - 16));

        setPosition({ x: boundedX, y: boundedY });
      }
    };

    // 创建鼠标释放处理函数
    const mouseUpHandler = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    // 存储引用并添加事件监听器
    mouseMoveHandlerRef.current = mouseMoveHandler;
    mouseUpHandlerRef.current = mouseUpHandler;

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);

    e.preventDefault();
  };



  const handleButtonClick = (e: React.MouseEvent) => {
    // 如果发生了拖拽，阻止点击事件
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // 否则切换面板显示状态
    setIsExpanded(!isExpanded);
  };



  // 清理函数：组件卸载时移除可能残留的事件监听器
  useEffect(() => {
    return () => {
      if (mouseMoveHandlerRef.current) {
        document.removeEventListener('mousemove', mouseMoveHandlerRef.current);
      }
      if (mouseUpHandlerRef.current) {
        document.removeEventListener('mouseup', mouseUpHandlerRef.current);
      }
    };
  }, []);

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
    <div
      ref={containerRef}
      className={`absolute z-50 ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: 'none'
      }}
    >
      {isExpanded && (
        <div
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px]"
          style={{
            position: 'absolute',
            bottom: '60px', // 在按钮上方显示，60px是按钮高度加间距
            left: '0'
          }}
        >
          <div className="mb-3">
            <h3 className="flex gap-2 items-center text-sm font-semibold text-gray-800">
              <Settings size={16} />
              开发环境切换
            </h3>
          </div>

          <div className="space-y-2">
            {Object.entries(environments).map(([key, env]) => (
              <div
                key={key}
                className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all ${env.active
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                onClick={handleToggle}
              >
                <div className="flex gap-2 items-center">
                  {key === 'local' ? <Server size={16} /> : <Globe size={16} />}
                  <div>
                    <div className="text-sm font-medium">{env.name}</div>
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
          <div className="pt-3 mt-3 border-t border-gray-100">
            <div className="mb-2">
              <div className="mb-2 text-sm font-medium text-gray-700">开发选项</div>

              <div className="p-3 rounded-md border border-gray-200 transition-all hover:border-gray-300 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <RotateCcw size={16} className="text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">重置引导流程</div>
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

              <div className="p-3 mt-2 rounded-md border border-gray-200 transition-all hover:border-gray-300 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-700">跳过Onboarding</div>
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

              <div className="p-3 mt-2 rounded-md border border-gray-200 transition-all hover:border-gray-300 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <Terminal size={16} className="text-purple-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">CopilotKit 开发控制台</div>
                      <div className="text-xs text-gray-500">显示/隐藏 AI 助手开发调试面板</div>
                    </div>
                  </div>
                  <button
                    onClick={handleCopilotDevConsoleToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${showCopilotDevConsole ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showCopilotDevConsole ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              当前API: <span className="font-mono">{apiConfigService.getApiBaseUrl()}</span>
            </div>
          </div>
        </div>
      )}

      {/* 悬浮按钮始终显示 */}
      <button
        onClick={handleButtonClick}
        onMouseDown={handleMouseDown}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border transition-all hover:shadow-xl cursor-grab active:cursor-grabbing ${isLocalEnv
            ? 'text-white bg-orange-500 border-orange-600 hover:bg-orange-600'
            : 'text-white bg-green-500 border-green-600 hover:bg-green-600'
          } ${isExpanded ? 'mt-4' : ''}`}
        title={`当前环境: ${isLocalEnv ? '本地开发' : '生产环境'} - 可拖拽移动 - 点击${isExpanded ? '关闭' : '打开'}面板`}
      >
        {isLocalEnv ? <Server size={16} /> : <Globe size={16} />}
        <span className="text-sm font-medium">
          {isLocalEnv ? 'DEV' : 'PROD'}
        </span>
      </button>
    </div>
  );
};

export default EnvSwitcher;