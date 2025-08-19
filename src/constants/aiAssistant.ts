import { CapabilityOption } from '../components/ai-assistant/types';

// 能力选择器选项常量
export const CAPABILITY_OPTIONS: CapabilityOption[] = [
  { id: 'post', label: '@post', description: 'Generate engaging posts', disabled: true },
  { id: 'thread', label: '@thread', description: 'Create thread content', disabled: true },
  { id: 'strategy', label: '@strategy', description: 'Plan content strategy', disabled: true },
  { id: 'reply', label: '@reply', description: 'Auto-reply to messages', disabled: false }
];

// 重试配置常量
export const RETRY_CONFIG = {
  MAX_RETRIES: 4,
  TOTAL_ATTEMPTS: 5,
  BASE_DELAY: 1000
} as const;

// 选择器位置常量
export const SELECTOR_CONFIG = {
  TOP_OFFSET: -280,
  LEFT_OFFSET: 0
} as const;

// 线程ID生成函数
export const generateThreadId = (): string => 
  `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 消息ID生成函数
export const generateMessageId = (): string => 
  `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;