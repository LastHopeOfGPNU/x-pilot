import React, { forwardRef } from 'react';
import { CapabilityOption, SelectorPosition } from './types';

/**
 * 能力选择器组件属性接口
 */
interface CapabilitySelectorProps {
  options: CapabilityOption[];
  selectedIndex: number;
  position: SelectorPosition;
  onSelect: (capability: CapabilityOption) => void;
}

/**
 * 能力选择器组件
 */
const CapabilitySelector = forwardRef<HTMLDivElement, CapabilitySelectorProps>((
  { options, selectedIndex, position, onSelect },
  ref
) => {

  return (
    <div 
      ref={ref}
      className="overflow-y-auto absolute z-50 w-80 max-h-60 bg-white rounded-lg border border-gray-200 shadow-lg"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      <div className="p-2">
        <div className="px-2 mb-2 text-xs text-gray-500">Select Capability</div>
        {options.map((option, index) => (
          <div
            key={option.id}
            className={`
              flex items-center justify-between p-2 rounded cursor-pointer transition-colors
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
            <div className="flex items-center space-x-3">
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
              <span className={`
                text-xs
                ${
                  index === selectedIndex
                    ? 'text-blue-600'
                    : option.disabled
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }
              `}>
                {option.description}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 text-xs text-gray-500 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span>↑↓ Navigate • Enter Confirm • Esc Cancel</span>
        </div>
      </div>
    </div>
  );
});

CapabilitySelector.displayName = 'CapabilitySelector';

export default CapabilitySelector;