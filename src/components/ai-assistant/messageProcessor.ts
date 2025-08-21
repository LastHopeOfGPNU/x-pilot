import { generateMessageId } from '../../constants/aiAssistant';
import { Message } from '../../types/aiAssistant';

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
  console.log('Processing messages:', messages);
  
  if (hasActions) {
    return messages.filter(msg => {
      // 显示系统消息
      if (msg.role === 'system') return true;
      // 显示用户消息
      if (msg.role === 'user') return true;
      // 显示action消息（以@reply开头的AI消息）
      if (msg.role === 'assistant' && msg.content && typeof msg.content === 'string' && msg.content.startsWith('@reply')) return true;
      // 显示工具调用消息（有toolCalls的assistant消息）
      if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) return true;
      // 显示工具结果消息
      if (msg.role === 'tool') return true;
      // 显示工具调用消息（content为空但有generativeUI的assistant消息）
      if (msg.role === 'assistant' && (!msg.content || msg.content === '') && msg.generativeUI) return true;
      // 隐藏其他普通AI回复消息（content不为空且没有toolCalls的assistant消息）
      if (msg.role === 'assistant' && msg.content && !msg.toolCalls) return false;
      
      return true;
    });
  }
  
  return messages;
};

// 处理消息的主函数
export const processMessages = (copilotMessages: any[], fallbackMessages: Message[]): Message[] => {
  const copilotKitMessages = convertCopilotMessages(copilotMessages || []);
  const combinedMessages = copilotKitMessages.length > 0 ? copilotKitMessages : fallbackMessages;
  
  return filterMessages(combinedMessages);
};