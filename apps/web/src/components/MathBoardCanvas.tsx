import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ObjectManager,
  CommandHistory,
  AddObjectCommand,
  MoveObjectCommand,
  DeleteObjectCommand,
  defaultCoordinateTransformer,
  type Viewport,
} from '@mathboard/core';
import type {
  BoardObject,
  MathBoardObject,
  GraphBoardObject,
  GeometryBoardObject,
  PhysicsBoardObject,
  MathStep,
} from '@mathboard/shared';
import { CanvasToolbar, type ToolMode } from './CanvasToolbar';
import { MathView } from './MathView';
import { MathEditorModal } from './MathEditorModal';
import { GraphCard } from './GraphCard';
import { GeometryCard } from './GeometryCard';
import { PhysicsCard } from './PhysicsCard';
import { StepsModal } from './StepsModal';
import {
  solveEquation,
  fetchSteps,
  fetchDerivative,
  fetchIntegral,
} from '../services/api';
import {
  Sparkles,
  ListOrdered,
  TrendingUp,
  X,
  Divide,
  Activity,
} from 'lucide-react';

export function MathBoardCanvas() {
  const [viewport, setViewport] = useState<Viewport>({ x: 100, y: 100, zoom: 1.0 });
  const [currentTool, setCurrentTool] = useState<ToolMode>('select');
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [stepsModal, setStepsModal] = useState<{ open: boolean; expr: string; steps: MathStep[] }>({
    open: false,
    expr: '',
    steps: [],
  });

  // History & ObjectManager refs
  const managerRef = useRef<ObjectManager>(new ObjectManager());
  const historyRef = useRef<CommandHistory>(new CommandHistory());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Interaction refs
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const draggingIdRef = useRef<string | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const initialObjPosRef = useRef({ x: 0, y: 0 });

  const syncState = useCallback(() => {
    setObjects(managerRef.current.getAllObjects());
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
  }, []);

  // Initial demo setup
  useEffect(() => {
    const manager = managerRef.current;

    // 1. Initial Math Equation Object
    const initialMath: MathBoardObject = {
      id: 'math-init',
      type: 'math',
      latex: '2x^2 + 5x - 3 = 0',
      source: 'keyboard',
      semanticType: 'equation',
      variable: 'x',
      degree: 2,
      position: { x: 80, y: 80 },
    };
    manager.addObject(initialMath);

    // 2. Initial Graph Object
    const initialGraph: GraphBoardObject = {
      id: 'graph-init',
      type: 'graph',
      expression: '2*x^2 + 5*x - 3',
      variable: 'x',
      domain: [-4, 3],
      showRoots: true,
      color: '#4f46e5',
      position: { x: 500, y: 80 },
    };
    manager.addObject(initialGraph);

    // 3. Initial Geometry Object (Vector)
    const initialGeo: GeometryBoardObject = {
      id: 'geo-init',
      type: 'geometry',
      figureType: 'vector',
      points: [
        { x: 30, y: 150 },
        { x: 180, y: 50 },
      ],
      label: 'Vector Fuerza F₁',
      color: '#7c3aed',
      position: { x: 80, y: 390 },
    };
    manager.addObject(initialGeo);

    // 4. Initial Physics Simulation Object
    const initialPhys: PhysicsBoardObject = {
      id: 'phys-init',
      type: 'physics',
      mass: 2,
      velocity: { x: 45, y: -50 },
      acceleration: { x: 0, y: 39.24 },
      radius: 7,
      color: '#ea580c',
      position: { x: 500, y: 390 },
    };
    manager.addObject(initialPhys);

    syncState();
  }, [syncState]);

  // Undo / Redo callbacks
  const handleUndo = useCallback(() => {
    historyRef.current.undo();
    syncState();
  }, [syncState]);

  const handleRedo = useCallback(() => {
    historyRef.current.redo();
    syncState();
  }, [syncState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'v') setCurrentTool('select');
      else if (e.key === 'h') setCurrentTool('pan');
      else if (e.key === 'm') setEditorOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Canvas Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || currentTool === 'pan' || (e.button === 0 && e.target === e.currentTarget)) {
      // Background Pan
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - viewport.x, y: e.clientY - viewport.y };
      setSelectedId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanningRef.current) {
      setViewport((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      }));
    } else if (draggingIdRef.current) {
      const dx = (e.clientX - dragStartPosRef.current.x) / viewport.zoom;
      const dy = (e.clientY - dragStartPosRef.current.y) / viewport.zoom;
      const newPos = {
        x: initialObjPosRef.current.x + dx,
        y: initialObjPosRef.current.y + dy,
      };
      managerRef.current.updateObject(draggingIdRef.current, { position: newPos });
      setObjects([...managerRef.current.getAllObjects()]);
    }
  };

  const handleMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
    }
    if (draggingIdRef.current) {
      const obj = managerRef.current.getObject(draggingIdRef.current);
      if (obj) {
        const moveCmd = new MoveObjectCommand(
          managerRef.current,
          obj.id,
          initialObjPosRef.current,
          obj.position
        );
        historyRef.current.execute(moveCmd);
        syncState();
      }
      draggingIdRef.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(2.5, Math.max(0.4, viewport.zoom * zoomFactor));

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
    const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);

    setViewport({ x: newX, y: newY, zoom: newZoom });
  };

  // Object dragging start
  const handleObjectDragStart = (e: React.MouseEvent, obj: BoardObject) => {
    if (currentTool === 'pan') return;
    e.stopPropagation();
    setSelectedId(obj.id);
    draggingIdRef.current = obj.id;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    initialObjPosRef.current = { ...obj.position };
  };

  // Delete Object with Command
  const handleDeleteObject = (id: string) => {
    const cmd = new DeleteObjectCommand(managerRef.current, id);
    historyRef.current.execute(cmd);
    if (selectedId === id) setSelectedId(null);
    syncState();
  };

  // Add Math Object from Modal
  const handleAddMathObject = (latex: string) => {
    const centerWorld = defaultCoordinateTransformer.screenToWorld(
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      viewport
    );
    const newMath: MathBoardObject = {
      id: `math-${Date.now()}`,
      type: 'math',
      latex,
      source: 'keyboard',
      semanticType: 'equation',
      variable: 'x',
      position: { x: centerWorld.x - 100, y: centerWorld.y - 40 },
    };
    const cmd = new AddObjectCommand(managerRef.current, newMath);
    historyRef.current.execute(cmd);
    syncState();
  };

  // Add Graph Object
  const handleAddGraph = () => {
    const centerWorld = defaultCoordinateTransformer.screenToWorld(
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      viewport
    );
    const newGraph: GraphBoardObject = {
      id: `graph-${Date.now()}`,
      type: 'graph',
      expression: 'x^2 - 4',
      variable: 'x',
      domain: [-5, 5],
      showRoots: true,
      color: '#059669',
      position: { x: centerWorld.x - 150, y: centerWorld.y - 100 },
    };
    const cmd = new AddObjectCommand(managerRef.current, newGraph);
    historyRef.current.execute(cmd);
    syncState();
  };

  // Add Geometry Vector Object
  const handleAddGeometry = () => {
    const centerWorld = defaultCoordinateTransformer.screenToWorld(
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      viewport
    );
    const newGeo: GeometryBoardObject = {
      id: `geo-${Date.now()}`,
      type: 'geometry',
      figureType: 'vector',
      points: [
        { x: 20, y: 140 },
        { x: 160, y: 40 },
      ],
      label: 'Vector Desplazamiento',
      color: '#7c3aed',
      position: { x: centerWorld.x - 120, y: centerWorld.y - 80 },
    };
    const cmd = new AddObjectCommand(managerRef.current, newGeo);
    historyRef.current.execute(cmd);
    syncState();
  };

  // Add Physics Simulation Object
  const handleAddPhysics = () => {
    const centerWorld = defaultCoordinateTransformer.screenToWorld(
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      viewport
    );
    const newPhys: PhysicsBoardObject = {
      id: `phys-${Date.now()}`,
      type: 'physics',
      mass: 3,
      velocity: { x: 50, y: -60 },
      acceleration: { x: 0, y: 39.24 },
      radius: 8,
      color: '#ea580c',
      position: { x: centerWorld.x - 120, y: centerWorld.y - 80 },
    };
    const cmd = new AddObjectCommand(managerRef.current, newPhys);
    historyRef.current.execute(cmd);
    syncState();
  };

  // Math Operations Execution
  const handleSolveMath = async (mathObj: MathBoardObject) => {
    try {
      const res = await solveEquation(mathObj.latex, mathObj.variable || 'x');
      managerRef.current.updateObject(mathObj.id, {
        solutions: res.result,
      } as unknown as Partial<BoardObject>);
      syncState();
    } catch (err: unknown) {
      alert(`Error al resolver: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleShowSteps = async (mathObj: MathBoardObject) => {
    try {
      const res = await fetchSteps(mathObj.latex, mathObj.variable || 'x');
      setStepsModal({ open: true, expr: mathObj.latex, steps: res.steps });
    } catch (err: unknown) {
      alert(`Error en pasos: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDerivative = async (mathObj: MathBoardObject) => {
    try {
      const res = await fetchDerivative(mathObj.latex, mathObj.variable || 'x');
      // Create new derivative math object beside it
      const newObj: MathBoardObject = {
        id: `math-diff-${Date.now()}`,
        type: 'math',
        latex: `\\frac{d}{dx}\\left(${mathObj.latex}\\right) = ${res.latex_result}`,
        source: 'keyboard',
        semanticType: 'derivative',
        position: { x: mathObj.position.x, y: mathObj.position.y + 130 },
      };
      const cmd = new AddObjectCommand(managerRef.current, newObj);
      historyRef.current.execute(cmd);
      syncState();
    } catch (err: unknown) {
      alert(`Error derivada: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleIntegral = async (mathObj: MathBoardObject) => {
    try {
      const res = await fetchIntegral(mathObj.latex, mathObj.variable || 'x');
      const newObj: MathBoardObject = {
        id: `math-int-${Date.now()}`,
        type: 'math',
        latex: `\\int \\left(${mathObj.latex}\\right) dx = ${res.latex_result}`,
        source: 'keyboard',
        semanticType: 'integral',
        position: { x: mathObj.position.x, y: mathObj.position.y + 130 },
      };
      const cmd = new AddObjectCommand(managerRef.current, newObj);
      historyRef.current.execute(cmd);
      syncState();
    } catch (err: unknown) {
      alert(`Error integral: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleGraphFromMath = (mathObj: MathBoardObject) => {
    let cleanExpr = mathObj.latex.replace(/\\left|\\right/g, '');
    if (cleanExpr.includes('=')) {
      cleanExpr = cleanExpr.split('=')[0];
    }
    const newGraph: GraphBoardObject = {
      id: `graph-from-${Date.now()}`,
      type: 'graph',
      expression: cleanExpr,
      variable: mathObj.variable || 'x',
      domain: [-6, 6],
      showRoots: true,
      color: '#2563eb',
      position: { x: mathObj.position.x + 320, y: mathObj.position.y },
    };
    const cmd = new AddObjectCommand(managerRef.current, newGraph);
    historyRef.current.execute(cmd);
    syncState();
  };

  // Tool Selection handler
  const handleSelectTool = (tool: ToolMode) => {
    setCurrentTool(tool);
    if (tool === 'math') {
      setEditorOpen(true);
    } else if (tool === 'graph') {
      handleAddGraph();
      setCurrentTool('select');
    } else if (tool === 'geometry') {
      handleAddGeometry();
      setCurrentTool('select');
    } else if (tool === 'physics') {
      handleAddPhysics();
      setCurrentTool('select');
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const json = managerRef.current.toJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mathboard-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('¿Deseas limpiar todos los objetos del tablero?')) {
      managerRef.current.clear();
      syncState();
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none bg-white cursor-default"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Floating Toolbar */}
      <CanvasToolbar
        currentTool={currentTool}
        onSelectTool={handleSelectTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetView={() => setViewport({ x: 100, y: 100, zoom: 1.0 })}
        onExportJSON={handleExportJSON}
        onClear={handleClear}
        zoom={viewport.zoom}
      />

      {/* Infinite White Canvas Layer with Dot Grid */}
      <div
        className="absolute inset-0 canvas-dot-grid pointer-events-none"
        style={{
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
        }}
      />

      {/* Transformed Objects Container */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {objects.map((obj) => {
          const isSelected = selectedId === obj.id;

          return (
            <div
              key={obj.id}
              onMouseDown={(e) => handleObjectDragStart(e, obj)}
              style={{
                transform: `translate(${obj.position.x}px, ${obj.position.y}px)`,
                cursor: currentTool === 'pan' ? 'grab' : 'move',
              }}
              className={`absolute group transition-shadow ${
                isSelected ? 'ring-2 ring-indigo-500 rounded-2xl shadow-xl' : 'hover:shadow-lg'
              }`}
            >
              {/* Delete button on hover/selected */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteObject(obj.id);
                }}
                className="absolute -top-2.5 -right-2.5 z-20 w-6 h-6 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full border border-slate-200 shadow-sm flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                title="Eliminar objeto"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* RENDER ACCORDING TO TYPE */}
              {obj.type === 'math' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 min-w-[260px] max-w-md">
                  {/* KaTeX Math Display */}
                  <div className="text-slate-900 text-lg font-serif py-1 flex items-center justify-center">
                    <MathView latex={(obj as MathBoardObject).latex} displayMode />
                  </div>

                  {/* Solutions display if solved */}
                  {(obj as MathBoardObject).solutions && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                        Solución determinista
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-xs font-semibold text-slate-800">
                        {(obj as MathBoardObject).solutions!.map((sol, idx) => (
                          <span
                            key={idx}
                            className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200"
                          >
                            x = {sol}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contextual Action Bar */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSolveMath(obj as MathBoardObject);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors"
                      title="Resolver ecuación con SymPy"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Resolver</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowSteps(obj as MathBoardObject);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                      title="Ver pasos de resolución"
                    >
                      <ListOrdered className="w-3 h-3" />
                      <span>Pasos</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDerivative(obj as MathBoardObject);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                      title="Calcular derivada d/dx"
                    >
                      <Divide className="w-3 h-3" />
                      <span>d/dx</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleIntegral(obj as MathBoardObject);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                      title="Calcular integral indefinida"
                    >
                      <span>∫</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGraphFromMath(obj as MathBoardObject);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
                      title="Graficar en 2D"
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>Graficar</span>
                    </button>
                  </div>
                </div>
              )}

              {obj.type === 'graph' && <GraphCard graph={obj as GraphBoardObject} />}

              {obj.type === 'geometry' && <GeometryCard geo={obj as GeometryBoardObject} />}

              {obj.type === 'physics' && <PhysicsCard physicsObj={obj as PhysicsBoardObject} />}
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Meta Badge */}
      <div className="fixed bottom-4 left-4 z-40 bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-3 text-xs text-slate-500 font-mono">
        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Fases 1–8 Activas</span>
        </span>
        <span className="text-slate-300">|</span>
        <span>Objetos: {objects.length}</span>
        <span className="text-slate-300">|</span>
        <span>Pos: ({Math.round(viewport.x)}, {Math.round(viewport.y)})</span>
      </div>

      {/* Math Editor Modal */}
      <MathEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleAddMathObject}
      />

      {/* Step by step Viewer Modal */}
      <StepsModal
        isOpen={stepsModal.open}
        expression={stepsModal.expr}
        steps={stepsModal.steps}
        onClose={() => setStepsModal({ open: false, expr: '', steps: [] })}
      />
    </div>
  );
}
