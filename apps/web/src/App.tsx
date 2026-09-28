import { useState } from 'react';
import { MathBoardCanvas } from './components/MathBoardCanvas';
import { HealthStatus } from './components/HealthStatus';
import { MathSolverCard } from './components/MathSolverCard';
import { Layers, CheckCircle, Compass, Layout } from 'lucide-react';

const PACKAGES = [
  { name: '@mathboard/shared', desc: 'Interfaces base, AST y contratos del tablero', status: 'Ready' },
  { name: '@mathboard/core', desc: 'Command Pattern (Undo/Redo), ObjectManager y BoardScope', status: 'Ready' },
  { name: '@mathboard/handwriting', desc: 'Reconocimiento de trazos manuscritos y digitalización a LaTeX', status: 'Ready' },
  { name: '@mathboard/parser', desc: 'Lexer, Tokenizer y Clasificador Semántico propio', status: 'Ready' },
  { name: '@mathboard/math-engine', desc: 'ActionRegistry y operaciones deterministas desacopladas', status: 'Ready' },
  { name: '@mathboard/visualization', desc: 'Evaluador cartesiano 2D, trazador 3D orbital y cálculo de raíces', status: 'Ready' },
  { name: '@mathboard/geometry-core', desc: 'Vectores, distancias, áreas e intersecciones 2D', status: 'Ready' },
  { name: '@mathboard/physics-core', desc: 'Mecánica newtoniana, integrador Verlet y conservación de energía', status: 'Ready' },
];

const PHASES = [
  { phase: '0', title: 'Arquitectura & Setup', done: true },
  { phase: '1', title: 'Smart Canvas Blanco', done: true },
  { phase: '2', title: 'Editor (KaTeX/LaTeX)', done: true },
  { phase: '3', title: 'Parser & AST Semántico', done: true },
  { phase: '4', title: 'Math Engine (SymPy)', done: true },
  { phase: '5', title: 'Transformation / Steps', done: true },
  { phase: '6', title: 'Graph Engine 2D', done: true },
  { phase: '7', title: 'Geometría Computacional', done: true },
  { phase: '8', title: 'Physics Engine 2D', done: true },
  { phase: '9', title: 'Visualización 3D', done: true },
  { phase: '10', title: 'Reconocimiento Manuscrito', done: true },
  { phase: '11', title: 'Sistema Educativo & Scope', done: true },
];

export function App() {
  const [view, setView] = useState<'canvas' | 'dashboard'>('canvas');

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-white">
      {/* Top Header */}
      <header className="h-12 border-b border-slate-200 bg-white/90 backdrop-blur-md px-5 flex items-center justify-between z-30 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-white text-sm shadow-sm">
            ∑
          </div>
          <span className="font-bold text-base text-slate-800 tracking-tight">
            MathBoard
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
            Fases 1–11 Completadas
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setView('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              view === 'canvas'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tablero Blanco</span>
          </button>
          <button
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              view === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layout className="w-3.5 h-3.5 text-emerald-600" />
            <span>Diagnóstico & Arquitectura</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {view === 'canvas' ? (
          <MathBoardCanvas />
        ) : (
          <div className="h-full overflow-y-auto bg-slate-950 text-slate-100 p-8 space-y-8">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Architecture Hero */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 p-8 shadow-2xl">
                <div className="max-w-3xl space-y-2">
                  <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                    Clean Architecture & Ports and Adapters
                  </span>
                  <h2 className="text-2xl font-bold text-white">
                    Panel Técnico de Motores y Módulos (Fases 0 a 8)
                  </h2>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    MathBoard funciona de manera 100% determinista sin IA. El backend desacopla SymPy y NumPy
                    mediante puertos e interfaces, mientras que el frontend orquesta el Smart Canvas, el motor de pasos,
                    el graficador cartesiano, la geometría computacional y la simulación física newtoniana.
                  </p>
                </div>

                {/* Phases Tracker */}
                <div className="mt-6 pt-6 border-t border-slate-800/80">
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                    {PHASES.map((p) => (
                      <div
                        key={p.phase}
                        className="p-2.5 rounded-lg border bg-emerald-950/40 border-emerald-800/60 text-emerald-300 text-xs flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold">F{p.phase}</span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="font-medium text-[11px] truncate">{p.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Diagnostics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HealthStatus />
                <MathSolverCard />
              </div>

              {/* Packages Grid */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold text-slate-100">Paquetes del Monorepo Activos</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">7 packages</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PACKAGES.map((pkg) => (
                    <div
                      key={pkg.name}
                      className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-semibold text-indigo-300">
                          {pkg.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/50">
                          {pkg.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{pkg.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
