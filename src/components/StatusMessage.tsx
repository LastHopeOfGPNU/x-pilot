import React from 'react';
import { AlertCircle, Square } from 'lucide-react';
import { isStatusMessage } from '../utils/aiAssistantUtils';

interface StatusMessageProps {
  content: string;
}

/**
 * 状态消息组件 - 用于渲染网络重试、错误和用户停止等状态消息
 */
const StatusMessage: React.FC<StatusMessageProps> = ({ content }) => {
  const { isNetworkError, isRetrying, isUserStopped, isStatus } = isStatusMessage(content);
  
  // 如果不是状态消息，返回null
  if (!isStatus) {
    return null;
  }
  
  // 网络错误消息
  if (isNetworkError) {
    return (
      <div className="flex justify-center mb-4">
        <div className="flex items-center p-3 space-x-2 max-w-md bg-red-50 rounded-lg border border-red-200">
          <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
          <span className="text-sm font-medium text-red-700">{content}</span>
        </div>
      </div>
    );
  }
  
  // 重试消息
  if (isRetrying) {
    return (
      <div className="flex justify-center mb-4">
        <div className="flex items-center p-3 space-x-2 max-w-md bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm font-medium text-blue-700">{content}</span>
        </div>
      </div>
    );
  }
  
  // 用户停止消息
  if (isUserStopped) {
    return (
      <div className="flex justify-center mb-4">
        <div className="flex items-center p-3 space-x-2 max-w-md bg-orange-50 rounded-lg border border-orange-200">
          <Square size={16} className="flex-shrink-0 text-orange-500" />
          <span className="text-sm font-medium text-orange-700">{content}</span>
        </div>
      </div>
    );
  }
  
  return null;
};

export default StatusMessage;