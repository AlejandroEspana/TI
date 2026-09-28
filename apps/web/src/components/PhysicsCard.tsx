import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { PhysicsBoardObject } from '@mathboard/shared';
import { PhysicsEngine2D } from '@mathboard/physics-core';

interface PhysicsCardProps {
  physicsObj: PhysicsBoardObject;
}

export function PhysicsCard({ physicsObj }: PhysicsCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [energy, setEnergy] = useState<{ kinetic: number; potential: number; total: number }>({
    kinetic: 0,
    potential: 0,
    total: 0,
  });

  const engineRef = useRef<PhysicsEngine2D | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const trailRef = useRef<{ x: number; y: number }[]>([]);

  // Initialize engine
  useEffect(() => {
    const engine = new PhysicsEngine2D();
    engine.gravity = { x: 0, y: 9.81 * 4 }; // Positive down in canvas coords
    engine.airResistanceCoefficient = 0.05;

    engine.addBody({
      id: 'projectile',
      mass: physicsObj.mass || 2,
      position: { x: 30, y: 150 },
      velocity: { x: 45, y: -50 }, // Initial launch vector up-right
      acceleration: { x: 0, y: 0 },
      forces: [],
    });

    engineRef.current = engine;
    trailRef.current = [{ x: 30, y: 150 }];

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [physicsObj]);

  const resetSimulation = () => {
    setRunning(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const engine = engineRef.current;
    if (engine) {
      const b = engine.getBody('projectile');
      if (b) {
        b.position = { x: 30, y: 150 };
        b.velocity = { x: 45, y: -50 };
        b.acceleration = { x: 0, y: 0 };
        b.forces = [];
      }
    }
    trailRef.current = [{ x: 30, y: 150 }];
    renderCanvas();
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clean white canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Ground line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - 15);
    ctx.lineTo(width, height - 15);
    ctx.stroke();

    // Trajectory trail
    if (trailRef.current.length > 1) {
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
      for (let i = 1; i < trailRef.current.length; i++) {
        ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const body = engine.getBody('projectile');
    if (body) {
      // 1. Draw Velocity Vector (blue arrow)
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(body.position.x, body.position.y);
      ctx.lineTo(body.position.x + body.velocity.x * 0.4, body.position.y + body.velocity.y * 0.4);
      ctx.stroke();

      // 2. Draw Gravity Vector (amber arrow)
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(body.position.x, body.position.y);
      ctx.lineTo(body.position.x, body.position.y + 25);
      ctx.stroke();

      // 3. Draw Body (Particle)
      ctx.fillStyle = physicsObj.color || '#4f46e5';
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, physicsObj.radius || 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const engine = engineRef.current;
      if (engine && running) {
        engine.step(dt);
        const b = engine.getBody('projectile');
        if (b) {
          // Floor bounce
          if (b.position.y >= 170) {
            b.position.y = 170;
            b.velocity.y = -b.velocity.y * 0.7; // damping restitution
            b.velocity.x *= 0.9;
          }
          if (b.position.x >= 280) {
            b.position.x = 280;
            b.velocity.x = -b.velocity.x * 0.7;
          }

          trailRef.current.push({ x: b.position.x, y: b.position.y });
          if (trailRef.current.length > 100) trailRef.current.shift();

          const currentEnergy = engine.calculateEnergy('projectile', 170);
          if (currentEnergy) {
            setEnergy(currentEnergy);
          }
        }
      }

      renderCanvas();

      if (running) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    if (running) {
      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      renderCanvas();
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [running]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden select-none w-72">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 bg-slate-50/80">
        <span className="text-xs font-semibold text-slate-700">Simulación Física 2D</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRunning((prev) => !prev)}
            className="p-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
            title={running ? 'Pausar' : 'Iniciar'}
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={resetSimulation}
            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
            title="Reiniciar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} width={288} height={190} className="w-full h-[190px] block" />

      {/* Energy Hud */}
      <div className="px-3.5 py-2 bg-slate-50/70 border-t border-slate-100 space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Ec: {energy.kinetic.toFixed(1)} J</span>
          <span>Ep: {energy.potential.toFixed(1)} J</span>
          <span className="font-bold text-slate-700">Em: {energy.total.toFixed(1)} J</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
          <div
            className="bg-blue-500 h-full transition-all duration-75"
            style={{ width: `${Math.min(100, (energy.kinetic / (energy.total || 1)) * 100)}%` }}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-75"
            style={{ width: `${Math.min(100, (energy.potential / (energy.total || 1)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
