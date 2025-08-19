import { User } from '@supabase/supabase-js';
import { CapabilityOption, Message } from '../types/aiAssistant';
import { CAPABILITY_OPTIONS } from '../constants/aiAssistant';

/**
 * 获取用户显示名称
 */
export const getUserDisplayName = (user: User | null): string => {
  if (user?.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }
  if (user?.email) {
    return user.email.split('@')[0];
  }
  return 'You';
};

/**
 * 检查消息是否为状态消息
 */
export const isStatusMessage = (content: string) => {
  const isNetworkError = content.includes('Network connection failed') || content.includes('网络异常');
  const isRetrying = content.includes('Network retry');
  const isUserStopped = content.includes('Response stopped by user') || content.includes('用户中止响应');
  
  return {
    isNetworkError,
    isRetrying,
    isUserStopped,
    isStatus: isNetworkError || isRetrying || isUserStopped
  };
};

/**
 * 查找第一个未禁用的能力选项索引
 */
export const findFirstEnabledCapabilityIndex = (): number => {
  const firstEnabledIndex = CAPABILITY_OPTIONS.findIndex(option => !option.disabled);
  return firstEnabledIndex !== -1 ? firstEnabledIndex : 0;
};

/**
 * 根据查询文本过滤能力选项
 */
export const filterCapabilityOptions = (query: string): CapabilityOption[] => {
  return CAPABILITY_OPTIONS.filter(option =>
    option.label.toLowerCase().includes(query.toLowerCase())
  );
};

/**
 * 处理输入值中的@符号逻辑
 */
export const handleAtSymbolLogic = (value: string) => {
  const lastAtIndex = value.lastIndexOf('@');
  
  if (lastAtIndex === -1) {
    return {
      shouldShowSelector: false,
      textAfterAt: '',
      atPosition: -1
    };
  }
  
  const textAfterAt = value.substring(lastAtIndex + 1);
  const hasSpaceOrNewline = textAfterAt.includes(' ') || textAfterAt.includes('\n');
  
  if (hasSpaceOrNewline) {
    return {
      shouldShowSelector: false,
      textAfterAt,
      atPosition: lastAtIndex
    };
  }
  
  // 如果有@后的文本，检查是否有匹配的选项
  if (textAfterAt.length > 0) {
    const filteredOptions = filterCapabilityOptions(textAfterAt);
    return {
      shouldShowSelector: filteredOptions.length > 0,
      textAfterAt,
      atPosition: lastAtIndex
    };
  }
  
  return {
    shouldShowSelector: true,
    textAfterAt,
    atPosition: lastAtIndex
  };
};

/**
 * 处理能力选择后的输入值更新
 */
export const updateInputAfterCapabilitySelect = (inputValue: string): string => {
  const lastAtIndex = inputValue.lastIndexOf('@');
  if (lastAtIndex === -1) return inputValue;
  
  const beforeAt = inputValue.substring(0, lastAtIndex);
  const afterAt = inputValue.substring(lastAtIndex + 1);
  
  // 找到@后面单词的结束位置
  const spaceIndex = afterAt.indexOf(' ');
  const newlineIndex = afterAt.indexOf('\n');
  let endIndex = afterAt.length;
  
  if (spaceIndex !== -1) endIndex = Math.min(endIndex, spaceIndex);
  if (newlineIndex !== -1) endIndex = Math.min(endIndex, newlineIndex);
  
  const afterWord = afterAt.substring(endIndex);
  return beforeAt + afterWord;
};

/**
 * 处理键盘导航中的能力选项选择
 */
export const getNextCapabilityIndex = (currentIndex: number, direction: 'up' | 'down'): number => {
  let newIndex = currentIndex;
  const maxIndex = CAPABILITY_OPTIONS.length - 1;
  
  do {
    if (direction === 'up') {
      newIndex = newIndex > 0 ? newIndex - 1 : maxIndex;
    } else {
      newIndex = newIndex < maxIndex ? newIndex + 1 : 0;
    }
  } while (CAPABILITY_OPTIONS[newIndex].disabled && newIndex !== currentIndex);
  
  return newIndex;
};

/**
 * 创建状态消息
 */
export const createStatusMessage = (content: string, role: 'user' | 'assistant' = 'assistant'): Message => ({
  id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  content,
  role,
  timestamp: new Date().toISOString()
});

/**
 * 计算重试延迟时间
 */
export const calculateRetryDelay = (retryCount: number, baseDelay: number = 1000): number => {
  return baseDelay * (retryCount + 1);
};