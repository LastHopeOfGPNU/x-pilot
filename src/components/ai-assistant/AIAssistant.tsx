import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, Zap, ChevronLeft, ChevronRight, Square, AlertCircle, Maximize2, Minimize2, Plus, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import StatusMessage from '../common/StatusMessage';
import CapabilitySelector from './CapabilitySelector';
import { useCopilotChatHeadless_c, useCopilotContext } from '@copilotkit/react-core';
import { useAIAssistantActions } from './actions';
import { useAuth } from '../../contexts/AuthContext';
import { useAIAgentState } from './ShareState';
import {
  Message,
  AIAssistantProps
} from '../../types';
import {
  CAPABILITY_OPTIONS,
  generateMessageId
} from '../../constants/aiAssistant';
import {
  getUserDisplayName,
  findFirstEnabledCapabilityIndex,
  handleAtSymbolLogic,
  updateInputAfterCapabilitySelect,
  getNextCapabilityIndex,
  createStatusMessage,
} from '../../utils/aiAssistantUtils';
import { processMessages } from './messageProcessor';
import { devConfigService } from '../../lib/devConfigService';
import { logger } from '../../utils/logger';

// 类型定义已移至 ../types/aiAssistant.ts
// 常量定义已移至 ../constants/aiAssistant.ts

const AIAssistant: React.FC<AIAssistantProps> = ({ onExpandedChange }) => {
  const { user } = useAuth();

  // Get user display name - memoized to prevent unnecessary re-renders
  const userDisplayName = useMemo(() => getUserDisplayName(user), [user]);

  // Local UI state management
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpandedByButton, setIsExpandedByButton] = useState(false); // 区分是否通过按钮展开
  const [showCapabilitySelector, setShowCapabilitySelector] = useState(false);
  const [selectedCapabilityIndex, setSelectedCapabilityIndex] = useState(0);
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });
  const [selectedCapability, setSelectedCapability] = useState<typeof CAPABILITY_OPTIONS[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showAllMessages, setShowAllMessages] = useState(devConfigService.getShowAllMessages());

  // Use shared agent state management for core agent states
  const {
    state,
    setError,
    setIsLoading,
    setRetryCount,
    setShouldStopRetry,
    setIsSending
  } = useAIAgentState();

  // Destructure agent state for easier access
  const {
    error,
    isLoading,
    retryCount,
    shouldStopRetry,
    isSending
  } = state;

  // CopilotKit integration - no need for manual retry logic

  // CopilotKit chat integration
  const { messages: copilotMessages, sendMessage, isLoading: copilotLoading, reset, stopGeneration } = useCopilotChatHeadless_c();


  // CopilotKit context for thread management
  const { setThreadId: setCopilotThreadId } = useCopilotContext();

  // CopilotKit Actions
  useAIAssistantActions();


  // Notify parent component when expanded state changes
  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  const containerRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 处理容器焦点
  const handleContainerFocus = () => {
    setIsFocused(true);
    // 如果不是通过按钮展开的，点击时可以展开
    if (!isExpanded && !isExpandedByButton) {
      // 这里不设置展开，因为展开逻辑由CSS的isFocused控制
    }
  };

  // 处理容器失去焦点
  const handleContainerBlur = (e: React.FocusEvent) => {
    // 检查焦点是否移动到容器内的其他元素
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (containerRef.current && relatedTarget && containerRef.current.contains(relatedTarget)) {
      // 焦点仍在容器内，保持焦点状态
      return;
    }
    // 焦点移到容器外，失去焦点状态
    setIsFocused(false);
  };

  // 处理输入框失去焦点（现在由容器级别处理，这里保持空函数以避免冲突）
  const handleInputBlur = (e: React.FocusEvent) => {
    // 焦点管理现在由容器级别的 handleContainerBlur 处理
  };

  // Handle @ button click
  const handleAtButtonClick = () => {
    // 直接显示选择器，不在输入框中添加@符号
    setShowCapabilitySelector(true);
    // 找到第一个未禁用的选项
    setSelectedCapabilityIndex(findFirstEnabledCapabilityIndex());
    // 设置选择器位置在输入框上方
    setSelectorPosition({ top: -280, left: 0 });

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

    const result = handleAtSymbolLogic(value);

    if (result.shouldShowSelector) {
      setShowCapabilitySelector(true);
      setSelectedCapabilityIndex(findFirstEnabledCapabilityIndex());
      setSelectorPosition({ top: -280, left: 0 });
    } else {
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

    // 更新输入框内容，移除@符号
    const newValue = updateInputAfterCapabilitySelect(inputValue);
    setInputValue(newValue);

    setShowCapabilitySelector(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle capability selector navigation
    if (showCapabilitySelector) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedCapabilityIndex(prev => getNextCapabilityIndex(prev, 'up'));
          return;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedCapabilityIndex(prev => getNextCapabilityIndex(prev, 'down'));
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

  // 停止响应和重试
  const handleStopResponse = () => {
    if (isLoading || retryCount > 0) {
      setShouldStopRetry(true); // 设置停止重试标志
      setIsLoading(false);
      setRetryCount(0); // 重置重试计数
      setIsSending(false); // 重置发送状态

      // Add user stop message
      const stopMessage = createStatusMessage('Response stopped by user');
      setMessages(prev => [...prev, stopMessage]);
    }
    if (copilotLoading) {
      try {
        stopGeneration();
      } catch (error) {
        // 忽略停止生成时的错误，这是正常的用户操作
      }

      setIsSending(false); // 重置发送状态

      // Add user stop message for CopilotKit responses
      const stopMessage = createStatusMessage('Response stopped by user');
      setMessages(prev => [...prev, stopMessage]);
    }
  };

  // Handle submit with retry mechanism - 使用useCallback优化性能
  const handleSubmit = useCallback(async (message?: string, currentRetryCount = 0) => {
    let messageToSend = message || inputValue.trim();
    if (!messageToSend || (isLoading && currentRetryCount === 0) || copilotLoading || isSending) return;

    // 如果有选中的能力，在消息开头添加工具名称
    if (selectedCapability && currentRetryCount === 0) {
      messageToSend = `${selectedCapability.label} ${messageToSend}`;
    }

    // 防止重复发送
    if (currentRetryCount === 0) {
      setIsSending(true);
    }

    // Reset error and retry states on first attempt
    if (currentRetryCount === 0) {
      setError(null);
      setRetryCount(0);
      setShouldStopRetry(false);

      // Clear input only, keep capability selected
      setInputValue('');
    }

    setIsLoading(true);
    setRetryCount(currentRetryCount);

    try {
      // Send message to CopilotKit
      await sendMessage({
        id: generateMessageId(),
        role: 'user',
        content: messageToSend,
      });

      // Success - reset retry count and sending state
      setRetryCount(0);
      setIsSending(false);

    } catch (error) {
      logger.error('Error sending message:', error);

      // Check if we should retry (max 4 retries = 5 total attempts)
      if (currentRetryCount < 4 && !shouldStopRetry) {
        // Add retry status message to local messages
        const retryMessage = createStatusMessage(`Network retry (${currentRetryCount + 1}/5)...`);
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
      const errorMessage = createStatusMessage('Network connection failed, please check your network and try again');
      setMessages(prev => [...prev, errorMessage]);
      setError('Network connection failed, please check your network and try again');
      setIsSending(false); // 确保在错误情况下也重置发送状态

    } finally {
      if (currentRetryCount >= 4 || shouldStopRetry) {
        setIsLoading(false);
        setRetryCount(0);
        setIsSending(false);
      }
    }
  }, [inputValue, isLoading, copilotLoading, isSending, sendMessage, shouldStopRetry, retryCount, selectedCapability]);

  // 新增聊天窗口调用
  const handleNewChat = () => {
    // 生成新的threadId
    const newThreadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 使用CopilotKit的setThreadId来切换到新会话
    setCopilotThreadId(newThreadId);

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
    // 重置发送状态
    setIsSending(false);
    // 清空输入框
    setInputValue('');
    // 清除选中的能力
    setSelectedCapability(null);
  };

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 处理消息逻辑
  const allMessages = useMemo(() => {
    return processMessages(copilotMessages, messages);
  }, [copilotMessages, messages])

  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    if (allMessages.length > 0) {
      scrollToBottom();
    }
  }, [allMessages]);

  // 自动调整输入框高度 - 使用requestAnimationFrame避免抖动
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;

      // 使用requestAnimationFrame确保DOM更新完成后再调整高度
      requestAnimationFrame(() => {
        // 重置高度以获取正确的scrollHeight
        textarea.style.height = 'auto';
        // 设置新高度，限制在最小40px和最大128px之间
        const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 128);
        textarea.style.height = `${newHeight}px`;
      });
    }
  }, [inputValue]);

  // 处理点击外部区域关闭选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setShowCapabilitySelector(false);
      }
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        // 点击外部时，只有通过点击展开的面板才会收缩
        // 通过按钮展开的面板不会因为点击外部而收缩
        if (isExpanded && !isExpandedByButton) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, isExpandedByButton]);

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

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onClick={handleContainerFocus}
      onFocus={handleContainerFocus}
      onBlur={handleContainerBlur}
      data-guide="ai-chat"
      className={`h-full flex flex-col bg-white border-l border-gray-200 transition-all duration-300 ease-in-out outline-none ${isMinimized ? 'w-12' :
        isExpanded ? 'w-[45vw] min-w-[600px] max-w-[900px]' :
          isFocused ? 'w-[30vw] min-w-[400px] max-w-[600px]' : 'w-[25vw] min-w-[320px] max-w-[500px]'
        }`}
    >
      {isMinimized ? (
        /* Minimized State - Only expand button in top right */
        <div className="flex justify-end items-start p-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 mr-1"
            aria-label="Expand AI Assistant"
            title="Expand AI Assistant"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Zap size={20} className="text-[#4792E6]" />
              <span className="font-semibold text-gray-800">AI Assistant</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleNewChat}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                aria-label="Start new chat"
                title="New Chat"
              >
                <Plus size={18} className="text-gray-600" />
              </button>
              <button
                onClick={() => {
                  const newExpandedState = !isExpanded;
                  setIsExpanded(newExpandedState);
                  setIsExpandedByButton(newExpandedState); // 记录是通过按钮展开的
                }}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                aria-label={isExpanded ? "Minimize panel" : "Expand panel"}
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(true);
                }}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                aria-label="Hide AI Assistant"
                title="Hide AI Assistant"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

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
                      <div className="flex items-center p-3 mb-4 space-x-2 bg-red-50 rounded-lg border border-red-200">
                        <AlertCircle size={16} className="text-red-500" />
                        <span className="text-sm text-red-700">{error}</span>
                      </div>
                    )}

                    {/* CopilotKit handles network status */}

                    {/* Selected Capability Display */}
                    {renderSelectedCapability()}

                    {/* Input Area */}
                    <div className="relative">
                      {/* Input Suggestions */}
                      <div className="mb-3">
                        <div className="flex overflow-x-auto flex-nowrap gap-2 mb-3 scrollbar-hide">
                          <button
                            onClick={() => {
                              // 先自动选择@reply工具
                              const replyCapability = CAPABILITY_OPTIONS.find(option => option.id === 'reply');
                              if (replyCapability) {
                                handleCapabilitySelect(replyCapability);
                              }
                              // 然后设置输入框内容
                              setInputValue('help me reply');
                              textareaRef.current?.focus();
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 hover:text-[#4792E6] hover:border-[#4792E6] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4792E6] focus:ring-opacity-20 whitespace-nowrap flex-shrink-0"
                          >
                            <span className="mr-1.5">🤝</span>
                            @reply help me reply
                          </button>
                        </div>
                      </div>

                      <textarea
                        ref={textareaRef}
                        className="w-full resize-none border-0 bg-gray-50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4792E6] focus:bg-white text-sm transition-all duration-200 min-h-[80px] max-h-[240px]"
                        placeholder="Enter your operation..."
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={handleContainerFocus}
                        onBlur={handleInputBlur}
                        rows={2}
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word'
                        }}
                      />
                      {/* Capability Selector */}
                      {showCapabilitySelector && (
                        <CapabilitySelector
                          ref={selectorRef}
                          options={CAPABILITY_OPTIONS}
                          selectedIndex={selectedCapabilityIndex}
                          position={selectorPosition}
                          onSelect={handleCapabilitySelect}
                        />
                      )}
                    </div>

                    {/* Action Bar - Capability selector and Send button in same row */}
                    <div className="pt-3 mt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center space-x-3">
                        {/* Capability Selection Button */}
                        <button
                          onClick={handleAtButtonClick}
                          className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-[#4792E6] hover:bg-blue-50 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-[#4792E6]"
                          title="Select Capability"
                        >
                          <span className="text-sm font-medium">@</span>
                          <span className="text-sm">Tools</span>
                        </button>

                        {/* Send Button */}
                        <button
                          onClick={() => {
                            if (isLoading || retryCount > 0 || copilotLoading) {
                              handleStopResponse();
                            } else if (!isSending) {
                              handleSubmit(inputValue);
                            }
                          }}
                          disabled={(!inputValue.trim() && !(isLoading || retryCount > 0) && !copilotLoading) || (isSending && !(isLoading || retryCount > 0 || copilotLoading))}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none min-w-[80px] justify-center ${isLoading || retryCount > 0 || copilotLoading
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-[#4792E6] hover:bg-[#3a7bc8]'
                            }`}
                          title={isLoading || retryCount > 0 || copilotLoading ? "Stop" : isSending ? "Sending..." : "Send"}
                        >
                          {isLoading || retryCount > 0 || copilotLoading ? (
                            <Square size={16} />
                          ) : (
                            <Send size={16} />
                          )}
                          <span className="text-sm font-medium">
                            {isLoading || retryCount > 0 || copilotLoading ? "Stop" : isSending ? "Sending..." : "Send"}
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
                    className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} mb-4 group max-w-[90%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
                  >
                    {/* 第一行：头像、昵称 */}
                    <div className={`flex items-center gap-2 mb-1 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* 头像 */}
                      <div className="flex-shrink-0">
                        {message.role === 'user' ? (
                          <div className="w-8 h-8 rounded-full bg-[#4792E6] flex items-center justify-center">
                            <User size={16} className="text-white" />
                          </div>
                        ) : (
                          <div className="flex overflow-hidden justify-center items-center w-8 h-8 bg-white rounded-full border border-gray-200">
                            <img src="/xpilot-logo-fill-white.jpg" alt="X-Pilot" className="object-contain w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* 昵称 */}
                      <div className="text-xs text-gray-500">
                        {message.role === 'user' ? userDisplayName : 'X-Pilot'}
                      </div>
                    </div>

                    {/* 第二行：事件状态 */}
                    {message.content?.startsWith('@reply') && (
                      <div className={`mb-1 ${message.role === 'user' ? 'mr-2' : 'ml-2'}`}>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full border border-green-200">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                          Auto Reply
                        </span>
                      </div>
                    )}
                    
                    {/* 隐藏消息标识 */}
                    {message.hidden && import.meta.env.DEV && (
                      <div className={`mb-1 ${message.role === 'user' ? 'mr-2' : 'ml-2'}`}>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full border border-gray-300">
                          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></span>
                          Hidden
                        </span>
                      </div>
                    )}

                    {/* 第三行：消息气泡 */}
                    <div className={`${message.role === 'user' ? 'mr-2' : 'ml-2'}`}>
                      <div
                        className={`p-3 rounded-lg break-words whitespace-pre-wrap min-w-0 overflow-hidden ${
                          message.hidden && import.meta.env.DEV
                            ? message.role === 'user'
                              ? 'bg-gray-400 text-white rounded-tr-sm opacity-70'
                              : 'bg-gray-100 text-gray-600 border border-gray-300 rounded-tl-sm opacity-70'
                            : message.role === 'user'
                              ? 'bg-[#4792E6] text-white rounded-tr-sm'
                              : 'bg-white text-black border border-gray-200 rounded-tl-sm'
                        }`}
                        style={{
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto',
                          maxWidth: '100%'
                        }}
                      >
                        {/* Check if this is a status message */}
                        {message.role === 'assistant' && (
                          message.content?.includes('Network retry') ||
                          message.content?.includes('Network connection failed') ||
                          message.content?.includes('网络异常') ||
                          message.content?.includes('Response stopped by user') ||
                          message.content?.includes('用户中止响应')
                        ) ? (
                          <StatusMessage content={message.content} />
                        ) : (
                          <div className="break-words">
                            <ReactMarkdown>
                              {message.content?.startsWith('@reply ')
                                ? message.content.substring(7) // 移除 "@reply " 前缀
                                : message.content
                              }
                            </ReactMarkdown>
                            {/* This will render the tool-based HITL if it exists */}
                            {message.role === "assistant" && message.generativeUI?.()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* AI Loading Animation */}
                {copilotLoading && (
                  <div className="flex flex-col items-start mb-4 group max-w-[90%] mr-auto">
                    {/* 第一行：头像、昵称 */}
                    <div className="flex gap-2 items-center mb-1">
                      {/* AI头像 */}
                      <div className="flex-shrink-0">
                        <div className="flex overflow-hidden justify-center items-center w-8 h-8 bg-white rounded-full border border-gray-200">
                          <img src="/xpilot-logo-fill-white.jpg" alt="X-Pilot" className="object-contain w-6 h-6" />
                        </div>
                      </div>

                      {/* 昵称 */}
                      <div className="text-xs text-gray-500">
                        X Pilot
                      </div>
                    </div>

                    {/* 第二行：加载气泡 */}
                    <div className="ml-2">
                      <div className="p-3 bg-white rounded-lg rounded-tl-sm border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <span className="ml-2 text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Input */}
              <div className="p-4 border-t border-gray-200">
                {/* Error Display */}
                {error && (
                  <div className="flex items-center p-3 mb-4 space-x-2 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                {/* CopilotKit handles network status */}

                {/* Selected Capability Display */}
                {renderSelectedCapability()}

                <div className="relative">
                  {/* Input Suggestions */}
                  <div className="mb-3">
                    <div className="flex overflow-x-auto flex-nowrap gap-2 mb-3 scrollbar-hide">
                      <button
                        onClick={() => {
                            // 先自动选择@reply工具
                            const replyCapability = CAPABILITY_OPTIONS.find(option => option.id === 'reply');
                            if (replyCapability) {
                              handleCapabilitySelect(replyCapability);
                            }
                            // 然后设置输入框内容
                            setInputValue('help me reply');
                            textareaRef.current?.focus();
                          }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 hover:text-[#4792E6] hover:border-[#4792E6] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4792E6] focus:ring-opacity-20 whitespace-nowrap flex-shrink-0"
                      >
                        <span className="mr-1.5">🤝</span>
                        help me reply
                      </button>
                    </div>
                  </div>

                  {/* Text Input Area - Top */}
                  <div className="mb-3">
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#4792E6] text-sm overflow-hidden"
                        placeholder="Type your message..."
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={handleContainerFocus}
                        onBlur={handleInputBlur}
                        rows={1}
                        data-guide="input-area"
                        style={{
                          height: '40px',
                          minHeight: '40px',
                          maxHeight: '128px',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word'
                        }}
                      />

                      {/* Capability Selector Popup */}
                      {showCapabilitySelector && (
                        <CapabilitySelector
                          ref={selectorRef}
                          options={CAPABILITY_OPTIONS}
                          selectedIndex={selectedCapabilityIndex}
                          position={selectorPosition}
                          onSelect={handleCapabilitySelect}
                        />
                      )}
                    </div>
                  </div>

                  {/* Action Bar - Capability selector and Send button in same row - Bottom */}
                  <div className="flex justify-between items-center space-x-3">
                    {/* Capability Selection Button */}
                    <button
                      onClick={handleAtButtonClick}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-[#4792E6] hover:bg-blue-50 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-[#4792E6]"
                      title="Select Capability"
                      data-guide="tools-button"
                    >
                      <span className="text-sm font-medium">@</span>
                      <span className="text-sm">Tools</span>
                    </button>

                    {/* Send Button */}
                    <button
                      onClick={() => {
                        if (isLoading || retryCount > 0 || copilotLoading) {
                          handleStopResponse();
                        } else if (!isSending) {
                          handleSubmit(inputValue);
                        }
                      }}
                      disabled={(!inputValue.trim() && !(isLoading || retryCount > 0) && !copilotLoading) || (isSending && !(isLoading || retryCount > 0 || copilotLoading))}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none min-w-[80px] justify-center ${isLoading || retryCount > 0 || copilotLoading
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-[#4792E6] hover:bg-[#3a7bc8]'
                        }`}
                      title={isLoading || retryCount > 0 || copilotLoading ? "Stop" : isSending ? "Sending..." : "Send"}
                      data-guide="send-button"
                    >
                      {isLoading || retryCount > 0 || copilotLoading ? (
                        <Square size={16} />
                      ) : (
                        <Send size={16} />
                      )}
                      <span className="text-sm font-medium">
                        {isLoading || retryCount > 0 || copilotLoading ? "Stop" : isSending ? "Sending..." : "Send"}
                      </span>
                    </button>
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