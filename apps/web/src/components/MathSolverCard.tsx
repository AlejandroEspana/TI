import { useState } from 'react';
import { Calculator, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { solveEquation, type SolveResult } from '../services/api';

export function MathSolverCard() {
  const [expression, setExpression] = useState('2*x^2 + 5*x - 3 = 0');
  const [variable, setVariable] = useState('x');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expression.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await solveEquation(expression, variable);
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error solving expression');
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm shadow-xl">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Calculator className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-slate-100">Deterministic Engine Test (Phase 0)</h3>
      </div>

      <form onSubmit={handleSolve} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Equation or Expression
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g. 2*x^2 + 5*x - 3 = 0"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <input
              type="text"
              value={variable}
              onChange={(e) => setVariable(e.target.value)}
              placeholder="var"
              title="Variable to solve for"
              className="w-16 text-center px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Solve <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 rounded-lg bg-indigo-950/20 border border-indigo-900/40">
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deterministic SymPy Result</span>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400">
              Roots for <span className="font-mono text-slate-300 font-bold">{result.variable}</span>:
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {result.result.length > 0 ? (
                result.result.map((root, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-sm px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 text-emerald-400 font-semibold shadow-inner"
                  >
                    {result.variable} = {root}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No real roots found</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
