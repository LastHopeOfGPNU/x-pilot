import React, { useState } from 'react';
import { CheckCircle, Circle, Calendar, Clock, User, Target, ChevronDown, ChevronUp, Play, Pause, MoreHorizontal } from 'lucide-react';

interface PlanTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  assignee?: string;
}

interface PlanCardProps {
  title: string;
  description?: string;
  tasks: PlanTask[];
  status: 'draft' | 'active' | 'completed' | 'paused';
  createdAt?: string;
  dueDate?: string;
  onTaskToggle?: (taskId: string) => void;
  onStatusChange?: (status: string) => void;
  className?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
  title,
  description,
  tasks,
  status,
  createdAt,
  dueDate,
  onTaskToggle,
  onStatusChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      case 'paused': return <Pause size={14} />;
      default: return <Circle size={14} />;
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
                <span>Progress</span>
                <span>{completedTasks}/{totalTasks} tasks</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#4792E6] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {createdAt && (
                <div className="flex items-center space-x-1">
                  <Calendar size={12} />
                  <span>Created {createdAt}</span>
                </div>
              )}
              {dueDate && (
                <div className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>Due {dueDate}</span>
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
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      onStatusChange?.('active');
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    Start Plan
                  </button>
                  <button
                    onClick={() => {
                      onStatusChange?.('paused');
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    Pause Plan
                  </button>
                  <button
                    onClick={() => {
                      onStatusChange?.('completed');
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

      {/* Tasks List */}
      {isExpanded && (
        <div className="p-4">
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                  task.completed 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-gray-200 hover:border-[#4792E6] hover:shadow-sm'
                }`}
              >
                <button
                  onClick={() => onTaskToggle?.(task.id)}
                  className={`flex-shrink-0 mt-0.5 transition-colors ${
                    task.completed 
                      ? 'text-green-600 hover:text-green-700' 
                      : 'text-gray-400 hover:text-[#4792E6]'
                  }`}
                >
                  {task.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${
                        task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className={`text-xs mt-1 ${
                          task.completed ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  
                  {/* Task Meta */}
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                    {task.dueDate && (
                      <div className="flex items-center space-x-1">
                        <Clock size={10} />
                        <span>{task.dueDate}</span>
                      </div>
                    )}
                    {task.assignee && (
                      <div className="flex items-center space-x-1">
                        <User size={10} />
                        <span>{task.assignee}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Target size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks in this plan</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanCard;