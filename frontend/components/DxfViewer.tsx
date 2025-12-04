'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Download, ZoomIn, ZoomOut, RotateCw, Move } from 'lucide-react';

interface DxfViewerProps {
  dxfContent: string | null;
  projectTitle: string;
}

interface Point {
  x: number;
  y: number;
}

export default function DxfViewer({ dxfContent, projectTitle }: DxfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [bounds, setBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);

  // Parse DXF content and extract entities
  const parseDxf = useCallback((dxfString: string) => {
    const entities: any[] = [];
    const lines = dxfString.split('\n').map(line => line.trim());
    
    let inEntities = false;
    let currentEntity: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line === 'ENTITIES') {
        inEntities = true;
        continue;
      }
      
      if (line === 'ENDSEC') {
        inEntities = false;
        if (currentEntity) {
          entities.push(currentEntity);
          currentEntity = null;
        }
        continue;
      }
      
      if (!inEntities) continue;

      // Start new entity
      if (line === 'LINE' || line === 'CIRCLE' || line === 'ARC' || line === 'POLYLINE' || line === 'LWPOLYLINE') {
        if (currentEntity) {
          entities.push(currentEntity);
        }
        currentEntity = { type: line, points: [] };
        continue;
      }

      // Parse coordinates
      if (currentEntity) {
        const code = parseInt(line);
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        const value = parseFloat(nextLine);
        
        if (!isNaN(code) && !isNaN(value)) {
          if (code === 10 || code === 11) {
            // X coordinate
            if (code === 10) {
              currentEntity.x1 = value;
            } else {
              currentEntity.x2 = value;
            }
          } else if (code === 20 || code === 21) {
            // Y coordinate
            if (code === 20) {
              currentEntity.y1 = value;
            } else {
              currentEntity.y2 = value;
            }
          } else if (code === 40) {
            // Radius for CIRCLE/ARC
            currentEntity.radius = value;
          } else if (code === 50 || code === 51) {
            // Start/End angle for ARC
            if (code === 50) {
              currentEntity.startAngle = value;
            } else {
              currentEntity.endAngle = value;
            }
          }
          i++; // Skip next line as we already processed it
        }
      }
    }
    
    if (currentEntity) {
      entities.push(currentEntity);
    }
    
    return entities;
  }, []);

  // Calculate bounds of all entities
  const calculateBounds = useCallback((entities: any[]) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    entities.forEach(entity => {
      if (entity.type === 'LINE') {
        if (entity.x1 !== undefined) {
          minX = Math.min(minX, entity.x1);
          maxX = Math.max(maxX, entity.x1);
        }
        if (entity.x2 !== undefined) {
          minX = Math.min(minX, entity.x2);
          maxX = Math.max(maxX, entity.x2);
        }
        if (entity.y1 !== undefined) {
          minY = Math.min(minY, entity.y1);
          maxY = Math.max(maxY, entity.y1);
        }
        if (entity.y2 !== undefined) {
          minY = Math.min(minY, entity.y2);
          maxY = Math.max(maxY, entity.y2);
        }
      } else if (entity.type === 'CIRCLE' && entity.x1 !== undefined && entity.y1 !== undefined && entity.radius) {
        minX = Math.min(minX, entity.x1 - entity.radius);
        maxX = Math.max(maxX, entity.x1 + entity.radius);
        minY = Math.min(minY, entity.y1 - entity.radius);
        maxY = Math.max(maxY, entity.y1 + entity.radius);
      }
    });
    
    if (isFinite(minX)) {
      return { minX, maxX, minY, maxY };
    }
    return null;
  }, []);

  // Render entities on canvas
  useEffect(() => {
    if (!dxfContent || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setError(null);

    try {
      const entities = parseDxf(dxfContent);
      
      if (entities.length === 0) {
        setError('No entities found in DXF');
        return;
      }

      // Calculate bounds
      const calculatedBounds = calculateBounds(entities);
      if (calculatedBounds) {
        setBounds(calculatedBounds);
        
        // Auto-fit to canvas
        const padding = 50;
        const width = calculatedBounds.maxX - calculatedBounds.minX;
        const height = calculatedBounds.maxY - calculatedBounds.minY;
        const scaleX = (canvas.width - padding * 2) / width;
        const scaleY = (canvas.height - padding * 2) / height;
        const autoZoom = Math.min(scaleX, scaleY, 1) * 0.9;
        
        if (zoom === 1 && pan.x === 0 && pan.y === 0) {
          setZoom(autoZoom);
          const centerX = (calculatedBounds.minX + calculatedBounds.maxX) / 2;
          const centerY = (calculatedBounds.minY + calculatedBounds.maxY) / 2;
          setPan({
            x: canvas.width / 2 - centerX * autoZoom,
            y: canvas.height / 2 + centerY * autoZoom // Flip Y axis
          });
        }
      }

      // Set up drawing context
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, -zoom); // Flip Y axis for CAD coordinates
      
      ctx.strokeStyle = '#0066FF';
      ctx.lineWidth = 2 / zoom;
      ctx.fillStyle = '#0066FF';

      // Draw entities
      entities.forEach(entity => {
        ctx.beginPath();
        
        if (entity.type === 'LINE' && entity.x1 !== undefined && entity.y1 !== undefined && 
            entity.x2 !== undefined && entity.y2 !== undefined) {
          ctx.moveTo(entity.x1, entity.y1);
          ctx.lineTo(entity.x2, entity.y2);
          ctx.stroke();
        } else if (entity.type === 'CIRCLE' && entity.x1 !== undefined && entity.y1 !== undefined && entity.radius) {
          ctx.arc(entity.x1, entity.y1, entity.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (entity.type === 'ARC' && entity.x1 !== undefined && entity.y1 !== undefined && 
                   entity.radius && entity.startAngle !== undefined && entity.endAngle !== undefined) {
          const startRad = (entity.startAngle * Math.PI) / 180;
          const endRad = (entity.endAngle * Math.PI) / 180;
          ctx.arc(entity.x1, entity.y1, entity.radius, startRad, endRad);
          ctx.stroke();
        }
      });
      
      ctx.restore();
    } catch (err) {
      console.error('Error rendering DXF:', err);
      setError('Error rendering DXF content');
    }
  }, [dxfContent, zoom, pan, parseDxf, calculateBounds]);

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

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
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-[#0066FF] rounded-full"></div>
          DXF Viewer
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-sm text-slate-600 font-medium px-2">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Reset View"
          >
            <RotateCw className="w-5 h-5 text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-300 mx-2"></div>
          <button
            onClick={downloadDxf}
            disabled={!dxfContent}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download DXF
          </button>
        </div>
      </div>
      
      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden bg-slate-50 flex items-center justify-center relative"
      >
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-md">
            {error}
          </div>
        )}
        {!dxfContent && !error && (
          <div className="text-center p-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[#0066FF] to-[#7C3AED] rounded-2xl flex items-center justify-center opacity-20">
              <Move className="w-12 h-12 text-white" />
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-2">No DXF content yet</p>
            <p className="text-sm text-slate-500">Send a prompt to generate your CAD design</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className={`border-2 border-slate-200 bg-white shadow-lg rounded-lg max-w-full max-h-full ${dxfContent ? 'cursor-move' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {dxfContent && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs text-slate-600">
            <p>Click and drag to pan • Scroll to zoom</p>
          </div>
        )}
      </div>
    </div>
  );
}
