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

/**
 * 能力选择器组件属性类型
 */
export interface CapabilitySelectorProps {
  show: boolean;
  selectedIndex: number;
  position: SelectorPosition;
  onSelect: (capability: CapabilityOption) => void;
  onClose: () => void;
}