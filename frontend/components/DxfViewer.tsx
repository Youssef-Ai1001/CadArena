'use client';

import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';

interface DxfViewerProps {
  dxfContent: string | null;
  projectTitle: string;
}

export default function DxfViewer({ dxfContent, projectTitle }: DxfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dxfContent || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to container
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();

    // Clear and set black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple DXF parsing - extract lines and circles
    const lines = dxfContent.split('\n').map(l => l.trim());
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const entities: Array<{ type: string; x1?: number; y1?: number; x2?: number; y2?: number; radius?: number }> = [];

    // Parse entities
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === 'LINE' || lines[i] === 'CIRCLE') {
        const entity: any = { type: lines[i] };
        let j = i + 1;
        while (j < lines.length && !isNaN(parseInt(lines[j]))) {
          const code = parseInt(lines[j]);
          const value = parseFloat(lines[j + 1]);
          if (!isNaN(code) && !isNaN(value)) {
            if (code === 10) entity.x1 = value;
            if (code === 20) entity.y1 = value;
            if (code === 11) entity.x2 = value;
            if (code === 21) entity.y2 = value;
            if (code === 40) entity.radius = value;
            j += 2;
          } else {
            j++;
          }
        }
        if (entity.x1 !== undefined && entity.y1 !== undefined) {
          entities.push(entity);
          minX = Math.min(minX, entity.x1 - (entity.radius || 0));
          maxX = Math.max(maxX, entity.x1 + (entity.radius || entity.x2 || 0));
          minY = Math.min(minY, entity.y1 - (entity.radius || 0));
          maxY = Math.max(maxY, entity.y1 + (entity.radius || entity.y2 || 0));
        }
      }
    }

    if (entities.length === 0) return;

    // Calculate scale and offset to fit canvas
    const padding = 40;
    const width = maxX - minX || 100;
    const height = maxY - minY || 100;
    const scale = Math.min(
      (canvas.width - padding * 2) / width,
      (canvas.height - padding * 2) / height,
      1
    );
    const offsetX = canvas.width / 2 - ((minX + maxX) / 2) * scale;
    const offsetY = canvas.height / 2 + ((minY + maxY) / 2) * scale; // Flip Y

    // Draw entities in cyan
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, -scale); // Flip Y axis

    entities.forEach(entity => {
      ctx.beginPath();
      if (entity.type === 'LINE' && entity.x1 !== undefined && entity.y1 !== undefined && entity.x2 !== undefined && entity.y2 !== undefined) {
        ctx.moveTo(entity.x1, entity.y1);
        ctx.lineTo(entity.x2, entity.y2);
        ctx.stroke();
      } else if (entity.type === 'CIRCLE' && entity.x1 !== undefined && entity.y1 !== undefined && entity.radius) {
        ctx.arc(entity.x1, entity.y1, entity.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.restore();

    // Handle resize
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [dxfContent]);

  const downloadDxf = () => {
    if (!dxfContent) return;
    const blob = new Blob([dxfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle || 'design'}.dxf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={containerRef} className="h-full w-full bg-black relative flex items-center justify-center">
      {!dxfContent && (
        <div className="text-center text-gray-400">
          <p className="text-sm">No DXF content yet</p>
          <p className="text-xs mt-2">Send a prompt to generate your CAD design</p>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full" />
      {dxfContent && (
        <button
          onClick={downloadDxf}
          className="absolute bottom-4 right-4 bg-[#00FFFF] hover:bg-[#00CCCC] text-black font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          <Download className="w-4 h-4" />
          Download DXF
        </button>
      )}
    </div>
  );
}
