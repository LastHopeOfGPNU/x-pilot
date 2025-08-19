import React, { useState } from 'react';
import { Home, Eye, MessageCircle, FileText, Lightbulb, Database, User } from 'lucide-react';

interface SidebarProps {
  onMenuItemClick?: (itemName: string) => void;
  activeMenuItem?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onMenuItemClick, 
  activeMenuItem
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleItemClick = (itemName: string, disabled: boolean) => {
    if (disabled) return;
    onMenuItemClick?.(itemName);
  };

  // 定义主要功能菜单项
  const mainMenuItems = [
    { name: 'Dashboard', icon: Home, disabled: false },
    { name: 'Inspiration Accounts', icon: Eye, disabled: false },
    { name: 'Auto Engagement', icon: MessageCircle, disabled: false },
    { name: 'Get Post/Thread', icon: FileText, disabled: true },
    { name: 'Marketing Strategy', icon: Lightbulb, disabled: true },
    { name: 'Properties', icon: Database, disabled: false },
  ];

  // 定义底部用户菜单项
  const userMenuItems = [
    { name: 'Profile', icon: User, disabled: false },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      <div className={`p-4 ${isExpanded ? 'px-6' : 'px-4'} flex-shrink-0`}>
        <div className="flex items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0 rounded-lg transition-colors hover:bg-gray-100"
            aria-label={isExpanded ? "Collapse menu" : "Expand menu"}
          >
            <img 
              src="/xpilot-logo-fill-white.jpg" 
              alt="X Pilot Logo" 
              className="object-contain w-8 h-8"
            />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 min-h-0">
        <nav className="flex-1 px-2">
          {mainMenuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleItemClick(item.name, item.disabled)}
              disabled={item.disabled}
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors mb-1 ${
                isExpanded ? 'justify-start' : 'justify-center'
              } ${
                item.disabled 
                  ? 'text-gray-400 cursor-not-allowed opacity-50'
                  : activeMenuItem === item.name 
                  ? 'bg-[#4792E6]/10 text-[#4792E6] border border-[#4792E6]/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={!isExpanded ? item.name : undefined}
            >
              <item.icon size={20} className={`${isExpanded ? "mr-3" : ""} ${
                item.disabled 
                  ? 'text-gray-400'
                  : activeMenuItem === item.name ? 'text-[#4792E6]' : ''
              }`} />
              {isExpanded && (
                <span className="font-medium">{item.name}</span>
              )}
            </button>
          ))}
        </nav>
        
        {/* 底部用户菜单 */}
        <nav className="flex-shrink-0 px-2 pb-4">
          {userMenuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleItemClick(item.name, item.disabled)}
              disabled={item.disabled}
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors mb-1 ${
                isExpanded ? 'justify-start' : 'justify-center'
              } ${
                item.disabled 
                  ? 'text-gray-400 cursor-not-allowed opacity-50'
                  : activeMenuItem === item.name 
                  ? 'bg-[#4792E6]/10 text-[#4792E6] border border-[#4792E6]/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={!isExpanded ? item.name : undefined}
            >
              <item.icon size={20} className={`${isExpanded ? "mr-3" : ""} ${
                item.disabled 
                  ? 'text-gray-400'
                  : activeMenuItem === item.name ? 'text-[#4792E6]' : ''
              }`} />
              {isExpanded && (
                <span className="font-medium">{item.name}</span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;