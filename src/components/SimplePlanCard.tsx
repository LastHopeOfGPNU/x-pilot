import React from 'react';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { useLangGraphInterrupt } from '@copilotkit/react-core';

interface SimplePlanCardProps {
  steps?: string[];
  onExecute?: () => void;
  onCancel?: () => void;
}

const SimplePlanCard: React.FC<SimplePlanCardProps> = ({ steps, onExecute, onCancel }) => {
  const { interruptResult, isInterrupted } = useLangGraphInterrupt({
    enabled: (event) => {
      console.log('SimplePlanCard interrupt event:', event);
      return event?.type === 'check_steps';
    },
    render: ({ event, resolve }) => {
      console.log('SimplePlanCard rendering interrupt:', event);
      
      const planSteps = event?.content || [];
      
      return (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Your Plan (CopilotKit Interrupt)</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Pending approval</span>
            </div>
          </div>
          
          <div className="mb-4 space-y-2">
            {planSteps.map((step: string, index: number) => (
              <div key={index} className="flex items-start p-2 space-x-3 bg-gray-50 rounded">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  {index + 1}
                </div>
                <p className="flex-1 text-sm text-gray-700">{step}</p>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => resolve({ code: 'CANCEL' })}
              className="flex flex-1 justify-center items-center px-4 py-2 space-x-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={() => resolve({ code: 'APPROVE' })}
              className="flex flex-1 justify-center items-center px-4 py-2 space-x-2 text-sm font-medium text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Execute</span>
            </button>
          </div>
        </div>
      );
    }
  });

  // 如果有interrupt正在进行，优先显示interrupt的渲染
  if (isInterrupted && interruptResult) {
    return interruptResult;
  }

  return null;
};

export default SimplePlanCard;