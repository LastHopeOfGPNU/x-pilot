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
    renderAndWaitForResponse: ({ respond, args, status }) => {
      if (status === "complete") {
        return <div>
          <p>Generation Plan completed...</p>
        </div>;
      }

      const { plans } = args || {};

      return (
        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Auto Reply Plan
          </h3>

          <div className="mb-6 space-y-3">
            {plans?.map((plan, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 text-sm font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {plan}
                </p>
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <button onClick={() => respond?.(args.name)} className="flex-1 px-4 py-2 font-medium text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Execute
            </button>
            <button onClick={() => respond?.(null)} className="flex-1 px-4 py-2 font-medium text-gray-800 bg-gray-200 rounded-md transition-colors hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
              Cancel
            </button>
          </div>
        </div>
      )
    },
  });
};