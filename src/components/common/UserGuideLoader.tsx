import React from 'react';
import { Loader2 } from 'lucide-react';

interface UserGuideLoaderProps {
  isVisible: boolean;
}

const UserGuideLoader: React.FC<UserGuideLoaderProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          正在检查用户指导状态...
        </span>
      </div>
    </div>
  );
};

export default UserGuideLoader;