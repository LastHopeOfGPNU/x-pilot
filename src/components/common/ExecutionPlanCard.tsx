import React, { useState } from 'react';
import { Play, Pause, CheckCircle, Clock, Calendar, User, AlertCircle, TrendingUp, BarChart3, Target, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';

interface ExecutionStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  startDate?: string;
  endDate?: string;
  assignee?: string;
  dependencies?: string[];
  metrics?: {
    target?: number;
    current?: number;
    unit?: string;
  };
}

interface ExecutionPlanCardProps {
  title: string;
  description?: string;
  steps: ExecutionStep[];
  status: 'draft' | 'active' | 'completed' | 'paused' | 'failed';
  startDate?: string;
  endDate?: string;
  progress?: number;
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
  };
  onStepStatusChange?: (stepId: string, status: string) => void;
  onPlanStatusChange?: (status: string) => void;
  className?: string;
}

const ExecutionPlanCard: React.FC<ExecutionPlanCardProps> = ({
  title,
  description,
  steps,
  status,
  startDate,
  endDate,
  progress = 0,
  metrics,
  onStepStatusChange,
  onPlanStatusChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'blocked': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-600" />;
      case 'in-progress': return <Play size={16} className="text-blue-600" />;
      case 'blocked': return <AlertCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      case 'paused': return <Pause size={14} />;
      case 'failed': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
                <span className="capitalize">{status}</span>
              </span>
            </div>
            {description && (
              <p className="text-sm text-gray-600 mb-3">{description}</p>
            )}
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Execution Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#4792E6] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Metrics */}
            {metrics && (
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{metrics.totalTasks}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{metrics.completedTasks}</div>
                  <div className="text-xs text-gray-500">Done</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{metrics.inProgressTasks}</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{metrics.blockedTasks}</div>
                  <div className="text-xs text-gray-500">Blocked</div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {startDate && (
                <div className="flex items-center space-x-1">
                  <Calendar size={12} />
                  <span>Start {startDate}</span>
                </div>
              )}
              {endDate && (
                <div className="flex items-center space-x-1">
                  <Target size={12} />
                  <span>End {endDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                title="More options"
              >
                <MoreHorizontal size={16} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]">
                  <button
                    onClick={() => {
                      onPlanStatusChange?.('active');
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    Start Execution
                  </button>
                  <button
                    onClick={() => {
                      onPlanStatusChange?.('paused');
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    Pause Execution
                  </button>
                  <button
                    onClick={() => {
                      onPlanStatusChange?.('completed');
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    Mark Complete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Execution Steps */}
      {isExpanded && (
        <div className="p-4">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="relative"
              >
                {/* Timeline Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                )}
                
                <div className={`flex items-start space-x-4 p-4 rounded-lg border transition-all duration-200 ${
                  step.status === 'completed' 
                    ? 'bg-green-50 border-green-200' 
                    : step.status === 'in-progress'
                    ? 'bg-blue-50 border-blue-200 hover:shadow-sm'
                    : step.status === 'blocked'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  {/* Step Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStepStatusIcon(step.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {step.title}
                        </h4>
                        {step.description && (
                          <p className="text-xs text-gray-600 mb-2">
                            {step.description}
                          </p>
                        )}
                        
                        {/* Step Meta */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {step.startDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar size={10} />
                              <span>{step.startDate}</span>
                            </div>
                          )}
                          {step.assignee && (
                            <div className="flex items-center space-x-1">
                              <User size={10} />
                              <span>{step.assignee}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Metrics */}
                        {step.metrics && (
                          <div className="mt-2 flex items-center space-x-2">
                            <BarChart3 size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {step.metrics.current || 0} / {step.metrics.target} {step.metrics.unit}
                            </span>
                            {step.metrics.target && step.metrics.current && (
                              <div className="flex-1 max-w-[100px]">
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div 
                                    className="bg-[#4792E6] h-1 rounded-full"
                                    style={{ width: `${Math.min((step.metrics.current / step.metrics.target) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStepStatusColor(step.status)}`}>
                          {step.status.replace('-', ' ')}
                        </span>
                        
                        {/* Status Change Buttons */}
                        <div className="flex items-center space-x-1">
                          {step.status === 'pending' && (
                            <button
                              onClick={() => onStepStatusChange?.(step.id, 'in-progress')}
                              className="p-1 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
                              title="Start step"
                            >
                              <Play size={12} />
                            </button>
                          )}
                          {step.status === 'in-progress' && (
                            <>
                              <button
                                onClick={() => onStepStatusChange?.(step.id, 'completed')}
                                className="p-1 rounded-md hover:bg-green-100 text-green-600 transition-colors"
                                title="Complete step"
                              >
                                <CheckCircle size={12} />
                              </button>
                              <button
                                onClick={() => onStepStatusChange?.(step.id, 'blocked')}
                                className="p-1 rounded-md hover:bg-red-100 text-red-600 transition-colors"
                                title="Block step"
                              >
                                <AlertCircle size={12} />
                              </button>
                            </>
                          )}
                          {step.status === 'blocked' && (
                            <button
                              onClick={() => onStepStatusChange?.(step.id, 'in-progress')}
                              className="p-1 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
                              title="Unblock step"
                            >
                              <Play size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {steps.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No execution steps defined</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutionPlanCard;