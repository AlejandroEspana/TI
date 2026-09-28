import {
  MousePointer2,
  Hand,
  Sigma,
  TrendingUp,
  Compass,
  Atom,
  PenTool,
  Boxes,
  GraduationCap,
  Sliders,
  Undo2,
  Redo2,
  Maximize2,
  Download,
  Trash2,
  Sparkles,
} from 'lucide-react';

export type ToolMode =
  | 'select'
  | 'pan'
  | 'pencil'
  | 'math'
  | 'graph'
  | 'geometry'
  | 'physics'
  | 'graph3d'
  | 'exercise';

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
  onToggleVariables: () => void;
  onOpenCalibration: () => void;
  variablesCount: number;
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
  onToggleVariables,
  onOpenCalibration,
  variablesCount,
  zoom,
}: CanvasToolbarProps) {
  const tools: { id: ToolMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Puntero', icon: <MousePointer2 className="w-4 h-4" />, shortcut: 'V' },
    { id: 'pan', label: 'Mano', icon: <Hand className="w-4 h-4" />, shortcut: 'H' },
    { id: 'pencil', label: 'Lápiz OCR', icon: <PenTool className="w-4 h-4" />, shortcut: 'W' },
    { id: 'math', label: 'Fórmula', icon: <Sigma className="w-4 h-4" />, shortcut: 'M' },
    { id: 'graph', label: 'Gráfica 2D', icon: <TrendingUp className="w-4 h-4" />, shortcut: 'G' },
    { id: 'graph3d', label: 'Superficie 3D', icon: <Boxes className="w-4 h-4" />, shortcut: '3D' },
    { id: 'geometry', label: 'Geometría', icon: <Compass className="w-4 h-4" />, shortcut: 'T' },
    { id: 'physics', label: 'Física', icon: <Atom className="w-4 h-4" />, shortcut: 'P' },
    { id: 'exercise', label: 'Ejercicio', icon: <GraduationCap className="w-4 h-4" />, shortcut: 'E' },
  ];

  return (
    <div
      data-ui="true"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-1.5 flex items-center gap-1 max-w-[96vw] overflow-x-auto"
    >
      {/* Primary Tools */}
      <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            title={`${t.label} (${t.shortcut})`}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              currentTool === t.id
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.icon}
            <span className="hidden md:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Variables & Calibration Buttons */}
      <div className="flex items-center gap-1 px-1.5 border-r border-slate-200">
        <button
          onClick={onToggleVariables}
          title="Variables del Tablero"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Variables</span>
          {variablesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] rounded-full font-mono">
              {variablesCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenCalibration}
          title="Calibrar Caligrafía y Perfiles"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Calibrar</span>
        </button>
      </div>

      {/* History Controls (Command Pattern) */}
      <div className="flex items-center gap-1 px-1.5 border-r border-slate-200">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Deshacer (Ctrl+Z)"
          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Rehacer (Ctrl+Y)"
          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Viewport and Canvas Actions */}
      <div className="flex items-center gap-1 pl-1">
        <button
          onClick={onResetView}
          title="Restablecer Vista"
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-mono font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{Math.round(zoom * 100)}%</span>
        </button>
        <button
          onClick={onExportJSON}
          title="Exportar Tablero (JSON)"
          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onClear}
          title="Limpiar Tablero"
          className="p-1.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
