import { useCopilotAction } from '@copilotkit/react-core';

// 自定义hook来定义CopilotKit Actions
export const useAIAssistantActions = () => {
  // 更新计划状态的Action
  useCopilotAction({
    name: "generationPlan",
    description: "根据用户指令生成计划",
    parameters: [
      {
        name: "type",
        type: "string",
        description: "计划类型 (e.g., 'check_auto_reply_steps')",
        required: true
      },
      {
        name: "content",
        type: "object",
        description: "计划内容",
        required: false
      },
    ],
    handler: async (...rest) => {
      console.log(rest)
      return `从后端收到：${rest}`;
    },
    render: (...rest) => {
      console.log(rest)
      return (
        <div>render:{rest}</div>
      )
    },
  });
};