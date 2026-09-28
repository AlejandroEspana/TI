import { useEffect, useRef } from 'react';
import type { GeometryBoardObject } from '@mathboard/shared';
import { Vector2D, GeometryMath } from '@mathboard/geometry-core';

interface GeometryCardProps {
  geo: GeometryBoardObject;
}

export function GeometryCard({ geo }: GeometryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (geo.figureType === 'vector' && geo.points.length >= 2) {
      const p1 = geo.points[0];
      const p2 = geo.points[1];
      const v = Vector2D.fromPoints(p1, p2);

      // Draw vector line
      ctx.strokeStyle = geo.color || '#7c3aed';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Draw arrow head
      const angle = v.angle;
      const headLen = 12;
      ctx.fillStyle = geo.color || '#7c3aed';
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(
        p2.x - headLen * Math.cos(angle - Math.PI / 6),
        p2.y - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        p2.x - headLen * Math.cos(angle + Math.PI / 6),
        p2.y - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      // Draw start point
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (geo.figureType === 'polygon' && geo.points.length >= 3) {
      // Draw polygon
      ctx.strokeStyle = geo.color || '#2563eb';
      ctx.fillStyle = (geo.color || '#2563eb') + '15'; // low opacity fill
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(geo.points[0].x, geo.points[0].y);
      for (let i = 1; i < geo.points.length; i++) {
        ctx.lineTo(geo.points[i].x, geo.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw vertices
      ctx.fillStyle = geo.color || '#2563eb';
      for (const pt of geo.points) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [geo]);

  let metricsStr = '';
  if (geo.figureType === 'vector' && geo.points.length >= 2) {
    const v = Vector2D.fromPoints(geo.points[0], geo.points[1]);
    const deg = ((v.angle * 180) / Math.PI).toFixed(1);
    metricsStr = `||v|| = ${v.magnitude.toFixed(1)} px | θ = ${deg}°`;
  } else if (geo.figureType === 'polygon') {
    const area = GeometryMath.polygonArea(geo.points);
    metricsStr = `Área = ${area.toFixed(1)} px² | Vértices: ${geo.points.length}`;
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden select-none w-72">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 bg-slate-50/80">
        <span className="text-xs font-semibold text-slate-700 capitalize">
          {geo.label || `Geometría (${geo.figureType})`}
        </span>
        <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
          Geometry Engine
        </span>
      </div>
      <canvas ref={canvasRef} width={288} height={180} className="w-full h-[180px] block" />
      <div className="px-3 py-1.5 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-600 font-mono">
        {metricsStr || 'Objeto geométrico 2D'}
      </div>
    </div>
  );
}
