import React from 'react';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { useCopilotChatHeadless_c, useCopilotAction } from '@copilotkit/react-core';

interface SimplePlanCardProps {
  steps?: string[];
  onExecute?: () => void;
  onCancel?: () => void;
}

const SimplePlanCard: React.FC<SimplePlanCardProps> = ({ steps, onExecute, onCancel }) => {
  const { renderAndWaitForResponse } = useCopilotChatHeadless_c();

  // 使用useCopilotAction来处理计划审批
  useCopilotAction({
    name: "approvePlan",
    description: "Handle plan approval or cancellation from user",
    parameters: [
      {
        name: "planSteps",
        type: "array",
        description: "Array of plan steps to be approved or cancelled",
        items: {
          type: "string"
        }
      },
      {
        name: "action",
        type: "string",
        description: "User action: 'approve' or 'cancel'"
      }
    ],
    handler: async ({ planSteps, action }) => {
      console.log('Plan approval action:', { planSteps, action });
      
      // 使用renderAndWaitForResponse来显示交互式UI并等待用户响应
      const userResponse = await renderAndWaitForResponse(
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Your Plan (renderAndWaitForResponse)</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Pending approval</span>
            </div>
          </div>
          
          <div className="mb-4 space-y-2">
            {(planSteps || steps || []).map((step: string, index: number) => (
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
              onClick={() => {
                onCancel?.();
                return { action: 'cancel', approved: false };
              }}
              className="flex flex-1 justify-center items-center px-4 py-2 space-x-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={() => {
                onExecute?.();
                return { action: 'approve', approved: true };
              }}
              className="flex flex-1 justify-center items-center px-4 py-2 space-x-2 text-sm font-medium text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Execute</span>
            </button>
          </div>
        </div>
      );
      
      console.log('User response from renderAndWaitForResponse:', userResponse);
      return userResponse;
    }
  });

  // 如果有传入的steps，显示基本的计划卡片
  if (steps && steps.length > 0) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Your Plan</h3>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Ready</span>
          </div>
        </div>
        
        <div className="mb-4 space-y-2">
          {steps.map((step: string, index: number) => (
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
            onClick={onCancel}
            className="flex flex-1 justify-center items-center px-4 py-2 space-x-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={onExecute}
            className="flex flex-1 justify-center items-center px-4 py-2 space-x-2 text-sm font-medium text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Execute</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default SimplePlanCard;