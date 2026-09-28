import { X, ArrowDown } from 'lucide-react';
import type { MathStep } from '@mathboard/shared';

interface StepsModalProps {
  isOpen: boolean;
  expression: string;
  steps: MathStep[];
  onClose: () => void;
}

export function StepsModal({ isOpen, expression, steps, onClose }: StepsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Procedimiento Paso a Paso</h3>
            <p className="text-xs font-mono text-indigo-600 mt-0.5">{expression}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {steps.map((step, idx) => (
            <div key={step.id || idx} className="space-y-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                    Paso {step.stepNumber || idx + 1}: {step.operation}
                  </span>
                </div>
                <div className="font-mono text-sm font-semibold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/70">
                  {step.after}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {step.explanation}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex justify-center text-slate-400">
                  <ArrowDown className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
