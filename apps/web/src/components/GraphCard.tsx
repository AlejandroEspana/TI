import { useEffect, useRef } from 'react';
import type { GraphBoardObject } from '@mathboard/shared';
import { sampleFunction, findRootsInDomain } from '@mathboard/visualization';

interface GraphCardProps {
  graph: GraphBoardObject;
}

export function GraphCard({ graph }: GraphCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const [xMin, xMax] = graph.domain;

    // Clear background (clean white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Compute Y range
    const points = sampleFunction(graph.expression, graph.domain, 200);
    let yMin = -6;
    let yMax = 6;
    if (points.length > 0) {
      const yValues = points.map((p) => p.y).filter((y) => !isNaN(y) && isFinite(y));
      if (yValues.length > 0) {
        yMin = Math.max(-30, Math.min(...yValues) - 1);
        yMax = Math.min(30, Math.max(...yValues) + 1);
      }
    }
    if (yMin >= yMax) {
      yMin = -10;
      yMax = 10;
    }

    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    // 1. Draw Cartesian Grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += 2) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += 2) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    // 2. Draw Axes (X and Y)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;

    // X axis
    const yZero = toScreenY(0);
    if (yZero >= 0 && yZero <= height) {
      ctx.beginPath();
      ctx.moveTo(0, yZero);
      ctx.lineTo(width, yZero);
      ctx.stroke();
    }

    // Y axis
    const xZero = toScreenX(0);
    if (xZero >= 0 && xZero <= width) {
      ctx.beginPath();
      ctx.moveTo(xZero, 0);
      ctx.lineTo(xZero, height);
      ctx.stroke();
    }

    // 3. Draw Function Curve
    if (points.length > 1) {
      ctx.strokeStyle = graph.color || '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;

      for (const p of points) {
        const sx = toScreenX(p.x);
        const sy = toScreenY(p.y);
        if (!started) {
          ctx.moveTo(sx, sy);
          started = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();
    }

    // 4. Draw Roots (red dots)
    const roots = graph.showRoots !== false ? findRootsInDomain(graph.expression, graph.domain) : [];
    ctx.fillStyle = '#ef4444';
    for (const r of roots) {
      const rx = toScreenX(r);
      const ry = toScreenY(0);
      if (rx >= 0 && rx <= width && ry >= 0 && ry <= height) {
        ctx.beginPath();
        ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Label root
        ctx.fillStyle = '#b91c1c';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(`(${r}, 0)`, rx - 12, ry - 7);
        ctx.fillStyle = '#ef4444';
      }
    }
  }, [graph]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden select-none w-80">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 bg-slate-50/80">
        <span className="text-xs font-semibold text-slate-700">
          f({graph.variable}) = {graph.expression}
        </span>
        <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
          [{graph.domain[0]}, {graph.domain[1]}]
        </span>
      </div>
      <canvas ref={canvasRef} width={320} height={200} className="w-full h-[200px] block" />
      <div className="px-3 py-1.5 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Raíces detectadas
        </span>
        <span className="font-mono text-indigo-600 font-semibold">2D Graph Engine</span>
      </div>
    </div>
  );
}
