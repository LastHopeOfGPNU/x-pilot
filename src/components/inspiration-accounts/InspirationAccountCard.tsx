import React from 'react';
import { InspirationAccount } from '../../types';
import { CheckCircle, Users, Heart, Star } from 'lucide-react';

interface InspirationAccountCardProps {
  account: InspirationAccount;
  onToggleTarget: (id: number, isTargeted: boolean) => Promise<boolean>;
  onToggleStar: (id: number, starred: boolean) => Promise<boolean>;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  onClick?: (account: InspirationAccount) => void;
  isSelected?: boolean;
}

const InspirationAccountCard: React.FC<InspirationAccountCardProps> = ({ 
  account, 
  onToggleTarget, 
  onToggleStar, 
  onShowToast,
  onClick,
  isSelected = false
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Determine account type based on follower count
  const getAccountType = (followers: number): { type: string; color: string } => {
    if (followers >= 50000000) {
      return { type: 'Large', color: 'bg-red-100 text-red-800' };
    } else if (followers >= 5000000) {
      return { type: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { type: 'Small', color: 'bg-green-100 text-green-800' };
    }
  };

  const accountType = getAccountType(account.followers);

  // Truncate description text to avoid being too long
  const truncatedBio = account.bio.length > 80 ? account.bio.substring(0, 80) + '...' : account.bio;

  const handleStarClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (account.starred) {
      // Unstarring requires confirmation
      if (window.confirm('Are you sure you want to unstar this account?')) {
        // 等待操作完成后再显示提示
        const success = await onToggleStar(account.id, false);
        if (success && onShowToast) {
          onShowToast('Account unstarred', 'info');
        } else if (!success && onShowToast) {
          onShowToast('Failed to unstar account', 'error');
        }
      }
    } else {
      // Adding star is executed directly
      // 等待操作完成后再显示提示
      const success = await onToggleStar(account.id, true);
      if (success && onShowToast) {
        onShowToast('Account starred', 'success');
      } else if (!success && onShowToast) {
        onShowToast('Failed to star account', 'error');
      }
    }
  };

  const handleTargetClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await onToggleTarget(account.id, !account.isTargeted);
    
    // 如果有onShowToast函数，根据操作结果显示提示
    if (onShowToast) {
      if (success) {
        onShowToast(
          account.isTargeted ? 'Account removed from targets' : 'Account added to targets', 
          account.isTargeted ? 'info' : 'success'
        );
      } else {
        onShowToast(
          'Failed to update target status', 
          'error'
        );
      }
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(account);
    }
  };

  return (
    <div 
      className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
        isSelected 
          ? 'border-blue-300 bg-blue-50 shadow-lg ring-2 ring-blue-100' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={handleCardClick}
    >
      {/* Type Badge - moved to top */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${accountType.color}`}>
          {accountType.type}
        </span>
        <div className="flex items-center space-x-2">
          {/* Star Button */}
          <button
            onClick={handleStarClick}
            className={`p-1 rounded-full transition-colors ${
              account.starred 
                ? 'text-yellow-500 hover:text-yellow-600' 
                : 'text-gray-400 hover:text-yellow-500'
            }`}
            aria-label={account.starred ? 'Unstar account' : 'Star account'}
          >
            <Star 
              size={16} 
              className={account.starred ? 'fill-yellow-500' : ''} 
            />
          </button>
          
          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={account.isTargeted}
              onChange={handleTargetClick}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" style={{"--tw-ring-color": "rgba(71, 146, 230, 0.3)"} as React.CSSProperties}></div>
          </label>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center space-x-3 mb-3">
        <img
          src={account.avatar}
          alt={account.name}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {account.name}
            </h3>
            {account.verified && (
              <CheckCircle size={14} className="text-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-gray-600 text-xs truncate">{account.handle}</p>
        </div>
      </div>

      {/* Bio - shortened text */}
      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
        {truncatedBio}
      </p>

      {/* Stats */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Users size={14} className="text-gray-500" />
          <span className="text-xs text-gray-600">
            {formatNumber(account.followers)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Heart size={14} className="text-gray-500" />
          <span className="text-xs text-gray-600">
            {formatNumber(account.likes)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InspirationAccountCard;