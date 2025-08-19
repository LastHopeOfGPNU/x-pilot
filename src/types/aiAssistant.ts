// AI Assistant related type definitions

// 消息类型
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  planData?: PlanData;
}

// 计划数据类型
export interface PlanData {
  id: string;
  title: string;
  description?: string;
  steps: PlanStep[];
  markdownContent?: string;
  mermaidDiagram?: string;
  status: 'generating' | 'ready' | 'confirmed' | 'executing' | 'completed';
  progress?: number;
}

// 计划步骤类型
export interface PlanStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  estimatedTime?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked';
}

// AI助手组件属性类型
export interface AIAssistantProps {
  onExpandedChange?: (expanded: boolean) => void;
}

// 后端请求结构
export interface BackendRequest {
  state: any[];
  tools: any[];
  context: any[];
  forwardedProps: Record<string, any>;
  messages: Array<{
    content: string;
    role: string;
    id: string;
  }>;
  runId: string;
  threadId: string;
}

// Agent状态类型，匹配LangGraph中的状态
export type AgentState = {
  execution_steps?: {
    step: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    description: string;
    details?: string;
  }[];
  plan_steps?: {
    title: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
};