import React from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface ExecutionStep {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  description: string;
  details?: string;
}

interface ExecutionStepsCardProps {
  steps: ExecutionStep[];
  title?: string;
}

const ExecutionStepsCard: React.FC<ExecutionStepsCardProps> = ({ 
  steps, 
  title = "Execution Progress" 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'running':
        return <Loader2 size={16} className="text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 max-w-md">
      {/* 标题和进度 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <span className="text-sm text-gray-500">
            {getProgressPercentage()}%
          </span>
        </div>
        
        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div 
            key={step.step}
            className={`p-3 rounded-lg border transition-all duration-200 ${
              getStatusColor(step.status)
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* 状态图标 */}
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(step.status)}
              </div>
              
              {/* 步骤内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">
                    Step {index + 1}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    step.status === 'completed' ? 'bg-green-100 text-green-700' :
                    step.status === 'running' ? 'bg-blue-100 text-blue-700' :
                    step.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {step.status === 'completed' ? 'Completed' :
                     step.status === 'running' ? 'Running' :
                     step.status === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </div>
                
                <h4 className="text-sm font-medium text-gray-800 mb-1">
                  {step.description}
                </h4>
                
                {step.details && (
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {step.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExecutionStepsCard;