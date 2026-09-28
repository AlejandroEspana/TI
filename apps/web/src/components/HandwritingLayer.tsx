import { useState, useRef, useEffect } from 'react';
import { MathematicalStrokeRecognizer, TemplateStore, type StrokePoint } from '@mathboard/handwriting';
import { Sparkles, Trash2, X, Check, GraduationCap } from 'lucide-react';
import { MathView } from './MathView';

interface HandwritingLayerProps {
  isActive: boolean;
  onClose: () => void;
  onDigitalize: (latex: string, position: { x: number; y: number }) => void;
  viewport: { x: number; y: number; zoom: number };
  onOpenCalibration?: () => void;
}

export function HandwritingLayer({
  isActive,
  onClose,
  onDigitalize,
  viewport,
  onOpenCalibration,
}: HandwritingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<StrokePoint[]>([]);
  const isDrawingRef = useRef(false);
  const [previewLatex, setPreviewLatex] = useState<string>('');
  const [activeProfileName, setActiveProfileName] = useState(() => TemplateStore.getInstance().getActiveProfile().name);

  // Subscribe to profile changes
  useEffect(() => {
    return TemplateStore.getInstance().subscribe(() => {
      setActiveProfileName(TemplateStore.getInstance().getActiveProfile().name);
    });
  }, []);

  // Resize canvas to full window
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redrawCanvas();
  }, [isActive]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Style for digital ink: smooth rounded lines
    ctx.strokeStyle = '#1e1b4b'; // dark indigo
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const allStrokes = [...strokes, ...(currentStroke.length > 0 ? [currentStroke] : [])];
    for (const s of allStrokes) {
      if (s.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) {
        ctx.lineTo(s[i].x, s[i].y);
      }
      ctx.stroke();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isActive) return;
    isDrawingRef.current = true;
    const pt: StrokePoint = { x: e.clientX, y: e.clientY, time: Date.now() };
    setCurrentStroke([pt]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    const pt: StrokePoint = { x: e.clientX, y: e.clientY, time: Date.now() };
    setCurrentStroke((prev) => {
      const next = [...prev, pt];
      redrawCanvas();
      return next;
    });
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentStroke.length > 1) {
      const updatedStrokes = [...strokes, currentStroke];
      setStrokes(updatedStrokes);
      setCurrentStroke([]);

      // Real-time stroke recognition using active calibrated profile
      const activeId = TemplateStore.getInstance().getActiveProfile().id;
      const { latex } = MathematicalStrokeRecognizer.recognizeStrokesToLatex(updatedStrokes, activeId);
      if (latex) {
        setPreviewLatex(latex);
      }
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setPreviewLatex('');
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleConfirmDigitalize = () => {
    if (!previewLatex && strokes.length === 0) return;

    // Compute bounding box center in world coordinates
    let minX = Infinity, minY = Infinity;
    for (const stroke of strokes) {
      for (const p of stroke) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
      }
    }
    if (!isFinite(minX)) {
      minX = window.innerWidth / 2;
      minY = window.innerHeight / 2;
    }

    // Convert screen coordinates to world
    const worldX = (minX - viewport.x) / viewport.zoom;
    const worldY = (minY - viewport.y) / viewport.zoom;

    const finalLatex = previewLatex || 'x';
    onDigitalize(finalLatex, { x: worldX, y: worldY });
    handleClear();
    onClose();
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-40 cursor-crosshair">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full block bg-indigo-50/10 backdrop-blur-[0.5px]"
      />

      {/* Floating Recognition & Digitalize Pill */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white shadow-2xl border border-slate-200 rounded-2xl p-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-2 pl-2 pr-3 border-r border-slate-200">
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">Digitalizador OCR:</span>
          {previewLatex ? (
            <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-200">
              <MathView latex={previewLatex} />
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">Escribe en el tablero...</span>
          )}
        </div>

        <button
          onClick={handleConfirmDigitalize}
          disabled={!previewLatex && strokes.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Check className="w-4 h-4" />
          <span>Digitalizar al Tablero</span>
        </button>

        {onOpenCalibration && (
          <button
            onClick={onOpenCalibration}
            title={`Calibrar caligrafía (Perfil: ${activeProfileName})`}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px] font-semibold">{activeProfileName}</span>
          </button>
        )}

        <button
          onClick={handleClear}
          title="Borrar trazos"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={onClose}
          title="Cerrar lápiz"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
