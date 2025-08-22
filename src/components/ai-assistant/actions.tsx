import { useCopilotAction } from '@copilotkit/react-core';
import { MessageSquare, CheckCircle, XCircle, List, Play, X } from 'lucide-react';

// 自定义hook来定义CopilotKit Actions
export const useAIAssistantActions = () => {
  // 更新计划状态的Action
  useCopilotAction({
    name: "replyPlan",
    available: "remote",
    description: "每次用户请求使用reply_tool工具回复指令时，首先使用这个工具生成计划，根据用户指令和当前状态生成计划列表，计划使用的语言要和用户输入语言保持一致。后续reply_tool工具的调用需要等用户确认使用计划后再调用。",
    parameters: [
      {
        name: "plans",
        type: "string[]",
        description: "生成的计划列表，计划项目至少有三个，计划使用的语言要和用户输入语言保持一致",
        required: true
      },
    ],
    renderAndWaitForResponse: ({ status, args, respond }) => {
      // 根据CopilotKit文档，renderAndWaitForResponse的status有三个状态：'inProgress'、'executing'、'complete'
      console.log('render', status, args)
      const getStatusDisplay = (currentStatus: string) => {
        switch (currentStatus) {
          case "inProgress":
            return {
              icon: <MessageSquare className="w-5 h-5 text-blue-600 animate-pulse" />,
              text: "Generating Plan",
              color: "text-blue-800",
              bgColor: "from-blue-50 to-indigo-50",
              borderColor: "border-blue-200"
            };
          case "executing":
            return {
              icon: <MessageSquare className="w-5 h-5 text-orange-600" />,
              text: "Awaiting Confirmation",
              color: "text-orange-800",
              bgColor: "from-orange-50 to-amber-50",
              borderColor: "border-orange-200"
            };
          case "complete":
            return {
              icon: <CheckCircle className="w-5 h-5 text-green-600" />,
              text: "Plan Generated, Execution Started",
              color: "text-green-800",
              bgColor: "from-green-50 to-emerald-50",
              borderColor: "border-green-200"
            };
          default:
            return {
              icon: <MessageSquare className="w-5 h-5 text-gray-600" />,
              text: "Ready",
              color: "text-gray-800",
              bgColor: "from-gray-50 to-slate-50",
              borderColor: "border-gray-200"
            };
        }
      };

      const statusDisplay = getStatusDisplay(status);
      // executing状态是等待用户确认的时机，complete状态是执行完成
      const showButtons = status === "executing";
      const isCompleted = status === "complete";

      if (status === "complete") {
        return (
          <div className={`bg-gradient-to-r ${statusDisplay.bgColor} border ${statusDisplay.borderColor} rounded-lg p-4 mb-4`}>
            <div className="flex gap-2 items-center mb-2">
              {statusDisplay.icon}
              <span className={`font-medium ${statusDisplay.color}`}>{statusDisplay.text}</span>
            </div>
            <p className="text-sm text-green-700">Auto Reply Plan has been generated and execution has started.</p>
          </div>
        );
      }

      return (
        <div className={`bg-gradient-to-r ${statusDisplay.bgColor} border ${statusDisplay.borderColor} rounded-lg p-6 mb-4`}>
          <div className="flex gap-3 items-center mb-4">
            {statusDisplay.icon}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">Auto Reply Plan</h3>
              <p className={`text-sm ${statusDisplay.color} mt-1`}>Status: {statusDisplay.text}</p>
            </div>
          </div>

          {args.plans && args.plans.length > 0 && (
            <div className="mb-6">
              <h4 className="flex gap-2 items-center mb-3 text-sm font-medium text-blue-800">
                <List className="w-4 h-4" />
                {isCompleted ? "Executed Plans" : "Generated Plans"} ({args.plans.length})
              </h4>
              <div className="space-y-3">
                {args.plans.map((plan: any, index: number) => (
                  <div
                    key={index}
                    className={`bg-white/70 backdrop-blur-sm border rounded-lg p-4 transition-all duration-200 ${isCompleted
                        ? "border-green-100 bg-green-50/30"
                        : "border-blue-100 hover:shadow-md hover:border-blue-200"
                      }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${isCompleted
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                        }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed text-gray-800">{plan}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 在executing状态下显示确认按钮 */}
          {showButtons && (
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
              <button
                onClick={() => respond("EXECUTE")}
                className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
              >
                <Play className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Execute Plan</span>
              </button>
              <button
                onClick={() => respond("CANCEL")}
                className="w-full sm:w-auto sm:px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
              >
                <X className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Cancel</span>
              </button>
            </div>
          )}

          {/* 显示当前状态信息 */}
          {status === "inProgress" && (
            <div className="p-3 rounded-lg border border-blue-100 bg-white/50">
              <div className="flex gap-2 items-center text-sm text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Generating plan...
              </div>
            </div>
          )}
          
          {isCompleted && (
            <div className="p-3 rounded-lg border border-green-100 bg-white/50">
              <div className="flex gap-2 items-center text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                Plan generated, execution started
              </div>
            </div>
          )}
        </div>
      );
    },
  });
};