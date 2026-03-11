"use client";

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Download, FileCode2 } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    const renderChart = async () => {
      if (containerRef.current) {
        try {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          setSvgContent(svg);
          containerRef.current.innerHTML = svg;
          
          // Fix SVG dimensions for flex layouts
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
          }
        } catch (error) {
          console.error('Failed to render mermaid diagram', error);
          containerRef.current.innerHTML = '<span class="text-red-500">Failed to render diagram. Syntax error.</span>';
        }
      }
    };
    renderChart();
  }, [chart]);

  const downloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'architecture_diagram.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadText = () => {
    const blob = new Blob([chart], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'architecture_diagram.mermaid';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-2 mt-4 mb-4 border border-[var(--panel-border)] rounded-xl p-4 bg-black/10 relative">
      <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
        <span className="text-sm font-medium text-purple-400">Architecture Diagram</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={downloadSvg}
            className="px-2 py-1.5 hover:bg-[var(--panel-border)] rounded-md transition-colors text-xs flex items-center gap-1.5 text-foreground/80 hover:text-foreground"
            title="Download Image"
          >
            <Download className="w-3.5 h-3.5" /> SVG Image
          </button>
          <button 
            onClick={downloadText}
            className="px-2 py-1.5 hover:bg-[var(--panel-border)] rounded-md transition-colors text-xs flex items-center gap-1.5 text-foreground/80 hover:text-foreground"
            title="Download Mermaid Text"
          >
            <FileCode2 className="w-3.5 h-3.5" /> Source Code
          </button>
        </div>
      </div>
      <div className="w-full overflow-x-auto bg-white rounded-lg p-4" ref={containerRef} />
    </div>
  );
}
