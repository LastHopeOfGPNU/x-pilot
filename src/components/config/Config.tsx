import React, { useState, useEffect } from 'react';
import { Settings, MessageSquare, Repeat2, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { configService, ConfigItem as ApiConfigItem } from '../../lib/configService';
import { logger } from '../../utils/logger';

interface ConfigProps {
  onItemClick?: (item: ConfigItem) => void;
  selectedItemId?: string;
}

type TabType = 'reply' | 'repost';

// 适配前端使用的配置项接口
export interface ConfigItem {
  id: string;
  type: 'reply' | 'repost';
  title: string;
  content: string;
  time: string;
  prompt: string;
  style: string;
  enabled: boolean;
}

const Config: React.FC<ConfigProps> = ({ onItemClick, selectedItemId }) => {
  const [activeTab, setActiveTab] = useState<'reply' | 'repost'>('reply');
  const [configItems, setConfigItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 将API配置项转换为前端使用的格式
  const transformApiConfigItem = (apiItem: ApiConfigItem): ConfigItem => {
    return {
      id: apiItem.id,
      type: apiItem.type,
      title: apiItem.name,
      content: apiItem.description,
      time: new Date(apiItem.updated_at).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      prompt: apiItem.prompt_content,
      style: apiItem.reply_style,
      enabled: apiItem.is_enabled
    };
  };

  // 获取配置列表
  const fetchConfigItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await configService.getConfigs({
        type: activeTab,
        page_size: 100 // 获取所有配置项
      });
      
      const transformedItems = response.data.map(transformApiConfigItem);
      setConfigItems(transformedItems);
    } catch (error) {
      logger.error('Failed to fetch config items:', error);
      setError(error instanceof Error ? error.message : 'Failed to get configuration list');
    } finally {
      setLoading(false);
    }
  };

  // 当组件挂载或activeTab改变时获取数据
  useEffect(() => {
    fetchConfigItems();
  }, [activeTab]);

  // Filter items based on active tab
  const filteredItems = configItems.filter(item => {
    return item.type === activeTab;
  });

  // Toggle enabled status
  const handleToggleEnabled = async (id: string, enabled: boolean, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    
    // 乐观更新UI
    setConfigItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, enabled } : item
      )
    );

    // TODO: Add API call here to update server-side state
    // try {
    //   await configService.updateConfig(id, { is_enabled: enabled });
    // } catch (error) {
    //   // If update fails, rollback UI state
    //   setConfigItems(prev => 
    //     prev.map(item => 
    //       item.id === id ? { ...item, enabled: !enabled } : item
    //     )
    //   );
    //   logger.error('Failed to update configuration state:', error);
    // }
  };

  // 格式化回复风格显示
  const formatReplyStyle = (style: string): string => {
    const styleMap: { [key: string]: string } = {
      'casual': 'Casual',
      'professional': 'Professional',
      'friendly': 'Friendly',
      'formal': 'Formal',
      'humorous': 'Humorous'
    };
    return styleMap[style] || style;
  };

  // 处理配置项点击事件
  const handleItemClick = (item: ConfigItem) => {
    // 直接使用列表中的数据，提高响应速度
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 p-6 bg-white border-b border-gray-200">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Properties</h2>
        
        {/* Tab Navigation - Only Reply and Repost */}
        <div className="flex p-1 mb-4 space-x-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('reply')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reply'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare size={16} />
            <span>Reply</span>
          </button>
          <button
            onClick={() => setActiveTab('repost')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'repost'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Repeat2 size={16} />
            <span>Repost</span>
          </button>
        </div>

        {/* Items Count */}
        <div className="flex items-center space-x-2">
          <Settings size={20} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-600">
            {filteredItems.length} properties
          </span>
          {loading && (
            <div className="w-4 h-4 rounded-full border-b-2 border-blue-500 animate-spin"></div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="overflow-y-auto flex-1 p-6 space-y-4 bg-gray-50">
        {error ? (
          <div className="py-8 text-center">
            <div className="mb-4 text-red-500">
              <Settings size={48} className="mx-auto mb-2" />
              <p className="text-lg font-medium">Loading Failed</p>
            </div>
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              onClick={fetchConfigItems}
              className="px-4 py-2 text-white bg-blue-500 rounded-lg transition-colors hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 && !loading ? (
          <div className="py-8 text-center">
            <Settings size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No property items</p>
          </div>
        ) : (
          filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedItemId === item.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200 border-l-4 border-l-blue-500'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {/* Reply Style Label and Toggle Switch - Top row */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">Reply Style:</span>
                    <span className="px-2 py-1 text-sm font-semibold text-blue-600 bg-blue-50 rounded-md">
                      {formatReplyStyle(item.style)}
                    </span>
                  </div>
                  <div className="relative group">
                    <label className="inline-flex relative items-center opacity-50 cursor-not-allowed" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        disabled={true}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-400"></div>
                    </label>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 z-10 px-2 py-1 mb-2 text-xs text-white whitespace-nowrap bg-gray-800 rounded opacity-0 transition-opacity duration-200 transform -translate-x-1/2 pointer-events-none group-hover:opacity-100">
                      Coming soon!
                      <div className="absolute top-full left-1/2 w-0 h-0 border-t-4 border-r-4 border-l-4 border-transparent transform -translate-x-1/2 border-t-gray-800"></div>
                    </div>
                  </div>
                </div>

                {/* Title - New line */}
                <div className="mb-3">
                  <h3 className="text-base font-semibold leading-tight text-gray-900">
                    {item.title}
                  </h3>
                </div>

                {/* Icon and Content */}
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    item.type === 'reply' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'bg-green-50 text-green-600'
                  }`}>
                    {item.type === 'reply' ? (
                      <MessageSquare size={20} />
                    ) : (
                      <Repeat2 size={20} />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                      {item.content}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Config;