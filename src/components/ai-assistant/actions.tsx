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
        <div className="p-6 mx-auto max-w-2xl bg-white rounded-xl border border-gray-100 shadow-lg">
          {/* 标题区域 */}
          <div className="mb-6">
            <h2 className="flex items-center mb-2 text-xl font-bold text-gray-800">
              <div className="w-3 h-3 bg-[#4792E6] rounded-full mr-3 animate-pulse"></div>
              Auto Reply Plan
            </h2>
            <div className="h-0.5 bg-gradient-to-r from-[#4792E6] to-transparent rounded-full"></div>
          </div>
          
          {/* 计划步骤列表 */}
          <div className="mb-8 space-y-4">
            {plans?.map((plan, index) => (
              <div key={index} className="relative group">
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-[#4792E6]/5 to-transparent rounded-xl border border-[#4792E6]/10 hover:border-[#4792E6]/20 transition-all duration-200 hover:shadow-md">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#4792E6] text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1 leading-relaxed text-gray-700">
                    <p className="text-sm font-medium">
                      {plan}
                    </p>
                  </div>
                </div>
                {/* 连接线 */}
                {index < plans.length - 1 && (
                  <div className="absolute left-7 top-12 w-0.5 h-4 bg-gradient-to-b from-[#4792E6]/30 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* 操作按钮区域 - 响应式布局 */}
          <div className="flex flex-col gap-3 justify-center items-center sm:flex-row sm:gap-4">
            <button onClick={() => respond?.(args.name)} className="w-full sm:w-auto px-8 py-3 bg-[#4792E6] text-white rounded-xl hover:bg-[#4792E6]/90 active:bg-[#4792E6]/80 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Execute</span>
            </button>
            <button onClick={() => respond?.(null)} className="flex justify-center items-center px-8 py-3 space-x-2 w-full font-semibold text-gray-700 bg-gray-100 rounded-xl border border-gray-200 transition-all duration-200 sm:w-auto hover:bg-gray-200 active:bg-gray-300 hover:border-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )
    },
  });
};