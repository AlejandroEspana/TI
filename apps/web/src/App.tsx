import { HealthStatus } from './components/HealthStatus';
import { MathSolverCard } from './components/MathSolverCard';
import { Layers, Terminal, CheckCircle, Code2, Compass } from 'lucide-react';

const PACKAGES = [
  { name: '@mathboard/shared', desc: 'Common interfaces, AST definitions & event contracts', status: 'Ready' },
  { name: '@mathboard/core', desc: 'Canvas object manager & viewport coordinator (Fase 1)', status: 'Ready' },
  { name: '@mathboard/parser', desc: 'LaTeX tokenizer & semantic classifier (Fase 3)', status: 'Ready' },
  { name: '@mathboard/math-engine', desc: 'Deterministic operation runner & SymPy adapter (Fase 4)', status: 'Ready' },
  { name: '@mathboard/visualization', desc: '2D Plotly & D3 graphing specifications (Fase 6)', status: 'Ready' },
];

const PHASES = [
  { phase: '0', title: 'Arquitectura & Setup', active: true, done: true },
  { phase: '1', title: 'Smart Canvas (tldraw)', active: false, done: false },
  { phase: '2', title: 'Editor (MathLive)', active: false, done: false },
  { phase: '3', title: 'Parser & AST', active: false, done: false },
  { phase: '4', title: 'Math Engine (SymPy)', active: false, done: false },
  { phase: '5', title: 'Step Engine', active: false, done: false },
  { phase: '6', title: 'Graph Engine 2D', active: false, done: false },
];

export function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-emerald-500/20">
              ∑
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                MathBoard
              </span>
              <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400">
                Fase 0 Activa
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fullstack Monorepo</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 p-8 shadow-2xl">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
              <Compass className="w-3.5 h-3.5" />
              <span>Motor Matemático Determinista sin IA</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tablero Matemático Modular
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Base técnica configurada con React 19, TypeScript, Vite, Tailwind CSS, FastAPI, SymPy y Docker.
              Estructurado para evolucionar paso a paso desde el Smart Canvas hasta la resolución simbólica y graficación 2D.
            </p>
          </div>

          {/* Phase tracker */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Progreso del Roadmap (Fases 0 a 6)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {PHASES.map((p) => (
                <div
                  key={p.phase}
                  className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                    p.done
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : p.active
                      ? 'bg-indigo-950/40 border-indigo-700/60 text-indigo-300 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold">Fase {p.phase}</span>
                    {p.done ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    )}
                  </div>
                  <span className="font-medium truncate">{p.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Diagnostics & API Verification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HealthStatus />
          <MathSolverCard />
        </div>

        {/* Packages Architecture Grid */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100">Paquetes del Monorepo (@mathboard/*)</h3>
            </div>
            <span className="text-xs text-slate-400">npm workspaces</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
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

        {/* Developer Commands Reference */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Code2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Comandos Rápidos de Desarrollo</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Frontend y Backend sincronizados con hot reload en un solo comando.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
              npm run dev
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
              npm run test
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
              docker compose up
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        MathBoard — Arquitectura de software modular para matemáticas interactivas.
      </footer>
    </div>
  );
}

export default App;
