import { useState, useRef, useEffect } from 'react';
import {
  TemplateStore,
  MathematicalStrokeRecognizer,
  type CustomTemplate,
  type StrokePoint,
} from '@mathboard/handwriting';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  Check,
  GraduationCap,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { MathView } from './MathView';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SymbolCategory {
  name: string;
  items: Array<{ symbol: string; latex: string; label: string }>;
}

const SYMBOL_CATEGORIES: SymbolCategory[] = [
  {
    name: 'Números',
    items: [
      { symbol: '0', latex: '0', label: 'Cero' },
      { symbol: '1', latex: '1', label: 'Uno' },
      { symbol: '2', latex: '2', label: 'Dos' },
      { symbol: '3', latex: '3', label: 'Tres' },
      { symbol: '4', latex: '4', label: 'Cuatro' },
      { symbol: '5', latex: '5', label: 'Cinco' },
      { symbol: '6', latex: '6', label: 'Seis' },
      { symbol: '7', latex: '7', label: 'Siete' },
      { symbol: '8', latex: '8', label: 'Ocho' },
      { symbol: '9', latex: '9', label: 'Nueve' },
    ],
  },
  {
    name: 'Variables',
    items: [
      { symbol: 'x', latex: 'x', label: 'Variable x' },
      { symbol: 'y', latex: 'y', label: 'Variable y' },
      { symbol: 'z', latex: 'z', label: 'Variable z' },
      { symbol: 'a', latex: 'a', label: 'Variable a' },
      { symbol: 'b', latex: 'b', label: 'Variable b' },
      { symbol: 'c', latex: 'c', label: 'Variable c' },
    ],
  },
  {
    name: 'Operadores',
    items: [
      { symbol: '+', latex: '+', label: 'Suma +' },
      { symbol: '-', latex: '-', label: 'Resta -' },
      { symbol: '*', latex: '\\cdot', label: 'Multiplicación *' },
      { symbol: '/', latex: '/', label: 'División /' },
      { symbol: '=', latex: '=', label: 'Igualdad =' },
      { symbol: '(', latex: '(', label: 'Paréntesis (' },
      { symbol: ')', latex: ')', label: 'Paréntesis )' },
    ],
  },
  {
    name: 'Cálculo',
    items: [
      { symbol: '√', latex: '\\sqrt{}', label: 'Raíz cuadrada' },
      { symbol: '∫', latex: '\\int', label: 'Integral' },
    ],
  },
];

export function HandwritingCalibrationModal({ isOpen, onClose }: CalibrationModalProps) {
  const store = TemplateStore.getInstance();
  const [profiles, setProfiles] = useState(() => store.getProfiles());
  const [activeProfile, setActiveProfile] = useState(() => store.getActiveProfile());
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOL_CATEGORIES[0].items[0]);
  const [activeTab, setActiveTab] = useState<'train' | 'test'>('train');

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const testCanvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<StrokePoint[]>([]);
  const isDrawingRef = useRef(false);

  // Test sandbox state
  const [testStrokes, setTestStrokes] = useState<StrokePoint[][]>([]);
  const [testCurrentStroke, setTestCurrentStroke] = useState<StrokePoint[]>([]);
  const [testResult, setTestResult] = useState<{ symbol: string; latex: string; confidence: number } | null>(null);

  // Success flash feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Subscribe to store updates
  useEffect(() => {
    return store.subscribe(() => {
      setProfiles(store.getProfiles());
      setActiveProfile(store.getActiveProfile());
    });
  }, [store]);

  // Redraw training canvas
  useEffect(() => {
    if (!isOpen || activeTab !== 'train') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Guide baseline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height * 0.75);
    ctx.lineTo(canvas.width - 20, canvas.height * 0.75);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw ink
    ctx.strokeStyle = '#312e81'; // deep indigo
    ctx.lineWidth = 4;
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
  }, [strokes, currentStroke, isOpen, activeTab]);

  // Redraw test sandbox canvas
  useEffect(() => {
    if (!isOpen || activeTab !== 'test') return;
    const canvas = testCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#0284c7'; // ocean blue
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const allStrokes = [...testStrokes, ...(testCurrentStroke.length > 0 ? [testCurrentStroke] : [])];
    for (const s of allStrokes) {
      if (s.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) {
        ctx.lineTo(s[i].x, s[i].y);
      }
      ctx.stroke();
    }
  }, [testStrokes, testCurrentStroke, isOpen, activeTab]);

  if (!isOpen) return null;

  // Active symbol examples in this profile
  const currentExamples = store.getExamplesForSymbol(selectedSymbol.symbol, activeProfile.id);

  // Profile management
  const handleProfileChange = (id: string) => {
    if (id === '__new__') {
      const name = prompt('Nombre del nuevo perfil (ej. Profesor Pérez, Alumno Sofía):');
      if (name && name.trim()) {
        const created = store.createProfile(name.trim());
        setActiveProfile(created);
      }
    } else {
      store.setActiveProfile(id);
      setActiveProfile(store.getActiveProfile());
    }
  };

  // Canvas drawing handlers (Training)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const pt: StrokePoint = { x: e.clientX - rect.left, y: e.clientY - rect.top, time: Date.now() };
    setCurrentStroke([pt]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pt: StrokePoint = { x: e.clientX - rect.left, y: e.clientY - rect.top, time: Date.now() };
    setCurrentStroke((prev) => [...prev, pt]);
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke([]);
    }
  };

  const handleClearDrawing = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  const handleSaveExample = () => {
    if (strokes.length === 0) return;
    store.addExample(selectedSymbol.symbol, selectedSymbol.latex, strokes);
    handleClearDrawing();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  const handleDeleteExample = (exampleId: string) => {
    store.removeExample(exampleId);
  };

  const handleClearAllSymbolExamples = () => {
    if (confirm(`¿Borrar todos los ejemplos entrenados para '${selectedSymbol.symbol}' en el perfil '${activeProfile.name}'?`)) {
      store.clearExamplesForSymbol(selectedSymbol.symbol, activeProfile.id);
    }
  };

  // Test sandbox handlers
  const handleTestMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const pt: StrokePoint = { x: e.clientX - rect.left, y: e.clientY - rect.top, time: Date.now() };
    setTestCurrentStroke([pt]);
  };

  const handleTestMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pt: StrokePoint = { x: e.clientX - rect.left, y: e.clientY - rect.top, time: Date.now() };
    setTestCurrentStroke((prev) => [...prev, pt]);
  };

  const handleTestMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (testCurrentStroke.length > 1) {
      const updated = [...testStrokes, testCurrentStroke];
      setTestStrokes(updated);
      setTestCurrentStroke([]);

      // Test recognition using active profile
      const result = MathematicalStrokeRecognizer.recognizeStrokesToLatex(updated, activeProfile.id);
      if (result.glyphs.length > 0) {
        setTestResult({
          symbol: result.glyphs[0].symbol,
          latex: result.glyphs[0].latex,
          confidence: result.glyphs[0].confidence,
        });
      }
    }
  };

  const handleTestClear = () => {
    setTestStrokes([]);
    setTestCurrentStroke([]);
    setTestResult(null);
  };

  if (!isOpen) return null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Calibración de Caligrafía Manuscrita</h2>
              <p className="text-xs text-slate-500">
                Entrena múltiples ejemplos por símbolo para adaptar MathBoard a tu letra o perfil de clase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile Selector */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-sm">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-600">Perfil:</span>
              <select
                value={activeProfile.id}
                onChange={(e) => handleProfileChange(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.customTemplates.length} ejemplos)
                  </option>
                ))}
                <option value="__new__">+ Crear nuevo perfil...</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 flex gap-2 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('train')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'train'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Entrenar Símbolos</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'test'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Probar Calibración en Vivo</span>
          </button>
        </div>

        {/* Main Body */}
        {activeTab === 'train' ? (
          <div className="flex-1 overflow-hidden grid grid-cols-12 min-h-[460px]">
            {/* Left: Symbol Selector */}
            <div className="col-span-4 border-r border-slate-100 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
              {SYMBOL_CATEGORIES.map((cat) => (
                <div key={cat.name}>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                    {cat.name}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {cat.items.map((item) => {
                      const count = store.getExamplesForSymbol(item.symbol, activeProfile.id).length;
                      const isSelected = selectedSymbol.symbol === item.symbol;
                      return (
                        <button
                          key={item.symbol}
                          onClick={() => {
                            setSelectedSymbol(item);
                            handleClearDrawing();
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm w-5 text-center">
                              {item.symbol}
                            </span>
                            <span className="truncate text-[11px]">{item.label}</span>
                          </div>
                          {count > 0 && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                isSelected ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Training Pad & Examples */}
            <div className="col-span-8 flex flex-col p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold font-mono text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                    <MathView latex={selectedSymbol.latex} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Entrenar: {selectedSymbol.label} ({selectedSymbol.symbol})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Dibuja un ejemplo abajo tal como lo escribes y presiona &quot;Guardar Ejemplo&quot;.
                    </p>
                  </div>
                </div>

                {saveSuccess && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Ejemplo guardado!</span>
                  </div>
                )}
              </div>

              {/* Drawing Canvas */}
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl bg-white p-2 flex flex-col items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={180}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="cursor-crosshair w-full h-[180px] rounded-xl block touch-none"
                />

                <div className="absolute top-3 left-3 text-[11px] text-slate-400 select-none pointer-events-none">
                  Lienzo de dibujo (puedes hacer 1 o varios trazos)
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    onClick={handleClearDrawing}
                    disabled={strokes.length === 0}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Limpiar</span>
                  </button>

                  <button
                    onClick={handleSaveExample}
                    disabled={strokes.length === 0}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Ejemplo</span>
                  </button>
                </div>
              </div>

              {/* Saved Examples Section */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700">
                    Ejemplos registrados para &apos;{selectedSymbol.symbol}&apos; en {activeProfile.name} ({currentExamples.length})
                  </h4>
                  {currentExamples.length > 0 && (
                    <button
                      onClick={handleClearAllSymbolExamples}
                      className="text-[11px] text-red-500 hover:text-red-700 hover:underline"
                    >
                      Borrar todos
                    </button>
                  )}
                </div>

                {currentExamples.length === 0 ? (
                  <div className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center italic">
                    Sin ejemplos personalizados aún. MathBoard usa la plantilla canónica predeterminada.
                    ¡Agrega tus variantes para que aprenda tu estilo!
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2.5">
                    {currentExamples.map((ex: CustomTemplate, idx: number) => (
                      <div
                        key={ex.id}
                        className="border border-slate-200 rounded-xl p-2 bg-slate-50/50 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-slate-500">Ejemplo #{idx + 1}</span>
                          <button
                            onClick={() => handleDeleteExample(ex.id)}
                            title="Eliminar este ejemplo"
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-center font-mono font-bold text-indigo-700 text-sm py-1">
                          {ex.symbol}
                        </div>
                        <div className="text-[10px] text-slate-400 text-center">
                          {ex.strokeCount} trazo(s)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Live Testing Sandbox */
          <div className="p-6 flex flex-col items-center">
            <div className="max-w-lg w-full">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Área de Prueba en Vivo (Perfil: {activeProfile.name})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dibuja cualquier número, variable u operador para evaluar la respuesta del motor.
                  </p>
                </div>
                <button
                  onClick={handleTestClear}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              </div>

              {/* Test Canvas */}
              <div className="border-2 border-slate-200 rounded-2xl bg-white overflow-hidden shadow-inner">
                <canvas
                  ref={testCanvasRef}
                  width={500}
                  height={220}
                  onMouseDown={handleTestMouseDown}
                  onMouseMove={handleTestMouseMove}
                  onMouseUp={handleTestMouseUp}
                  className="cursor-crosshair w-full h-[220px] block touch-none"
                />
              </div>

              {/* Test Results Banner */}
              <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500">Predicción del Motor:</div>
                    {testResult ? (
                      <div className="text-xl font-bold font-mono text-slate-800 flex items-center gap-2">
                        <MathView latex={testResult.latex} />
                        <span className="text-xs font-normal text-slate-500">
                          (Símbolo: &apos;{testResult.symbol}&apos;)
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">Dibuja en el recuadro superior...</div>
                    )}
                  </div>
                </div>

                {testResult && (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Confianza</div>
                    <div className="text-sm font-bold text-emerald-600">
                      {Math.round(testResult.confidence * 100)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Los trazos se guardan de forma local e instantánea para el perfil activo.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
