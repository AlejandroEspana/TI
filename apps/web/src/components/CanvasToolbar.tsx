import {
  MousePointer2,
  Hand,
  Sigma,
  TrendingUp,
  Compass,
  Atom,
  Undo2,
  Redo2,
  Maximize2,
  Download,
  Trash2,
} from 'lucide-react';

export type ToolMode = 'select' | 'pan' | 'math' | 'graph' | 'geometry' | 'physics';

interface CanvasToolbarProps {
  currentTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetView: () => void;
  onExportJSON: () => void;
  onClear: () => void;
  zoom: number;
}

export function CanvasToolbar({
  currentTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetView,
  onExportJSON,
  onClear,
  zoom,
}: CanvasToolbarProps) {
  const tools: { id: ToolMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Seleccionar', icon: <MousePointer2 className="w-4 h-4" />, shortcut: 'V' },
    { id: 'pan', label: 'Mover Tablero', icon: <Hand className="w-4 h-4" />, shortcut: 'H' },
    { id: 'math', label: 'Fórmula Matemática', icon: <Sigma className="w-4 h-4" />, shortcut: 'M' },
    { id: 'graph', label: 'Gráfica 2D', icon: <TrendingUp className="w-4 h-4" />, shortcut: 'G' },
    { id: 'geometry', label: 'Geometría', icon: <Compass className="w-4 h-4" />, shortcut: 'T' },
    { id: 'physics', label: 'Física', icon: <Atom className="w-4 h-4" />, shortcut: 'P' },
  ];

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-1.5 flex items-center gap-1">
      {/* Primary Tools */}
      <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            title={`${t.label} (${t.shortcut})`}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              currentTool === t.id
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* History Controls (Command Pattern) */}
      <div className="flex items-center gap-1 px-2 border-r border-slate-200">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Deshacer (Ctrl+Z)"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Rehacer (Ctrl+Y)"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Viewport and Canvas Actions */}
      <div className="flex items-center gap-1 pl-1">
        <button
          onClick={onResetView}
          title="Restablecer Vista"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{Math.round(zoom * 100)}%</span>
        </button>
        <button
          onClick={onExportJSON}
          title="Exportar Tablero (JSON)"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onClear}
          title="Limpiar Tablero"
          className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
