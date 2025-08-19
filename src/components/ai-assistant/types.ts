// AI Assistant CapabilitySelector related type definitions

/**
 * 能力选择器选项类型
 */
export interface CapabilityOption {
  id: string;
  label: string;
  description: string;
  disabled: boolean;
}

/**
 * 选择器位置类型
 */
export interface SelectorPosition {
  top: number;
  left: number;
}

// CapabilitySelectorProps 已移至 CapabilitySelector.tsx 组件内部定义