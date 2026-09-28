import { useState } from 'react';
import type { ExerciseBoardObject } from '@mathboard/shared';
import { verifyAnswer } from '../services/api';
import { GraduationCap, CheckCircle2, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface ExerciseCardProps {
  exercise: ExerciseBoardObject;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [answer, setAnswer] = useState(exercise.userAnswer || '');
  const [status, setStatus] = useState<'idle' | 'checking' | 'correct' | 'incorrect'>('idle');
  const [feedback, setFeedback] = useState<string>('');
  const [showHint, setShowHint] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setStatus('checking');
    try {
      const res = await verifyAnswer(answer, exercise.expectedAnswer);
      if (res.is_correct) {
        setStatus('correct');
        setFeedback(res.feedback);
      } else {
        setStatus('incorrect');
        setFeedback(res.feedback);
      }
    } catch (err: unknown) {
      setStatus('incorrect');
      setFeedback(`Error de evaluación: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden select-none w-80">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-800">{exercise.title}</span>
        </div>
        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          {exercise.topic}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-slate-700 font-medium leading-relaxed">
          {exercise.problemStatement}
        </p>

        <form onSubmit={handleVerify} className="space-y-2">
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Escribe tu respuesta..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={status === 'checking'}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>Verificar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </form>

        {status === 'correct' && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
            <span>{feedback}</span>
          </div>
        )}

        {status === 'incorrect' && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Hint button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>{showHint ? 'Ocultar pista' : 'Ver pista'}</span>
          </button>
          {showHint && (
            <p className="mt-1.5 p-2 bg-amber-50/60 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 leading-relaxed">
              💡 {exercise.hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
