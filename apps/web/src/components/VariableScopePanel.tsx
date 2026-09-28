import { useState } from 'react';
import { Sliders, Plus, Trash2, X } from 'lucide-react';

interface VariableScopePanelProps {
  isOpen: boolean;
  onClose: () => void;
  variables: Record<string, number | string>;
  onSetVariable: (name: string, value: number) => void;
  onRemoveVariable: (name: string) => void;
}

export function VariableScopePanel({
  isOpen,
  onClose,
  variables,
  onSetVariable,
  onRemoveVariable,
}: VariableScopePanelProps) {
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('1');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarName.trim()) return;
    const val = parseFloat(newVarValue) || 0;
    onSetVariable(newVarName.trim(), val);
    setNewVarName('');
    setNewVarValue('1');
  };

  const varEntries = Object.entries(variables);

  return (
    <div className="fixed top-16 right-5 z-40 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 w-80 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Variables del Tablero</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Variables List */}
      <div className="py-3 space-y-3 max-h-72 overflow-y-auto">
        {varEntries.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4 italic">
            No hay variables asignadas aún. Escribe en el tablero <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">a = 5</code> o añádela aquí.
          </p>
        ) : (
          varEntries.map(([name, val]) => {
            const numVal = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
            return (
              <div
                key={name}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {name} = {numVal}
                  </span>
                  <button
                    onClick={() => onRemoveVariable(name)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                    title="Eliminar variable"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Dynamic Slider */}
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={numVal}
                  onChange={(e) => onSetVariable(name, parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
            );
          })
        )}
      </div>

      {/* Add Variable Form */}
      <form onSubmit={handleAdd} className="pt-3 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          placeholder="Var (ej. k)"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <input
          type="number"
          step="any"
          placeholder="Valor"
          value={newVarValue}
          onChange={(e) => setNewVarValue(e.target.value)}
          className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
          title="Agregar variable"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
