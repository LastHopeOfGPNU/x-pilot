import React from 'react';
import { CapabilityOption, SelectorPosition, CapabilitySelectorProps } from './types';
import { CAPABILITY_OPTIONS } from '../../constants/aiAssistant';

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
      className="overflow-y-auto absolute z-50 w-80 max-h-60 bg-white rounded-lg border border-gray-200 shadow-lg"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      <div className="p-2">
        <div className="px-2 mb-2 text-xs text-gray-500">选择能力模式</div>
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
      <div className="p-2 text-xs text-gray-500 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span>↑↓ 选择 • Enter 确认 • Esc 取消</span>
        </div>
      </div>
    </div>
  );
};

export default CapabilitySelector;