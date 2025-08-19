import React from 'react';
import { MessageSquare, TrendingUp, Target, CheckCircle } from 'lucide-react';
import { CardType, Priority } from './types';

// Card icon utility function
export const getCardIcon = (type: CardType) => {
  const iconProps = { size: 16 };
  
  switch (type) {
    case 'post':
      return <MessageSquare {...iconProps} className="text-blue-600" />;
    case 'tweet':
      return <MessageSquare {...iconProps} className="text-sky-600" />;
    case 'strategy':
      return <TrendingUp {...iconProps} className="text-[#4792E6]" />;
    case 'action':
      return <Target {...iconProps} className="text-orange-600" />;
    default:
      return <MessageSquare {...iconProps} className="text-gray-600" />;
  }
};

// Card border color utility function
export const getCardBorderColor = (type: CardType): string => {
  switch (type) {
    case 'post':
      return 'border-l-blue-500';
    case 'tweet':
      return 'border-l-sky-500';
    case 'strategy':
      return 'border-l-[#4792E6]';
    case 'action':
      return 'border-l-orange-500';
    default:
      return 'border-l-gray-500';
  }
};

// Priority style utility function
export const getPriorityStyles = (priority: Priority): string => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-700';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'Low':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// Card background color utility function
export const getCardBackgroundColor = (type: CardType): string => {
  switch (type) {
    case 'post':
      return 'bg-blue-50';
    case 'tweet':
      return 'bg-sky-50';
    case 'strategy':
      return 'bg-blue-50';
    case 'action':
      return 'bg-orange-50';
    default:
      return 'bg-gray-50';
  }
};

// Card theme color utility function
export const getCardThemeColor = (type: CardType): string => {
  switch (type) {
    case 'post':
      return 'blue';
    case 'tweet':
      return 'sky';
    case 'strategy':
      return 'blue';
    case 'action':
      return 'orange';
    default:
      return 'gray';
  }
};

// Number formatting utility function
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Time formatting utility function
export const formatTime = (timestamp: string): string => {
  // More complex time formatting logic can be added here
  return timestamp;
};

// Verified badge component
export const VerifiedBadge: React.FC = () => (
  <div className="flex justify-center items-center w-5 h-5 bg-blue-500 rounded-full">
    <span className="text-xs text-white">✓</span>
  </div>
);

// Status indicator component
export const StatusIndicator: React.FC<{ status: string }> = ({ status }) => (
  <div className="flex items-center space-x-1">
    <CheckCircle size={12} className="text-green-500" />
    <span className="text-xs text-gray-600">{status}</span>
  </div>
);