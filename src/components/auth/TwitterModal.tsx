import React, { useEffect, useRef } from 'react';
import { X, CheckCircle, Star, Target } from 'lucide-react';

interface Account {
  id: string;
  username: string;
  display_name: string;
  profile_image_url: string | null;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  verified: boolean;
  is_starred: boolean;
  is_target: boolean;
}

interface TwitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName?: string;
  accountData?: Account;
  onLoadError?: () => void;
}

export const TwitterModal: React.FC<TwitterModalProps> = ({
  isOpen,
  onClose,
  username,
  displayName,
  accountData,
  onLoadError
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);



  // 点击背景关闭模态框
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const twitterUrl = `https://x.com/${username}`;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-900">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black dark:bg-white">
              <svg className="h-4 w-4 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Profile Preview
              </h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              aria-label="关闭模态框"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* 用户资料卡片 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-600">
            <div className="flex items-start space-x-4">
              {/* 头像 */}
              <div className="relative flex-shrink-0">
                {accountData?.profile_image_url ? (
                  <img
                    src={accountData.profile_image_url}
                    alt={accountData.display_name || displayName || username}
                    className="w-16 h-16 rounded-full border-3 border-white shadow-lg object-cover"
                    onError={(e) => {
                      // 如果图片加载失败，显示默认头像
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center"
                  style={{ display: accountData?.profile_image_url ? 'none' : 'flex' }}
                >
                  <span className="text-xl font-bold text-white">
                    {(accountData?.display_name || displayName || username).charAt(0).toUpperCase()}
                  </span>
                </div>
                {accountData?.verified && (
                  <CheckCircle className="absolute -bottom-1 -right-1 w-5 h-5 text-blue-500 bg-white rounded-full" />
                )}
              </div>

              {/* 用户信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {accountData?.display_name || displayName || username}
                  </h3>
                  <div className="flex items-center space-x-1">
                    {accountData?.is_starred && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                    {accountData?.is_target && (
                      <Target className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {(accountData?.username || username).startsWith('@') 
                    ? (accountData?.username || username) 
                    : `@${accountData?.username || username}`}
                </p>
                
                {/* 账户统计信息 */}
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  {accountData?.followers_count !== undefined && (
                    <div className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {accountData.followers_count.toLocaleString()}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        followers
                      </span>
                    </div>
                  )}
                  {accountData?.following_count !== undefined && (
                    <div className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {accountData.following_count.toLocaleString()}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        following
                      </span>
                    </div>
                  )}
                  {accountData?.tweet_count !== undefined && (
                    <div className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {accountData.tweet_count.toLocaleString()}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        tweets
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 安全提示 */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Due to X's security restrictions, we cannot display live content directly. Click "View on X" to see the complete profile.
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button
              onClick={() => window.open(twitterUrl, '_blank', 'noopener,noreferrer')}
              className="flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>View on X</span>
            </button>
            
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};