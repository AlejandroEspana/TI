import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { MathView } from './MathView';

interface MathEditorModalProps {
  isOpen: boolean;
  initialLatex?: string;
  onClose: () => void;
  onSave: (latex: string) => void;
}

const SYMBOLS = [
  { label: 'x²', insert: '^2' },
  { label: '√x', insert: '\\sqrt{}' },
  { label: 'a/b', insert: '\\frac{}{}' },
  { label: '∫', insert: '\\int' },
  { label: 'd/dx', insert: '\\frac{d}{dx}' },
  { label: 'sin', insert: '\\sin()' },
  { label: 'cos', insert: '\\cos()' },
  { label: 'π', insert: '\\pi' },
  { label: 'θ', insert: '\\theta' },
  { label: '±', insert: '\\pm' },
  { label: '≤', insert: '\\le' },
  { label: '≥', insert: '\\ge' },
];

export function MathEditorModal({ isOpen, initialLatex = '', onClose, onSave }: MathEditorModalProps) {
  const [latex, setLatex] = useState(initialLatex || '2x^2 + 5x - 3 = 0');

  if (!isOpen) return null;

  const handleInsert = (str: string) => {
    setLatex((prev) => prev + str);
  };

  const handleSave = () => {
    if (latex.trim()) {
      onSave(latex.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Editor Matemático LaTeX</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Live KaTeX Preview */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 min-h-[70px] flex items-center justify-center text-slate-800 text-xl font-serif">
            {latex ? (
              <MathView latex={latex} displayMode />
            ) : (
              <span className="text-slate-400 text-sm font-sans italic">Escribe una fórmula...</span>
            )}
          </div>

          {/* Input text */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Código LaTeX o Expresión
            </label>
            <input
              type="text"
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="Ej: 2x^2 + 5x - 3 = 0"
              autoFocus
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Virtual Symbols Keypad */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Símbolos Rápidos
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {SYMBOLS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleInsert(s.insert)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50/70 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            Insertar en Tablero
          </button>
        </div>
      </div>
    </div>
  );
}
