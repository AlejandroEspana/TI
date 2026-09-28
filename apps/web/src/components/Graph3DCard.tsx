import { useEffect, useRef, useState } from 'react';
import type { Graph3DBoardObject } from '@mathboard/shared';
import { sampleSurface3D, project3DTo2D } from '@mathboard/visualization';
import { Rotate3D, RotateCcw } from 'lucide-react';

interface Graph3DCardProps {
  graph3d: Graph3DBoardObject;
}

export function Graph3DCard({ graph3d }: Graph3DCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(graph3d.rotation || { theta: 0.8, phi: 0.5 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const center = { x: width / 2, y: height / 2 + 10 };

    // Clean white canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Sample surface
    const mesh = sampleSurface3D(graph3d.expression, graph3d.xDomain, graph3d.yDomain, 16);
    const scale = 22;

    // Helper to get color by height
    const getColor = (z: number) => {
      const norm = Math.max(0, Math.min(1, (z - mesh.zMin) / (mesh.zMax - mesh.zMin || 1)));
      // Cool to warm gradient: Blue -> Cyan -> Emerald -> Amber -> Red
      const r = Math.round(norm * 230);
      const g = Math.round((1 - Math.abs(norm - 0.5) * 2) * 180 + 40);
      const b = Math.round((1 - norm) * 220);
      return `rgb(${r}, ${g}, ${b})`;
    };

    // Draw mesh grid lines
    ctx.lineWidth = 1.2;

    // 1. Draw X-constant lines
    for (let i = 0; i < mesh.grid.length; i++) {
      ctx.beginPath();
      for (let j = 0; j < mesh.grid[i].length; j++) {
        const pt = mesh.grid[i][j];
        const proj = project3DTo2D(pt, rotation.theta, rotation.phi, scale, center);
        if (j === 0) ctx.moveTo(proj.x, proj.y);
        else ctx.lineTo(proj.x, proj.y);
      }
      const midZ = mesh.grid[i][Math.floor(mesh.grid[i].length / 2)].z;
      ctx.strokeStyle = getColor(midZ);
      ctx.stroke();
    }

    // 2. Draw Y-constant lines
    for (let j = 0; j < mesh.grid[0].length; j++) {
      ctx.beginPath();
      for (let i = 0; i < mesh.grid.length; i++) {
        const pt = mesh.grid[i][j];
        const proj = project3DTo2D(pt, rotation.theta, rotation.phi, scale, center);
        if (i === 0) ctx.moveTo(proj.x, proj.y);
        else ctx.lineTo(proj.x, proj.y);
      }
      const midZ = mesh.grid[Math.floor(mesh.grid.length / 2)][j].z;
      ctx.strokeStyle = getColor(midZ);
      ctx.stroke();
    }

    // 3. Draw 3D Axes
    const origin = project3DTo2D({ x: 0, y: 0, z: 0 }, rotation.theta, rotation.phi, scale, center);
    const xEnd = project3DTo2D({ x: 3.5, y: 0, z: 0 }, rotation.theta, rotation.phi, scale, center);
    const yEnd = project3DTo2D({ x: 0, y: 3.5, z: 0 }, rotation.theta, rotation.phi, scale, center);
    const zEnd = project3DTo2D({ x: 0, y: 0, z: 3.5 }, rotation.theta, rotation.phi, scale, center);

    // X Axis (Red)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(xEnd.x, xEnd.y);
    ctx.stroke();

    // Y Axis (Green)
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(yEnd.x, yEnd.y);
    ctx.stroke();

    // Z Axis (Blue)
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(zEnd.x, zEnd.y);
    ctx.stroke();
  }, [graph3d, rotation]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    setRotation((prev) => ({
      theta: prev.theta + dx * 0.015,
      phi: Math.max(-1.4, Math.min(1.4, prev.phi + dy * 0.015)),
    }));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = false;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden select-none w-80">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-1.5">
          <Rotate3D className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-700 font-mono">
            z = {graph3d.expression}
          </span>
        </div>
        <button
          onClick={() => setRotation({ theta: 0.8, phi: 0.5 })}
          className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
          title="Restablecer rotación"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={320}
        height={220}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-[220px] block cursor-grab active:cursor-grabbing"
      />

      <div className="px-3 py-1.5 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="italic">Arrastra con el ratón para rotar en 3D</span>
        <span className="font-mono text-indigo-600 font-semibold text-[10px]">Fase 9: 3D Engine</span>
      </div>
    </div>
  );
}
