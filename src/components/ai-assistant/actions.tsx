import { useCopilotAction, useCopilotReadable, useCoAgentStateRender } from '@copilotkit/react-core';
import PlanCard from '../common/PlanCard';
import ExecutionStepsCard from '../common/ExecutionStepsCard';

// 定义Agent状态类型
export interface AgentState {
  plan_steps?: Array<{
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
  }>;
  execution_steps?: Array<{
    id: string;
    step: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    result?: string;
  }>;
}

// AI Assistant Actions Hook
export const useAIAssistantActions = ({
  currentConversation,
  selectedCapability,
  setSelectedCapability,
  onPlanGenerated,
  onPlanStatusUpdated
}: {
  currentConversation: any;
  selectedCapability: string | null;
  setSelectedCapability: (capability: string | null) => void;
  onPlanGenerated?: (plan: any) => void;
  onPlanStatusUpdated?: (planId: string, status: string) => void;
}) => {
  // 提供当前对话上下文给AI
  useCopilotReadable({
    description: "当前对话的上下文信息",
    value: {
      conversation: currentConversation,
      selectedCapability: selectedCapability
    }
  });

  // 生成计划的Action
  useCopilotAction({
    name: "generatePlan",
    description: "生成一个详细的执行计划",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "计划的标题",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "计划的描述",
        required: true
      },
      {
        name: "steps",
        type: "object[]",
        description: "计划的步骤列表",
        required: true
      }
    ],
    handler: async ({ title, description, steps }) => {
      console.log("title, description, steps",title, description, steps)
      const plan = {
        id: Date.now().toString(),
        title,
        description,
        steps: steps.map((step: any, index: number) => ({
          id: `step-${index}`,
          title: step.title || `步骤 ${index + 1}`,
          description: step.description || step.content || step,
          status: 'pending' as const
        }))
      };
      
      onPlanGenerated?.(plan);
      return `已生成计划: ${title}`;
    },
    render: ({ result, args, status }) => {
      console.log("result,args,status",result,args,status)
      return (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex gap-2 items-center mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">计划生成</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>标题:</strong> {args.title}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>描述:</strong> {args.description}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>步骤数量:</strong> {args.steps?.length || 0}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>状态:</strong> {status}
            </p>
            {result && (
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {result}
              </p>
            )}
          </div>
        </div>
      );
    }
  });

  // 更新计划状态的Action
  useCopilotAction({
    name: "updatePlanStatus",
    description: "更新计划或步骤的执行状态",
    parameters: [
      {
        name: "planId",
        type: "string",
        description: "计划ID",
        required: true
      },
      {
        name: "status",
        type: "string",
        description: "新的状态 (pending, in_progress, completed, failed)",
        required: true
      },
      {
        name: "stepId",
        type: "string",
        description: "步骤ID (可选，如果要更新特定步骤)",
        required: false
      }
    ],
    handler: async ({ planId, status, stepId }) => {
      onPlanStatusUpdated?.(planId, status);
      return `已更新${stepId ? '步骤' : '计划'}状态为: ${status}`;
    },
    render: ({ result, args, status: actionStatus }) => {
      const getStatusColor = (status: string) => {
        switch (status) {
          case 'completed': return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
          case 'in_progress': return 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
          case 'failed': return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
          default: return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
        }
      };
      
      return (
        <div className={`rounded-lg border p-4 ${getStatusColor(args.status)}`}>
          <div className="flex gap-2 items-center mb-3">
            <div className={`w-2 h-2 rounded-full ${
              args.status === 'completed' ? 'bg-green-500' :
              args.status === 'in_progress' ? 'bg-yellow-500' :
              args.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
            <h3 className="font-semibold">状态更新</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>目标:</strong> {args.stepId ? `步骤 ${args.stepId}` : `计划 ${args.planId}`}
            </p>
            <p className="text-sm">
              <strong>新状态:</strong> {args.status}
            </p>
            <p className="text-sm">
              <strong>执行状态:</strong> {actionStatus}
            </p>
            {result && (
              <p className="text-sm font-medium">
                {result}
              </p>
            )}
          </div>
        </div>
      );
    }
  });

  // 设置选中能力的Action
  useCopilotAction({
    name: "setSelectedCapability",
    description: "设置当前对话的能力类型",
    parameters: [
      {
        name: "capability",
        type: "string",
        description: "能力类型",
        required: true
      }
    ],
    handler: async ({ capability }) => {
      setSelectedCapability(capability);
      return `已设置对话能力为: ${capability}`;
    },
    render: ({ result, args, status }) => {
      return (
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 dark:border-purple-800 dark:bg-purple-900/20">
          <div className="flex gap-2 items-center mb-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <h3 className="font-semibold text-purple-800 dark:text-purple-200">能力设置</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>选择的能力:</strong> {args.capability}
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>状态:</strong> {status}
            </p>
            {result && (
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                {result}
              </p>
            )}
          </div>
        </div>
      );
    }
  });

  // Agent状态渲染
  const agentStateRender = useCoAgentStateRender<AgentState>({
    name: "AIAssistant",
    render: ({ state }) => {
      return (
        <div className="space-y-4">
          {state.plan_steps && (
            <PlanCard
              title="AI生成的计划"
              tasks={state.plan_steps.map(step => ({
                id: step.id,
                title: step.title,
                description: step.description,
                completed: step.status === 'completed',
                priority: 'medium' as const
              }))}
              status={state.plan_steps.some(s => s.status === 'in_progress') ? 'active' : 'draft'}
              onTaskToggle={(taskId) => {
                // 处理步骤更新
                console.log('Step updated:', taskId);
              }}
            />
          )}
          {state.execution_steps && (
            <ExecutionStepsCard
              title="执行步骤"
              steps={state.execution_steps.map(step => ({
                step: step.step,
                status: step.status === 'in_progress' ? 'running' : step.status,
                description: step.result || '执行中...',
                details: step.result
              }))}
            />
          )}
        </div>
      );
    }
  });

  return {
    agentStateRender
  };
};

// 导出常用的Action类型定义
export interface PlanStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface ExecutionStep {
  id: string;
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  steps: PlanStep[];
}