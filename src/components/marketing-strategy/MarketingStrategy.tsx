import React, { useState } from 'react';
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  FileText, 
  Lightbulb, 
  MessageCircle,
  Search 
} from 'lucide-react';
import { MarketingStrategy as MarketingStrategyType } from '../../App';

interface MarketingStrategyProps {
  onStrategyClick: (strategy: MarketingStrategyType) => void;
  selectedStrategyId?: string;
}

const MarketingStrategy: React.FC<MarketingStrategyProps> = ({
  onStrategyClick,
  selectedStrategyId
}) => {
  // 本地数据定义（已清空mock数据）
  const mockMarketingStrategies: MarketingStrategyType[] = [];

  const [strategies] = useState<MarketingStrategyType[]>(mockMarketingStrategies);
  const [searchQuery, setSearchQuery] = useState('');

  const getStrategyIcon = (type: MarketingStrategyType['type']) => {
    switch (type) {
      case 'content':
        return Calendar;
      case 'engagement':
        return Users;
      case 'operation':
        return Target;
      case 'growth':
        return TrendingUp;
      case 'analytics':
        return BarChart3;
      default:
        return Calendar;
    }
  };

  const getStrategyColor = (type: MarketingStrategyType['type']) => {
    switch (type) {
      case 'content':
        return 'bg-blue-500';
      case 'engagement':
        return 'bg-green-500';
      case 'operation':
        return 'bg-[#4792E6]';
      case 'growth':
        return 'bg-orange-500';
      case 'analytics':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: MarketingStrategyType['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'draft':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'completed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: MarketingStrategyType['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeLabel = (type: MarketingStrategyType['type']) => {
    switch (type) {
      case 'content':
        return 'Content Strategy';
      case 'engagement':
        return 'Engagement Strategy';
      case 'operation':
        return 'Operation Strategy';
      case 'growth':
        return 'Growth Strategy';
      case 'analytics':
        return 'Analytics Strategy';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: MarketingStrategyType['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'draft':
        return 'Draft';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: MarketingStrategyType['priority']) => {
    switch (priority) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return priority;
    }
  };

  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         strategy.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Marketing Strategy</h2>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search strategies..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-2">
          <Target size={20} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-600">
            {filteredStrategies.length} strategies
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-6 space-y-4">
        {filteredStrategies.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Target size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No strategies found</h3>
              <p className="text-gray-500">Try adjusting your search terms or create a new strategy.</p>
            </div>
          </div>
        ) : (
          filteredStrategies.map((strategy) => {
            const Icon = getStrategyIcon(strategy.type);
            const isSelected = selectedStrategyId === strategy.id;
            
            return (
              <div
                key={strategy.id}
                onClick={() => onStrategyClick?.(strategy)}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getStrategyColor(strategy.type)} text-white`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{strategy.title}</h3>
                      <span className="text-sm text-gray-500">{getTypeLabel(strategy.type)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(strategy.priority)}`}>
                      {getPriorityLabel(strategy.priority)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(strategy.status)}`}>
                      {getStatusLabel(strategy.status)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {strategy.description}
                </p>

                {/* Metrics */}
                {strategy.metrics && (
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {strategy.metrics.reach ? `${(strategy.metrics.reach / 1000).toFixed(0)}K` : '-'}
                      </div>
                      <div className="text-xs text-gray-500">Reach</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {strategy.metrics.engagement ? `${strategy.metrics.engagement}%` : '-'}
                      </div>
                      <div className="text-xs text-gray-500">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {strategy.metrics.conversion ? `${strategy.metrics.conversion}%` : '-'}
                      </div>
                      <div className="text-xs text-gray-500">Conversion</div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>Updated {strategy.lastUpdated}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {strategy.status === 'active' ? (
                      <CheckCircle size={12} className="text-green-500" />
                    ) : strategy.status === 'draft' ? (
                      <AlertCircle size={12} className="text-yellow-500" />
                    ) : (
                      <CheckCircle size={12} className="text-gray-400" />
                    )}
                    <span>Created {strategy.createdDate}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MarketingStrategy;