import { useCopilotAction } from '@copilotkit/react-core';

// 自定义hook来定义CopilotKit Actions
export const useAIAssistantActions = () => {
  // 更新计划状态的Action
  useCopilotAction({
    name: "generationPlan",
    description: "每次用户请求回复指令时，首先使用这个工具生成计划，根据用户指令和当前状态生成计划列表，计划使用的语言要和用户输入语言保持一致。后续工具的调用需要等用户确认使用计划后再调用。",
    parameters: [
      {
        name: "plans",
        type: "string[]",
        description: "生成的计划列表，计划项目至少有三个，计划使用的语言要和用户输入语言保持一致",
        required: true
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