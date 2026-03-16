"use client";

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Download, FileCode2, Image } from 'lucide-react';

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Detect dark mode for mermaid theme
    const isDark = document.documentElement.classList.contains('dark');
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
    });

    const renderChart = async () => {
      if (!containerRef.current) return;
      setError(false);
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvgContent(svg);
        containerRef.current.innerHTML = svg;
        const svgEl = containerRef.current.querySelector('svg');
        if (svgEl) {
          svgEl.style.maxWidth = '100%';
          svgEl.style.height = 'auto';
          svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
      } catch (err) {
        console.error('Failed to render mermaid diagram', err);
        setError(true);
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
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
    link.download = 'diagram.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPng = async () => {
    if (!svgContent) return;
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // 2x for retina
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'diagram.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };
    img.src = svgUrl;
  };

  const downloadSource = () => {
    const blob = new Blob([chart], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.mermaid';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-2 mt-4 mb-4 border border-[var(--panel-border)] rounded-xl bg-black/10 relative overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-[var(--panel-border)] bg-[var(--panel)]">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Diagram</span>
        <div className="flex items-center gap-1">
          <button
            onClick={downloadSvg}
            className="px-2 py-1 hover:bg-white/10 rounded text-xs flex items-center gap-1 text-foreground/70 hover:text-foreground transition-colors"
            title="Download SVG"
          >
            <Download className="w-3 h-3" /> SVG
          </button>
          <button
            onClick={downloadPng}
            className="px-2 py-1 hover:bg-white/10 rounded text-xs flex items-center gap-1 text-foreground/70 hover:text-foreground transition-colors"
            title="Download PNG"
          >
            <Image className="w-3 h-3" /> PNG
          </button>
          <button
            onClick={downloadSource}
            className="px-2 py-1 hover:bg-white/10 rounded text-xs flex items-center gap-1 text-foreground/70 hover:text-foreground transition-colors"
            title="Download Mermaid Source"
          >
            <FileCode2 className="w-3 h-3" /> .mermaid
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 text-red-400 text-xs font-mono bg-red-950/30 border-b border-red-500/20">
          ⚠ Diagram syntax error — could not render. Raw source:
          <pre className="mt-1 whitespace-pre-wrap text-red-300/80 text-xs">{chart}</pre>
        </div>
      )}

      <div className="w-full overflow-x-auto bg-white rounded-b-xl p-4 min-h-[120px]" ref={containerRef} />
    </div>
  );
}
