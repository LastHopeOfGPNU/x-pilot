import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface GuideStep {
  id: string;
  title: string;
  content: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  showNext?: boolean;
  showPrev?: boolean;
  showSkip?: boolean;
}

interface GuideTourProps {
  steps: GuideStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  currentStepIndex?: number;
  onStepChange?: (stepIndex: number) => void;
}

const GuideTour: React.FC<GuideTourProps> = ({
  steps,
  isActive,
  onComplete,
  onSkip,
  currentStepIndex = 0,
  onStepChange
}) => {
  const [currentStep, setCurrentStep] = useState(currentStepIndex);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 更新当前步骤
  useEffect(() => {
    setCurrentStep(currentStepIndex);
  }, [currentStepIndex]);

  // 查找目标元素并计算位置
  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const findTargetElement = () => {
      const selector = steps[currentStep].targetSelector;
      const element = document.querySelector(selector) as HTMLElement;
      
      if (element) {
        setTargetElement(element);
        calculateTooltipPosition(element);
      } else {
        // 如果找不到元素，延迟重试
        setTimeout(findTargetElement, 100);
      }
    };

    findTargetElement();
  }, [isActive, currentStep, steps]);

  // 计算提示框位置
  const calculateTooltipPosition = (element: HTMLElement) => {
    if (!tooltipRef.current) return;

    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const position = steps[currentStep].position;
    
    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tooltipRect.height - 12;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + 12;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 12;
        break;
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 12;
        break;
    }

    // 确保提示框在视窗内
    const padding = 16;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    setTooltipPosition({ top, left });
  };

  // 高亮目标元素
  const highlightElement = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height
    };
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isActive || !steps[currentStep] || !targetElement) {
    return null;
  }

  const step = steps[currentStep];
  const highlightRect = highlightElement(targetElement);

  return (
    <>
      {/* 遮罩层 */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 z-50 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              circle at ${highlightRect.left + highlightRect.width / 2}px ${highlightRect.top + highlightRect.height / 2}px,
              transparent ${Math.max(highlightRect.width, highlightRect.height) / 2 + 8}px,
              rgba(0, 0, 0, 0.5) ${Math.max(highlightRect.width, highlightRect.height) / 2 + 12}px
            )
          `
        }}
      />
      
      {/* 高亮边框 */}
      <div
        className="fixed z-50 pointer-events-none border-2 border-blue-500 rounded-lg shadow-lg"
        style={{
          top: highlightRect.top - 4,
          left: highlightRect.left - 4,
          width: highlightRect.width + 8,
          height: highlightRect.height + 8,
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)'
        }}
      />
      
      {/* 引导提示框 */}
      <div
        ref={tooltipRef}
        className="fixed z-50 max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left
        }}
      >
        {/* 箭头 */}
        <div
          className={`absolute w-3 h-3 bg-white border transform rotate-45 ${
            step.position === 'top' ? 'bottom-[-6px] border-b border-r border-gray-200' :
            step.position === 'bottom' ? 'top-[-6px] border-t border-l border-gray-200' :
            step.position === 'left' ? 'right-[-6px] border-r border-b border-gray-200' :
            'left-[-6px] border-l border-t border-gray-200'
          }`}
          style={{
            left: step.position === 'left' || step.position === 'right' ? undefined : '50%',
            top: step.position === 'top' || step.position === 'bottom' ? undefined : '50%',
            marginLeft: step.position === 'left' || step.position === 'right' ? undefined : '-6px',
            marginTop: step.position === 'top' || step.position === 'bottom' ? undefined : '-6px'
          }}
        />
        
        {/* 内容 */}
        <div className="p-6">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-500">
                  步骤 {currentStep + 1} / {steps.length}
                </p>
              </div>
            </div>
            {step.showSkip !== false && (
              <button
                onClick={handleSkip}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="跳过引导"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* 内容 */}
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">{step.content}</p>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {/* 步骤指示器 */}
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-600' :
                    index < currentStep ? 'bg-blue-300' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex space-x-3">
              {step.showPrev !== false && currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  上一步
                </button>
              )}
              
              {step.showNext !== false && (
                <button
                  onClick={handleNext}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {currentStep === steps.length - 1 ? '完成' : '下一步'}
                  {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-1" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuideTour;
export type { GuideStep };