import { generateMessageId } from '../../constants/aiAssistant';
import { Message } from '../../types/aiAssistant';
import { devConfigService } from '../../lib/devConfigService';

// 转换CopilotKit消息格式，保持用户和AI消息的对应关系
export const convertCopilotMessages = (copilotMessages: any[]): Message[] => {
  return copilotMessages
    .filter(msg => msg && (msg.content !== undefined || msg.toolCalls || msg.role === 'tool'))
    .map(msg => {
      return {
        ...msg,
        id: msg.id || generateMessageId(),
        content: msg.content || '',
        timestamp: msg.timestamp || new Date().toISOString(),
        // 保留toolCalls信息
        toolCalls: msg.toolCalls,
        toolCallId: msg.toolCallId,
        toolName: msg.toolName
      };
    });
};

// 检查是否有action消息（以@reply开头的消息或工具调用消息）
export const hasActionMessages = (messages: Message[]): boolean => {
  return messages.some(msg => 
    (msg.content && typeof msg.content === 'string' && msg.content.startsWith('@reply')) ||
    (msg.role === 'assistant' && (!msg.content || msg.content === '') && msg.generativeUI) ||
    (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) ||
    (msg.role === 'tool')
  );
};

// 过滤消息，如果有action消息，只显示用户消息、action消息和系统消息，隐藏普通AI回复
export const filterMessages = (messages: Message[]): Message[] => {
  const hasActions = hasActionMessages(messages);
  const showAllMessages = devConfigService.getShowAllMessages();
  
  if (hasActions && !showAllMessages) {
    return messages.map(msg => {
      // 显示系统消息
      if (msg.role === 'system') return { ...msg, hidden: false };
      // 显示用户消息
      if (msg.role === 'user') return { ...msg, hidden: false };
      // 显示action消息（以@reply开头的AI消息）
      if (msg.role === 'assistant' && msg.content && typeof msg.content === 'string' && msg.content.startsWith('@reply')) return { ...msg, hidden: false };
      // 显示工具调用消息（有toolCalls的assistant消息）
      if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) return { ...msg, hidden: false };
      // 显示工具结果消息
      if (msg.role === 'tool') return { ...msg, hidden: false };
      // 显示工具调用消息（content为空但有generativeUI的assistant消息）
      if (msg.role === 'assistant' && (!msg.content || msg.content === '') && msg.generativeUI) return { ...msg, hidden: false };
      // 标记其他普通AI回复消息为隐藏（content不为空且没有toolCalls的assistant消息）
      if (msg.role === 'assistant' && msg.content && !msg.toolCalls) return { ...msg, hidden: true };
      
      return { ...msg, hidden: false };
    }).filter(msg => !msg.hidden || import.meta.env.DEV); // 在开发环境中显示隐藏的消息
  }
  
  // 如果没有action消息或者显示所有消息，则显示所有消息且不标记为隐藏
  return messages.map(msg => ({ ...msg, hidden: false }));
};

// 处理消息的主函数
export const processMessages = (copilotMessages: any[], fallbackMessages: Message[]): Message[] => {
  const copilotKitMessages = convertCopilotMessages(copilotMessages || []);
  const combinedMessages = copilotKitMessages.length > 0 ? copilotKitMessages : fallbackMessages;
  
  return filterMessages(combinedMessages);
};