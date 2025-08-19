import React, { useEffect, useRef, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface TwitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName?: string;
  onLoadError?: () => void; // Callback to trigger refresh button flash
}

export const TwitterModal: React.FC<TwitterModalProps> = ({
  isOpen,
  onClose,
  username,
  displayName,
  onLoadError
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'error' | 'loaded'>('loading');

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

  // Simulate loading and error states
  useEffect(() => {
    if (isOpen) {
      setLoadingState('loading');
      // Simulate loading time
      const timer = setTimeout(() => {
        // Simulate X.com blocking iframe (always fails)
        setLoadingState('error');
        onLoadError?.(); // Trigger refresh button flash
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onLoadError]);

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
      <div className="relative mx-4 h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-900">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black dark:bg-white">
              <svg className="h-4 w-4 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {displayName || `@${username}`}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{username}
              </p>
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
        <div className="flex h-[calc(90vh-80px)] w-full flex-col items-center justify-center space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
          {/* Twitter图标 */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500 shadow-lg">
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>

          {/* 用户信息 */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {displayName || `@${username}`}
            </h3>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              @{username}
            </p>
          </div>

          {/* Content based on loading state */}
          {loadingState === 'loading' ? (
            <div className="max-w-md text-center">
              <div className="mb-4 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Loading X content...
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Please wait while we load the profile information.
              </p>
            </div>
          ) : (
            <div className="max-w-md text-center">
              <p className="text-gray-700 dark:text-gray-300">
                Unable to load X content
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Due to security restrictions, X content cannot be displayed directly here. Click the button below to view the complete profile in a new tab.
              </p>
            </div>
          )}

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