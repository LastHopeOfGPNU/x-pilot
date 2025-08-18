import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, ChevronLeft, ChevronRight, Square, Loader2, AlertCircle, Wifi, WifiOff, Maximize2, Minimize2, Plus, Copy, User, UserCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import PlanGenerationCard from './PlanGenerationCard';
import SimplePlanCard from './SimplePlanCard';
import ExecutionStepsCard from './ExecutionStepsCard';
import { supabase } from '../lib/supabase';
import { apiConfigService } from '../lib/apiConfigService';
import { useCopilotAction, useCopilotReadable, useCopilotChat } from '@copilotkit/react-core';
import { TextMessage, MessageRole } from '@copilotkit/runtime-client-gql';
import { useAuth } from '../contexts/AuthContext';

// 定义消息类型
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  planData?: PlanData;
}

// 定义计划数据类型
interface PlanData {
  id: string;
  title: string;
  description?: string;
  steps: PlanStep[];
  markdownContent?: string;
  mermaidDiagram?: string;
  status: 'generating' | 'ready' | 'confirmed' | 'executing' | 'completed';
  progress?: number;
}

interface PlanStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  estimatedTime?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked';
}

interface AIAssistantProps {
  onExpandedChange?: (expanded: boolean) => void;
}

// 定义后端请求结构
interface BackendRequest {
  state: any[];
  tools: any[];
  context: any[];
  forwardedProps: Record<string, any>;
  messages: Array<{
    content: string;
    role: string;
    id: string;
  }>;
  runId: string;
  threadId: string;
}

// Capability selector options
const CAPABILITY_OPTIONS = [
  { id: 'post', label: '@post', description: 'Vibe Generation Post', disabled: true },
  { id: 'thread', label: '@thread', description: 'Vibe Generation Thread', disabled: true },
  { id: 'strategy', label: '@strategy', description: 'Vibe Operation Strategy', disabled: true },
  { id: 'reply', label: '@reply', description: 'Vibe Auto Reply', disabled: false }
];

const AIAssistant: React.FC<AIAssistantProps> = ({ onExpandedChange }) => {
  const { user } = useAuth();
  
  // Get user display name
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'You';
  };
  
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showCapabilitySelector, setShowCapabilitySelector] = useState(false);
  const [selectedCapabilityIndex, setSelectedCapabilityIndex] = useState(0);
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });
  const [atTriggerPosition, setAtTriggerPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedCapability, setSelectedCapability] = useState<typeof CAPABILITY_OPTIONS[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(() => `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [retryCount, setRetryCount] = useState(0);
  const [shouldStopRetry, setShouldStopRetry] = useState(false);
  // CopilotKit integration - no need for manual retry logic
  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null);
  const [planGenerationBuffer, setPlanGenerationBuffer] = useState<string>('');
  const [simplePlan, setSimplePlan] = useState<{ steps: string[] } | null>(null);
  const [executionSteps, setExecutionSteps] = useState<Array<{
    step: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    description: string;
    details?: string;
  }> | null>(null);

  // CopilotKit chat integration
  const { appendMessage, isLoading: copilotLoading, visibleMessages, reset } = useCopilotChat();

  // CopilotKit Integration
  useCopilotReadable({
    description: "Current conversation messages and context",
    value: {
      messages,
      currentPlan,
      selectedCapability,
      threadId
    }
  });

  useCopilotAction({
    name: "generatePlan",
    description: "Generate a detailed plan based on user requirements",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "The title of the plan"
      },
      {
        name: "description",
        type: "string",
        description: "Description of what the plan will accomplish"
      },
      {
        name: "steps",
        type: "object[]",
        description: "Array of plan steps with details"
      }
    ],
    handler: async ({ title, description, steps }) => {
      const newPlan: PlanData = {
        id: generateId(),
        title,
        description,
        steps: steps.map((step: any, index: number) => ({
          id: generateId(),
          stepNumber: index + 1,
          title: step.title || `Step ${index + 1}`,
          description: step.description || '',
          priority: step.priority || 'medium',
          status: 'pending'
        })),
        status: 'ready',
        progress: 0
      };
      setCurrentPlan(newPlan);
      return `Plan "${title}" has been generated with ${steps.length} steps.`;
    }
  });

  useCopilotAction({
    name: "updatePlanStatus",
    description: "Update the status of the current plan",
    parameters: [
      {
        name: "status",
        type: "string",
        description: "New status for the plan (ready, confirmed, executing, completed)"
      }
    ],
    handler: async ({ status }) => {
      if (currentPlan) {
        setCurrentPlan({ ...currentPlan, status: status as any });
        return `Plan status updated to ${status}`;
      }
      return "No active plan to update";
    }
  });

  useCopilotAction({
    name: "setSelectedCapability",
    description: "Set the selected capability for the conversation",
    parameters: [
      {
        name: "capability",
        type: "string",
        description: "The capability to select (post, thread, strategy, reply)"
      }
    ],
    handler: async ({ capability }) => {
      const option = CAPABILITY_OPTIONS.find(opt => opt.value === capability);
      if (option && !option.disabled) {
        setSelectedCapability(option);
        return `Selected capability: ${option.label}`;
      }
      return `Capability ${capability} not found or disabled`;
    }
  });
  
  // Notify parent component when expanded state changes
  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  const containerRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 生成唯一ID
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 获取认证头
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('用户未登录');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  };

  // 处理容器焦点
  const handleContainerFocus = () => {
    setIsFocused(true);
  };

  // Handle @ button click
  const handleAtButtonClick = () => {
    // 直接显示选择器，不在输入框中添加@符号
    setShowCapabilitySelector(true);
    // 找到第一个未禁用的选项
    const firstEnabledIndex = CAPABILITY_OPTIONS.findIndex(option => !option.disabled);
    setSelectedCapabilityIndex(firstEnabledIndex !== -1 ? firstEnabledIndex : 0);
    // 设置选择器位置在输入框下方
    setSelectorPosition({ top: 50, left: 0 });
    
    // Focus the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Handle input value changes and detect @ symbol
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    const lastAtIndex = value.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Get text after the last @
      const textAfterAt = value.substring(lastAtIndex + 1);
      
      // Check if there's a space or newline after @, which should close the selector
      if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
        setShowCapabilitySelector(false);
      } else {
        // Show selector when @ is present and no space/newline after it
        setShowCapabilitySelector(true);
        // 找到第一个未禁用的选项
        const firstEnabledIndex = CAPABILITY_OPTIONS.findIndex(option => !option.disabled);
        setSelectedCapabilityIndex(firstEnabledIndex !== -1 ? firstEnabledIndex : 0);
        setAtTriggerPosition(lastAtIndex);
        
        // 设置选择器位置在输入框下方
        setSelectorPosition({ top: 50, left: 0 });
        
        // If there's text after @, filter options
        if (textAfterAt.length > 0) {
          const filteredOptions = CAPABILITY_OPTIONS.filter(option =>
            option.label.toLowerCase().includes(textAfterAt.toLowerCase())
          );
          // Only show selector if there are matching options
          if (filteredOptions.length === 0) {
            setShowCapabilitySelector(false);
          }
        }
      }
    } else {
      // No @ symbol found, hide selector
      setShowCapabilitySelector(false);
    }
  };

  // Handle capability selection
  const handleCapabilitySelect = (capability: typeof CAPABILITY_OPTIONS[0]) => {
    // 如果选项被禁用，则不执行任何操作
    if (capability.disabled) {
      return;
    }
    
    // 设置选中的能力，显示在输入框上方
    setSelectedCapability(capability);
    
    // 如果输入框中有@符号，则删除它
    const lastAtIndex = inputValue.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const beforeAt = inputValue.substring(0, lastAtIndex);
      const afterAt = inputValue.substring(lastAtIndex + 1);
      
      // 找到@后面单词的结束位置
      const spaceIndex = afterAt.indexOf(' ');
      const newlineIndex = afterAt.indexOf('\n');
      let endIndex = afterAt.length;
      
      if (spaceIndex !== -1) endIndex = Math.min(endIndex, spaceIndex);
      if (newlineIndex !== -1) endIndex = Math.min(endIndex, newlineIndex);
      
      const afterWord = afterAt.substring(endIndex);
      const newValue = beforeAt + afterWord;
      setInputValue(newValue);
    }
    
    setShowCapabilitySelector(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle capability selector navigation
    if (showCapabilitySelector) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedCapabilityIndex(prev => {
            let newIndex = prev;
            do {
              newIndex = newIndex > 0 ? newIndex - 1 : CAPABILITY_OPTIONS.length - 1;
            } while (CAPABILITY_OPTIONS[newIndex].disabled && newIndex !== prev);
            return newIndex;
          });
          return;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedCapabilityIndex(prev => {
            let newIndex = prev;
            do {
              newIndex = newIndex < CAPABILITY_OPTIONS.length - 1 ? newIndex + 1 : 0;
            } while (CAPABILITY_OPTIONS[newIndex].disabled && newIndex !== prev);
            return newIndex;
          });
          return;
        case 'Enter':
          e.preventDefault();
          handleCapabilitySelect(CAPABILITY_OPTIONS[selectedCapabilityIndex]);
          return;
        case 'Escape':
          e.preventDefault();
          setShowCapabilitySelector(false);
          return;
        case 'Tab':
          e.preventDefault();
          handleCapabilitySelect(CAPABILITY_OPTIONS[selectedCapabilityIndex]);
          return;
      }
    }

    // Handle normal input
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isLoading || retryCount > 0) {
        handleStopResponse();
      } else {
        handleSubmit(inputValue);
      }
    }
  };

  // Plan management functions
  const handlePlanConfirm = () => {
    if (currentPlan) {
      setCurrentPlan({ ...currentPlan, status: 'confirmed' });
    }
  };

  const handlePlanExecute = () => {
    if (currentPlan) {
      setCurrentPlan({ ...currentPlan, status: 'executing' });
      // Simulate execution progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (currentPlan) {
          setCurrentPlan(prev => prev ? { ...prev, progress } : null);
        }
        if (progress >= 100) {
          clearInterval(interval);
          setCurrentPlan(prev => prev ? { ...prev, status: 'completed' } : null);
        }
      }, 500);
    }
  };

  const handlePlanCancel = () => {
    setCurrentPlan(null);
  };

  const handlePlanEdit = () => {
    if (currentPlan) {
      setCurrentPlan({ ...currentPlan, status: 'ready' });
    }
  };

  // 停止响应和重试
  const handleStopResponse = () => {
    if (isLoading || retryCount > 0) {
      setShouldStopRetry(true); // 设置停止重试标志
      setIsLoading(false);
      setRetryCount(0); // 重置重试计数
    }
  };

  // CopilotKit handles all network communication and error handling

  // Handle submit with retry mechanism
  const handleSubmit = async (message?: string, currentRetryCount = 0) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend || (isLoading && currentRetryCount === 0) || copilotLoading) return;

    // Reset error and retry states on first attempt
    if (currentRetryCount === 0) {
      setError(null);
      setRetryCount(0);
      setShouldStopRetry(false);
      
      // Clear input and capability
      setInputValue('');
      setSelectedCapability(null);
    }
    
    setIsLoading(true);
    setRetryCount(currentRetryCount);

    try {
      // Send message to CopilotKit
      await appendMessage(
        new TextMessage({
          role: MessageRole.User,
          content: messageToSend,
        })
      );
      
      // Success - reset retry count
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Check if we should retry (max 4 retries = 5 total attempts)
      if (currentRetryCount < 4 && !shouldStopRetry) {
        // Add retry status message to local messages
        const retryMessage: Message = {
          id: generateId(),
          content: `网络重试中 (${currentRetryCount + 1}/5)...`,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, retryMessage]);
        
        // Update retry count
        setRetryCount(currentRetryCount + 1);
        
        // Retry with exponential backoff
        setTimeout(() => {
          if (!shouldStopRetry) {
            handleSubmit(messageToSend, currentRetryCount + 1);
          }
        }, 1000 * (currentRetryCount + 1));
        
        return;
      }
      
      // Max retries reached or stopped - show error
      const errorMessage: Message = {
        id: generateId(),
        content: '网络异常，请重试！',
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setError('网络连接失败，请检查网络后重试');
      
    } finally {
      if (currentRetryCount >= 4 || shouldStopRetry) {
        setIsLoading(false);
        setRetryCount(0);
      }
    }
  };

  // 新增聊天窗口功能
  const handleNewChat = () => {
    // Reset CopilotKit chat state
    reset();
    
    // 清空当前消息
    setMessages([]);
    // 重置加载状态
    setIsLoading(false);
    // 清除错误信息
    setError(null);
    // 重置重试计数和停止标志
    setRetryCount(0);
    setShouldStopRetry(false);
    // 清空输入框
    setInputValue('');
    // 清除选中的能力
    setSelectedCapability(null);
    // 清除计划相关状态
    setCurrentPlan(null);
    setPlanGenerationBuffer('');
    setSimplePlan(null);
    setExecutionSteps(null);
    // 重新生成threadId，确保新对话有独立的会话ID
    setThreadId(`thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  };

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 转换CopilotKit消息格式
  const convertVisibleMessages = (visibleMessages: any[]) => {
    return visibleMessages
      .filter(msg => msg && (msg.isTextMessage?.() || (msg.role && msg.content !== undefined)))
      .map(msg => {
        // 处理CopilotKit TextMessage格式
        if (msg.isTextMessage && msg.isTextMessage()) {
          return {
            id: generateId(),
            role: msg.role === 'User' ? 'user' : 'assistant',
            content: msg.content || '',
            timestamp: new Date().toISOString()
          };
        }
        // 处理简单消息格式
        if (msg.role && msg.content !== undefined) {
          return {
            id: generateId(),
            role: msg.role.toLowerCase() === 'user' ? 'user' : 'assistant',
            content: msg.content || '',
            timestamp: new Date().toISOString()
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  // 合并本地消息和CopilotKit消息
  const allMessages = [...messages, ...convertVisibleMessages(visibleMessages || [])];

  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    if (allMessages.length > 0) {
      scrollToBottom();
    }
  }, [allMessages]);

  // 处理点击外部区域关闭选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setShowCapabilitySelector(false);
      }
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 渲染选中的能力标签
  const renderSelectedCapability = () => {
    if (!selectedCapability) return null;

    return (
      <div className="flex justify-between items-center px-3 py-2 mb-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-[#4792E6]">{selectedCapability.label}</span>
          <span className="text-xs text-[#4792E6]">{selectedCapability.description}</span>
        </div>
        <button
          onClick={() => setSelectedCapability(null)}
          className="text-[#4792E6] transition-colors hover:text-[#3a7bc8]"
          title="Remove capability"
        >
          ×
        </button>
      </div>
    );
  };

  // Render capability selector with enhanced UI and keyboard navigation
  const renderCapabilitySelector = () => {
    if (!showCapabilitySelector) return null;

    return (
      <div
        ref={selectorRef}
        className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-[280px] backdrop-blur-sm"
        style={{
          top: selectorPosition.top,
          left: selectorPosition.left,
          animation: 'fadeInUp 0.15s ease-out'
        }}
      >
        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
          Select Capability
        </div>
        {CAPABILITY_OPTIONS.map((option, index) => (
          <button
            key={option.id}
            onClick={() => handleCapabilitySelect(option)}
            disabled={option.disabled}
            className={`flex items-center justify-between px-4 py-3 w-full text-left transition-all duration-150 ${
              option.disabled
                ? 'opacity-50 cursor-not-allowed bg-gray-50'
                : index === selectedCapabilityIndex
                ? 'bg-blue-50 border-l-2 border-[#4792E6]'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className={`font-medium ${
                option.disabled
                  ? 'text-gray-400'
                  : index === selectedCapabilityIndex ? 'text-[#4792E6]' : 'text-[#4792E6]'
              }`}>
                {option.label}
              </span>
              <span className={`text-sm ${
                option.disabled ? 'text-gray-400' : 'text-gray-600'
              }`}>{option.description}</span>
            </div>
            {index === selectedCapabilityIndex && !option.disabled && (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <span>↵</span>
              </div>
            )}
          </button>
        ))}
        <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
          ↑↓ Navigate • ↵ Select • Esc Cancel
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleContainerFocus}
      className={`h-full flex flex-col bg-white transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-[55vw] min-w-[600px] max-w-[800px]' : isFocused ? 'w-[420px]' : 'w-[380px]'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Zap size={20} className="text-[#4792E6]" />
          <span className="font-semibold text-gray-800">AI Assistant</span>
        </div>
        <div className="flex items-center space-x-2">
          {!isMinimized && (
            <>
              <button
                onClick={handleNewChat}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                aria-label="Start new chat"
                title="New Chat"
              >
                <Plus size={18} className="text-gray-600" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                aria-label={isExpanded ? "Minimize panel" : "Expand panel"}
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
            aria-label={isMinimized ? "Expand operation panel" : "Collapse operation panel"}
          >
            {isMinimized ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          {allMessages.length === 0 ? (
            /* Empty State - Centered Input */
            <div className="flex flex-col flex-1 justify-center items-center p-8">
              {/* Welcome Section */}
              <div className="mb-8 max-w-md text-center">
                <div className="mb-4">
                  <Zap size={48} className="mx-auto mb-4 text-[#4792E6]" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-800">
                  Vibe X Operation
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  Start your vibe operation here
                </p>
              </div>

              {/* Centered Input Card */}
              <div className="w-full max-w-lg">
                <div className="relative bg-white rounded-xl border border-gray-200 shadow-lg transition-all duration-200 hover:shadow-xl">
                  <div className="p-6">
                    {/* Error Display */}
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                        <AlertCircle size={16} className="text-red-500" />
                        <span className="text-sm text-red-700">{error}</span>
                      </div>
                    )}

                    {/* CopilotKit handles network status */}

                    {/* Selected Capability Display */}
                    {renderSelectedCapability()}

                    {/* Input Area */}
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        className="w-full resize-none border-0 bg-gray-50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4792E6] focus:bg-white text-sm transition-all duration-200 min-h-[80px] max-h-[240px]"
                        placeholder="Enter your operation..."
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        rows={2}
                      />
                      {/* Capability Selector */}
                      {renderCapabilitySelector()}
                    </div>
                    
                    {/* Action Bar - Capability selector and Send button in same row */}
                    <div className="pt-3 mt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between space-x-3">
                        {/* Capability Selection Button */}
                        <button
                          onClick={handleAtButtonClick}
                          className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-[#4792E6] hover:bg-blue-50 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-[#4792E6]"
                          title="Select Capability"
                        >
                          <span className="text-sm font-medium">@</span>
                          <span className="text-sm">Select Capability</span>
                        </button>
                        
                        {/* Send Button */}
                        <button
                          onClick={() => {
                            if (isLoading || retryCount > 0) {
                              handleStopResponse();
                            } else {
                              handleSubmit(inputValue);
                            }
                          }}
                          disabled={!inputValue.trim() && !(isLoading || retryCount > 0) && !copilotLoading}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#4792E6] hover:bg-[#3a7bc8] disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none min-w-[80px] justify-center"
                          title={isLoading || retryCount > 0 ? "Stop" : "Send"}
                        >
                          {isLoading || retryCount > 0 ? (
                            <Square size={16} />
                          ) : copilotLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                          <span className="text-sm font-medium">
                            {isLoading || retryCount > 0 ? "Stop" : "Send"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Chat Mode - Messages + Bottom Input */
            <>
              {/* Messages */}
              <div className="overflow-y-auto flex-1 p-4 space-y-4 min-h-0">
                {allMessages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 group`}
                  >
                    <div className={`flex ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} items-start space-x-3 max-w-[80%]`}>
                      {/* 头像 */}
                      <div className="flex-shrink-0">
                        {message.role === 'user' ? (
                          <div className="w-8 h-8 rounded-full bg-[#4792E6] flex items-center justify-center">
                            <UserCircle size={16} className="text-white" />
                          </div>
                        ) : (
                          <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-[#4792E6] to-[#3a7bc8] rounded-full">
                            <span className="text-xs font-bold text-white tracking-tight">XP</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 消息内容区域 */}
                      <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* 昵称 */}
                        <div className="mb-1 text-xs text-gray-500">
                          {message.role === 'user' ? getUserDisplayName() : 'X-Piloter'}
                        </div>
                        
                        {/* 消息气泡 */}
                        <div
                          className={`p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-[#4792E6] text-white rounded-tr-sm'
                              : 'bg-white text-black border border-gray-200 rounded-tl-sm'
                          }`}
                        >
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Plan Components */}
                {currentPlan && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[80%]">
                      <PlanGenerationCard
                        plan={currentPlan}
                        onConfirm={handlePlanConfirm}
                        onExecute={handlePlanExecute}
                        onCancel={handlePlanCancel}
                        onEdit={handlePlanEdit}
                      />
                    </div>
                  </div>
                )}
                
                {simplePlan && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[80%]">
                      <SimplePlanCard
                        plan={simplePlan}
                        onApprove={() => setSimplePlan(null)}
                        onReject={() => setSimplePlan(null)}
                      />
                    </div>
                  </div>
                )}
                
                {executionSteps && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[80%]">
                      <ExecutionStepsCard
                        steps={executionSteps}
                        onComplete={() => setExecutionSteps(null)}
                      />
                    </div>
                  </div>
                )}
                
                {/* AI Loading Animation */}
                {copilotLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-start space-x-3 max-w-[80%]">
                      {/* AI头像 */}
                       <div className="flex-shrink-0">
                         <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-[#4792E6] to-[#3a7bc8] rounded-full">
                           <Zap size={14} className="text-white" />
                         </div>
                       </div>
                      
                      {/* 加载内容区域 */}
                      <div className="flex flex-col items-start">
                        {/* 昵称 */}
                        <div className="mb-1 text-xs text-gray-500">
                          X Pilot
                        </div>
                        
                        {/* 加载气泡 */}
                        <div className="p-3 bg-white rounded-lg rounded-tl-sm border border-gray-200">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <span className="text-sm text-gray-600 ml-2">正在思考...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Input */}
              <div className="border-t border-gray-200 p-4">
                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}
                
                {/* CopilotKit handles network status */}
                
                {/* Selected Capability Display */}
                {renderSelectedCapability()}
                
                <div className="relative">
                  <div className="flex items-end space-x-2">
                    <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#4792E6] text-sm min-h-[40px] max-h-32"
                        placeholder="Type your message..."
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        rows={1}
                        style={{ height: 'auto' }}
                      />
                      
                      {/* Capability Selector */}
                      {renderCapabilitySelector()}
                    </div>
                    
                    {/* Action Bar - Capability selector and Send button in same row */}
                    <div className="pt-3 mt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between space-x-3">
                        {/* Capability Selection Button */}
                        <button
                          onClick={handleAtButtonClick}
                          className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-[#4792E6] hover:bg-blue-50 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-[#4792E6]"
                          title="Select Capability"
                        >
                          <span className="text-sm font-medium">@</span>
                          <span className="text-sm">Select Capability</span>
                        </button>
                        
                        {/* Send Button */}
                        <button
                          onClick={() => {
                            if (isLoading || retryCount > 0) {
                              handleStopResponse();
                            } else {
                              handleSubmit(inputValue);
                            }
                          }}
                          disabled={!inputValue.trim() && !(isLoading || retryCount > 0) && !copilotLoading}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#4792E6] hover:bg-[#3a7bc8] disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none min-w-[80px] justify-center"
                          title={isLoading || retryCount > 0 ? "Stop" : "Send"}
                        >
                          {isLoading || retryCount > 0 ? (
                            <Square size={16} />
                          ) : copilotLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                          <span className="text-sm font-medium">
                            {isLoading || retryCount > 0 ? "Stop" : "Send"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AIAssistant;