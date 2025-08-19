import React, { useEffect, useRef } from 'react';

interface MermaidProps {
  chart: string;
  className?: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart, className = '' }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMermaid = async () => {
      if (!elementRef.current) return;

      try {
        // 动态导入 mermaid
        const mermaid = await import('mermaid');
        
        // 初始化 mermaid
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
          fontSize: 14,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          sequence: {
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
            mirrorActors: true,
            bottomMarginAdj: 1,
            useMaxWidth: true,
            rightAngles: false,
            showSequenceNumbers: false
          },
          gantt: {
            titleTopMargin: 25,
            barHeight: 20,
            fontFamily: 'inherit',
            fontSize: 11,
            fontWeight: 'normal',
            gridLineStartPadding: 35,
            bottomPadding: 25,
            leftPadding: 75,
            topPadding: 50,
            rightPadding: 25
          }
        });

        // 清空容器
        elementRef.current.innerHTML = '';
        
        // 生成唯一ID
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // 渲染图表
        const { svg } = await mermaid.default.render(id, chart);
        elementRef.current.innerHTML = svg;
        
        // 添加样式
        const svgElement = elementRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = '100%';
          svgElement.style.height = 'auto';
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (elementRef.current) {
          elementRef.current.innerHTML = `
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p class="text-red-600 text-sm">流程图渲染失败</p>
              <p class="text-red-500 text-xs mt-1">请检查图表语法是否正确</p>
            </div>
          `;
        }
      }
    };

    renderMermaid();
  }, [chart]);

  return (
    <div 
      ref={elementRef} 
      className={`mermaid-container ${className}`}
      style={{ 
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="text-gray-500 text-sm">加载中...</div>
    </div>
  );
};

export default Mermaid;