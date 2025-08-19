import React from 'react';
import { CapabilityOption, SelectorPosition } from '../types/aiAssistant';
import { CAPABILITY_OPTIONS } from '../constants/aiAssistant';

interface CapabilitySelectorProps {
  show: boolean;
  selectedIndex: number;
  position: SelectorPosition;
  onSelect: (capability: CapabilityOption) => void;
  onClose: () => void;
}

/**
 * 能力选择器组件
 */
const CapabilitySelector: React.FC<CapabilitySelectorProps> = ({
  show,
  selectedIndex,
  position,
  onSelect,
  onClose
}) => {
  if (!show) return null;

  return (
    <div 
      className="absolute z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      <div className="p-2">
        <div className="text-xs text-gray-500 mb-2 px-2">选择能力模式</div>
        {CAPABILITY_OPTIONS.map((option, index) => (
          <div
            key={option.id}
            className={`
              flex items-center p-2 rounded cursor-pointer transition-colors
              ${
                index === selectedIndex
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50'
              }
              ${
                option.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }
            `}
            onClick={() => !option.disabled && onSelect(option)}
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className={`
                  text-sm font-medium
                  ${
                    index === selectedIndex
                      ? 'text-blue-700'
                      : option.disabled
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }
                `}>
                  {option.label}
                </span>
                {option.disabled && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    即将推出
                  </span>
                )}
              </div>
              <div className={`
                text-xs mt-1
                ${
                  index === selectedIndex
                    ? 'text-blue-600'
                    : option.disabled
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }
              `}>
                {option.description}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 p-2 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>↑↓ 选择 • Enter 确认 • Esc 取消</span>
        </div>
      </div>
    </div>
  );
};

export default CapabilitySelector;