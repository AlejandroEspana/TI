import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Server } from 'lucide-react';
import { fetchHealth } from '../services/api';
import type { HealthCheckResponse } from '@mathboard/shared';

export function HealthStatus() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error connecting to backend API');
      }
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-100">Backend API Status</h3>
        </div>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Check
        </button>
      </div>

      <div className="mt-4">
        {loading && !health ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            Connecting to FastAPI engine...
          </div>
        ) : error ? (
          <div className="flex items-start gap-2.5 text-sm text-rose-400 bg-rose-950/30 p-3 rounded-lg border border-rose-900/50">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Connection Offline</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
              <p className="text-xs text-slate-400 mt-2">
                Make sure the API server is running with <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">npm run dev:api</code>
              </p>
            </div>
          </div>
        ) : health ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" /> API Connected
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                v{health.version}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block">SymPy Engine</span>
                <span className="font-mono text-emerald-300 font-medium">
                  {health.services.sympy_version ? `v${health.services.sympy_version}` : 'Active'}
                </span>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block">Engine State</span>
                <span className="font-medium text-emerald-300 capitalize">
                  {health.services.math_engine}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
