import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ObjectManager,
  CommandHistory,
  AddObjectCommand,
  MoveObjectCommand,
  DeleteObjectCommand,
  CoordinateManager,
  type CanvasRect,
  BoardScope,
  type Viewport,
} from '@mathboard/core';
import type {
  BoardObject,
  MathBoardObject,
  GraphBoardObject,
  GeometryBoardObject,
  PhysicsBoardObject,
  Graph3DBoardObject,
  ExerciseBoardObject,
  MathStep,
} from '@mathboard/shared';
import {
  MathematicalStrokeRecognizer,
  StrikethroughDetector,
  SpatialStrokeGrouper,
  TemplateStore,
  type StrokePoint,
  type TargetBounds,
  type StrokeCluster,
} from '@mathboard/handwriting';
import { CanvasToolbar, type ToolMode } from './CanvasToolbar';
import { MathView } from './MathView';
import { MathEditorModal } from './MathEditorModal';
import { GraphCard } from './GraphCard';
import { GeometryCard } from './GeometryCard';
import { PhysicsCard } from './PhysicsCard';
import { Graph3DCard } from './Graph3DCard';
import { ExerciseCard } from './ExerciseCard';
import { StepsModal } from './StepsModal';
import { HandwritingCalibrationModal } from './HandwritingCalibrationModal';
import { VariableScopePanel } from './VariableScopePanel';
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
  Trash2,
  Loader2,
} from 'lucide-react';

type WritingLifecycle =
  | 'IDLE'
  | 'WRITING'
  | 'WAITING_FOR_PAUSE'
  | 'INTERPRETING'
  | 'DIGITALIZING';

export function MathBoardCanvas() {
  const [viewport, setViewport] = useState<Viewport>({ x: 100, y: 100, zoom: 1.0 });
  const [currentTool, setCurrentTool] = useState<ToolMode>('pencil');
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Variables Scope
  const scopeRef = useRef<BoardScope>(new BoardScope({ a: 2, b: -3, m: 2 }));
  const [variables, setVariables] = useState<Record<string, number | string>>({ a: 2, b: -3, m: 2 });
  const [showVariables, setShowVariables] = useState(false);

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [calibrationOpen, setCalibrationOpen] = useState(false);
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

  // Interaction refs for panning & dragging
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const draggingIdRef = useRef<string | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const initialObjPosRef = useRef({ x: 0, y: 0 });

  // Native In-Canvas Handwriting Engine state
  const containerRef = useRef<HTMLDivElement>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement>(null);
  const [writingState, setWritingState] = useState<WritingLifecycle>('IDLE');
  const [inkStrokes, setInkStrokes] = useState<StrokePoint[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<StrokePoint[]>([]);
  const isDrawingInkRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeInterpretingClusters, setActiveInterpretingClusters] = useState<StrokeCluster[]>([]);
  const [strikethroughFlashId, setStrikethroughFlashId] = useState<string | null>(null);

  const syncState = useCallback(() => {
    setObjects(managerRef.current.getAllObjects());
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
  }, []);

  // Centralized Coordinate Helpers
  const getCanvasRect = useCallback((): CanvasRect | undefined => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return undefined;
    const r = canvas.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }, []);

  const screenToBoard = useCallback(
    (screenPt: { clientX: number; clientY: number }) => {
      return CoordinateManager.screenToBoard(screenPt, viewport, getCanvasRect());
    },
    [viewport, getCanvasRect]
  );

  // Listen to scope changes
  useEffect(() => {
    const unsub = scopeRef.current.subscribe((vars) => {
      setVariables({ ...vars });
    });
    return unsub;
  }, []);

  // Initial demo setup
  useEffect(() => {
    const manager = managerRef.current;

    // 1. Initial Math Equation Object (Borderless paper typography)
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

    // 3. Initial 3D Surface Object (Fase 9)
    const initial3D: Graph3DBoardObject = {
      id: 'graph3d-init',
      type: 'graph3d',
      expression: 'x^2 - y^2',
      xDomain: [-3, 3],
      yDomain: [-3, 3],
      rotation: { theta: 0.8, phi: 0.5 },
      position: { x: 880, y: 80 },
    };
    manager.addObject(initial3D);

    // 4. Initial Geometry Object (Vector)
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

    // 5. Initial Physics Simulation Object
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

    // 6. Initial Educational Challenge Card (Fase 11)
    const initialExercise: ExerciseBoardObject = {
      id: 'exercise-init',
      type: 'exercise',
      title: 'Factorización de Polinomios',
      topic: 'algebra',
      problemStatement: 'Factoriza la diferencia de cuadrados: x² - 9',
      expectedAnswer: '(x - 3)*(x + 3)',
      hint: 'Aplica la regla a² - b² = (a - b)(a + b) con b = 3',
      position: { x: 880, y: 390 },
    };
    manager.addObject(initialExercise);

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
      else if (e.key === 'w') setCurrentTool('pencil');
      else if (e.key === 'm') setEditorOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Configure HiDPI Canvas on resize and mount
  useEffect(() => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return;
    const handleResize = () => {
      CoordinateManager.setupHiDPICanvas(
        canvas,
        window.innerWidth,
        window.innerHeight,
        (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1
      );
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redraw native ink strokes aligned with world viewport with high subpixel precision
  useEffect(() => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = [...inkStrokes, ...(currentStroke.length > 0 ? [currentStroke] : [])];
    if (allStrokes.length === 0) return;

    // Ink style: crisp dark slate ink with smooth rounded caps
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = Math.max(2.4, 3.2 * viewport.zoom);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of allStrokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      // Transform world coords to screen
      const startScreen = CoordinateManager.boardToScreen(stroke[0], viewport);
      ctx.moveTo(startScreen.x, startScreen.y);

      for (let i = 1; i < stroke.length; i++) {
        const ptScreen = CoordinateManager.boardToScreen(stroke[i], viewport);
        ctx.lineTo(ptScreen.x, ptScreen.y);
      }
      ctx.stroke();
    }
  }, [inkStrokes, currentStroke, viewport]);

  // Delete Object with Command
  const handleDeleteObject = useCallback((id: string) => {
    const cmd = new DeleteObjectCommand(managerRef.current, id);
    historyRef.current.execute(cmd);
    if (selectedId === id) setSelectedId(null);
    syncState();
  }, [selectedId, syncState]);

  // Digitalization & Interpretation Process (fired by 2-second inactivity debounce)
  const processPendingInkStrokes = useCallback(() => {
    if (inkStrokes.length === 0) {
      setWritingState('IDLE');
      return;
    }

    // Step A: Check for Strikethrough (Tachado Gesture) to delete existing objects
    const allObjects = managerRef.current.getAllObjects();
    const targets: TargetBounds[] = allObjects.map((obj) => {
      let width = 180;
      let height = 45;
      if (obj.type === 'math') {
        width = Math.max(120, (obj as MathBoardObject).latex.length * 15);
        height = 45;
      }
      return {
        id: obj.id,
        bbox: {
          minX: obj.position.x,
          maxX: obj.position.x + width,
          minY: obj.position.y,
          maxY: obj.position.y + height,
          width,
          height,
          centerX: obj.position.x + width / 2,
          centerY: obj.position.y + height / 2,
        },
      };
    });

    const lastStroke = inkStrokes[inkStrokes.length - 1];
    if (lastStroke && lastStroke.length >= 2) {
      const strikeMatch = StrikethroughDetector.detectStrikethrough(lastStroke, targets);
      if (strikeMatch.isStrikethrough && strikeMatch.targetId) {
        // Strikethrough recognized!
        setStrikethroughFlashId(strikeMatch.targetId);
        setTimeout(() => {
          handleDeleteObject(strikeMatch.targetId!);
          setStrikethroughFlashId(null);
          setInkStrokes([]);
          setWritingState('IDLE');
        }, 350);
        return;
      }
    }

    // Step B: Spatial Grouping of strokes into lines/expressions
    const clusters = SpatialStrokeGrouper.groupStrokes(inkStrokes);
    if (clusters.length === 0) {
      setWritingState('IDLE');
      return;
    }

    setWritingState('INTERPRETING');
    setActiveInterpretingClusters(clusters);

    // Progressive recognition delay (~350ms) to communicate intelligence
    setTimeout(() => {
      const activeProfileId = TemplateStore.getInstance().getActiveProfile().id;

      for (const cluster of clusters) {
        const { latex } = MathematicalStrokeRecognizer.recognizeStrokesToLatex(
          cluster.strokes,
          activeProfileId
        );
        if (!latex) continue;

        // Check if expression is an assignment: e.g. a = 5
        const assignment = BoardScope.parseAssignment(latex);
        if (assignment) {
          scopeRef.current.setVariable(assignment.variable, assignment.value);
        }

        const newObj: MathBoardObject = {
          id: `math-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'math',
          latex,
          source: 'handwriting',
          semanticType: assignment ? 'equation' : 'expression',
          variable: 'x',
          position: { x: cluster.bbox.minX, y: cluster.bbox.minY },
          originalStrokes: cluster.strokes,
        };

        const cmd = new AddObjectCommand(managerRef.current, newObj);
        historyRef.current.execute(cmd);
      }

      syncState();
      setWritingState('DIGITALIZING');

      // Cross-fade finish
      setTimeout(() => {
        setInkStrokes([]);
        setActiveInterpretingClusters([]);
        setWritingState('IDLE');
      }, 300);
    }, 380);
  }, [inkStrokes, handleDeleteObject, syncState]);

  // Restart 2-second debounce timer whenever user stops writing
  const handleStrokeCompleted = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setWritingState('WAITING_FOR_PAUSE');
    debounceTimerRef.current = setTimeout(() => {
      processPendingInkStrokes();
    }, 2000);
  }, [processPendingInkStrokes]);

  // Pointer Events Handlers (Handles Mouse, Pen/Stylus, Touch uniformly with capture)
  const handlePointerDown = (e: React.PointerEvent) => {
    // If clicking on interactive UI (buttons, inputs, toolbar, modals, context menu), do not intercept
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('[data-ui="true"]') ||
        target.closest('.canvas-toolbar') ||
        target.closest('.canvas-ui'))
    ) {
      return;
    }

    if (e.button === 1 || currentTool === 'pan') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - viewport.x, y: e.clientY - viewport.y };
      setSelectedId(null);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      return;
    }

    if (currentTool === 'pencil' && e.button === 0) {
      isDrawingInkRef.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      const worldPt = screenToBoard({ clientX: e.clientX, clientY: e.clientY });
      const pt: StrokePoint = { x: worldPt.x, y: worldPt.y, time: Date.now() };
      setCurrentStroke([pt]);
      setWritingState('WRITING');
      setSelectedId(null);
      return;
    }

    if (currentTool === 'select' && e.target === e.currentTarget) {
      setSelectedId(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      setViewport((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      }));
    } else if (isDrawingInkRef.current) {
      const nativeEvent = e.nativeEvent as PointerEvent;
      const coalesced = typeof nativeEvent.getCoalescedEvents === 'function'
        ? nativeEvent.getCoalescedEvents()
        : [e];

      const newPts: StrokePoint[] = [];
      for (const ce of coalesced) {
        const worldPt = screenToBoard({ clientX: ce.clientX, clientY: ce.clientY });
        newPts.push({ x: worldPt.x, y: worldPt.y, time: Date.now() });
      }

      setCurrentStroke((prev) => [...prev, ...newPts]);
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

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (isPanningRef.current) {
      isPanningRef.current = false;
    }
    if (isDrawingInkRef.current) {
      isDrawingInkRef.current = false;
      if (currentStroke.length > 1) {
        const updated = [...inkStrokes, currentStroke];
        setInkStrokes(updated);
        setCurrentStroke([]);
        handleStrokeCompleted();
      } else {
        setCurrentStroke([]);
      }
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
  const handleObjectDragStart = (e: React.PointerEvent, obj: BoardObject) => {
    if (currentTool === 'pencil' || currentTool === 'pan') return;
    e.stopPropagation();
    setSelectedId(obj.id);
    draggingIdRef.current = obj.id;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    initialObjPosRef.current = { ...obj.position };
  };

  // Add Math Object from Modal
  const handleAddMathObject = (latex: string) => {
    const centerWorld = screenToBoard({ x: window.innerWidth / 2, y: window.innerHeight / 2 } as any);

    const assignment = BoardScope.parseAssignment(latex);
    if (assignment) {
      scopeRef.current.setVariable(assignment.variable, assignment.value);
    }

    const newMath: MathBoardObject = {
      id: `math-${Date.now()}`,
      type: 'math',
      latex,
      source: 'keyboard',
      semanticType: assignment ? 'equation' : 'expression',
      variable: 'x',
      position: { x: centerWorld.x, y: centerWorld.y },
    };
    const cmd = new AddObjectCommand(managerRef.current, newMath);
    historyRef.current.execute(cmd);
    syncState();
  };

  // Add 3D Graph Object (Fase 9)
  const handleAddGraph3D = () => {
    const centerWorld = screenToBoard({ x: window.innerWidth / 2, y: window.innerHeight / 2 } as any);
    const new3D: Graph3DBoardObject = {
      id: `graph3d-${Date.now()}`,
      type: 'graph3d',
      expression: 'x^2 + y^2',
      xDomain: [-3, 3],
      yDomain: [-3, 3],
      rotation: { theta: 0.8, phi: 0.5 },
      position: { x: centerWorld.x - 160, y: centerWorld.y - 110 },
    };
    const cmd = new AddObjectCommand(managerRef.current, new3D);
    historyRef.current.execute(cmd);
    syncState();
  };

  // Add Educational Exercise Card (Fase 11)
  const handleAddExercise = () => {
    const centerWorld = screenToBoard({ x: window.innerWidth / 2, y: window.innerHeight / 2 } as any);
    const newEx: ExerciseBoardObject = {
      id: `exercise-${Date.now()}`,
      type: 'exercise',
      title: 'Derivada de una Función',
      topic: 'calculus',
      problemStatement: 'Calcula la derivada d/dx de: f(x) = 3x² + 4x',
      expectedAnswer: '6*x + 4',
      hint: 'Aplica la regla de la potencia: d/dx(x^n) = n*x^(n-1)',
      position: { x: centerWorld.x - 160, y: centerWorld.y - 100 },
    };
    const cmd = new AddObjectCommand(managerRef.current, newEx);
    historyRef.current.execute(cmd);
    syncState();
  };

  // Add Graph Object
  const handleAddGraph = () => {
    const centerWorld = screenToBoard({ x: window.innerWidth / 2, y: window.innerHeight / 2 } as any);
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
    const centerWorld = screenToBoard({ x: window.innerWidth / 2, y: window.innerHeight / 2 } as any);
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
    const centerWorld = screenToBoard({ x: window.innerWidth / 2, y: window.innerHeight / 2 } as any);
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
      const substituted = scopeRef.current.substituteVariables(mathObj.latex);
      const res = await solveEquation(substituted, mathObj.variable || 'x');
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
      const substituted = scopeRef.current.substituteVariables(mathObj.latex);
      const res = await fetchSteps(substituted, mathObj.variable || 'x');
      setStepsModal({ open: true, expr: mathObj.latex, steps: res.steps });
    } catch (err: unknown) {
      alert(`Error en pasos: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDerivative = async (mathObj: MathBoardObject) => {
    try {
      const substituted = scopeRef.current.substituteVariables(mathObj.latex);
      const res = await fetchDerivative(substituted, mathObj.variable || 'x');
      const newObj: MathBoardObject = {
        id: `math-diff-${Date.now()}`,
        type: 'math',
        latex: `\\frac{d}{dx}\\left(${mathObj.latex}\\right) = ${res.latex_result}`,
        source: 'keyboard',
        semanticType: 'derivative',
        position: { x: mathObj.position.x, y: mathObj.position.y + 60 },
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
      const substituted = scopeRef.current.substituteVariables(mathObj.latex);
      const res = await fetchIntegral(substituted, mathObj.variable || 'x');
      const newObj: MathBoardObject = {
        id: `math-int-${Date.now()}`,
        type: 'math',
        latex: `\\int \\left(${mathObj.latex}\\right) dx = ${res.latex_result}`,
        source: 'keyboard',
        semanticType: 'integral',
        position: { x: mathObj.position.x, y: mathObj.position.y + 60 },
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
    const substituted = scopeRef.current.substituteVariables(cleanExpr);

    const newGraph: GraphBoardObject = {
      id: `graph-from-${Date.now()}`,
      type: 'graph',
      expression: substituted,
      variable: mathObj.variable || 'x',
      domain: [-6, 6],
      showRoots: true,
      color: '#2563eb',
      position: { x: mathObj.position.x + 280, y: mathObj.position.y },
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
      setCurrentTool('pencil');
    } else if (tool === 'graph3d') {
      handleAddGraph3D();
      setCurrentTool('pencil');
    } else if (tool === 'exercise') {
      handleAddExercise();
      setCurrentTool('pencil');
    } else if (tool === 'geometry') {
      handleAddGeometry();
      setCurrentTool('pencil');
    } else if (tool === 'physics') {
      handleAddPhysics();
      setCurrentTool('pencil');
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
    if (confirm('¿Deseas limpiar todo el contenido del tablero?')) {
      managerRef.current.clear();
      setInkStrokes([]);
      setCurrentStroke([]);
      syncState();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-screen h-screen overflow-hidden select-none bg-white touch-none ${
        currentTool === 'pencil' ? 'cursor-crosshair' : currentTool === 'pan' ? 'cursor-grab' : 'cursor-default'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
        onToggleVariables={() => setShowVariables((prev) => !prev)}
        onOpenCalibration={() => setCalibrationOpen(true)}
        variablesCount={Object.keys(variables).length}
        zoom={viewport.zoom}
      />

      {/* Infinite White Canvas Layer with Subtle Dot Grid */}
      <div
        className="absolute inset-0 canvas-dot-grid pointer-events-none"
        style={{
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
        }}
      />

      {/* Native Ink HTML5 Canvas Layer (HiDPI synced with viewport) */}
      <canvas
        ref={inkCanvasRef}
        className="absolute inset-0 pointer-events-none z-10 block"
      />

      {/* Progressive Recognition Indicators (Interpretando... status badge) */}
      {writingState === 'INTERPRETING' && (
        <div
          className="absolute z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/90 text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm animate-pulse"
          style={{
            transform: `translate(${
              (activeInterpretingClusters[0]?.bbox.centerX || 100) * viewport.zoom + viewport.x - 45
            }px, ${
              (activeInterpretingClusters[0]?.bbox.minY || 100) * viewport.zoom + viewport.y - 30
            }px)`,
          }}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Interpretando...</span>
        </div>
      )}

      {/* Transformed Objects Container */}
      <div
        className="absolute origin-top-left z-10"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {objects.map((obj) => {
          const isSelected = selectedId === obj.id;
          const isHovered = hoveredId === obj.id;
          const isFlashingStrike = strikethroughFlashId === obj.id;

          return (
            <div
              key={obj.id}
              onMouseEnter={() => setHoveredId(obj.id)}
              onMouseLeave={() => setHoveredId(null)}
              onPointerDown={(e) => handleObjectDragStart(e, obj)}
              style={{
                transform: `translate(${obj.position.x}px, ${obj.position.y}px)`,
                cursor: currentTool === 'pan' ? 'grab' : currentTool === 'pencil' ? 'crosshair' : 'move',
              }}
              className={`absolute group transition-all duration-200 ${
                isFlashingStrike ? 'opacity-30 scale-95 transition-all duration-300' : ''
              }`}
            >
              {/* RENDER MATHEMATICAL EXPRESSIONS: Clean Paper Typography without cards or boxes */}
              {obj.type === 'math' && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(obj.id);
                  }}
                  className={`relative inline-block py-1 px-2.5 rounded-xl transition-all duration-150 ${
                    isSelected ? 'bg-indigo-50/70 ring-1 ring-indigo-400/40 shadow-sm' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Strikethrough visual line animation if targeted by strikethrough gesture */}
                  {isFlashingStrike && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-rose-500 rounded-full animate-in zoom-in-95 duration-200 shadow-md shadow-rose-500/50" />
                  )}

                  {/* Pure mathematical typography on canvas paper */}
                  <div className="text-2xl font-serif text-slate-900 leading-normal tracking-wide">
                    <MathView latex={(obj as MathBoardObject).latex} displayMode={false} />
                  </div>

                  {/* Inline Deterministic Solution underneath if solved */}
                  {(obj as MathBoardObject).solutions && (
                    <div className="mt-1 font-mono text-sm font-semibold text-emerald-700 flex items-center gap-1.5 animate-in fade-in duration-200">
                      <span className="text-xs text-emerald-500">⇒</span>
                      {(obj as MathBoardObject).solutions!.map((sol, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200 text-xs">
                          x = {sol}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Ephemeral Contextual Floating Action Pill (Revealed only on click / hover) */}
                  {(isSelected || isHovered) && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -top-11 left-0 z-30 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl p-1 flex items-center gap-1 text-[11px] animate-in fade-in slide-in-from-bottom-2 duration-150 whitespace-nowrap"
                    >
                      <button
                        onClick={() => handleSolveMath(obj as MathBoardObject)}
                        className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold transition-colors"
                        title="Resolver con SymPy"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Resolver</span>
                      </button>

                      <button
                        onClick={() => handleShowSteps(obj as MathBoardObject)}
                        className="flex items-center gap-1 px-2 py-1 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors"
                        title="Pasos de resolución"
                      >
                        <ListOrdered className="w-3 h-3" />
                        <span>Pasos</span>
                      </button>

                      <button
                        onClick={() => handleDerivative(obj as MathBoardObject)}
                        className="px-2 py-1 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors"
                        title="Derivada d/dx"
                      >
                        <Divide className="w-3 h-3 inline mr-0.5" />
                        <span>d/dx</span>
                      </button>

                      <button
                        onClick={() => handleIntegral(obj as MathBoardObject)}
                        className="px-2 py-1 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors"
                        title="Integral indefinida"
                      >
                        <span>∫</span>
                      </button>

                      <button
                        onClick={() => handleGraphFromMath(obj as MathBoardObject)}
                        className="flex items-center gap-1 px-2 py-1 hover:bg-blue-50 text-blue-700 rounded-lg font-medium transition-colors"
                        title="Graficar en 2D"
                      >
                        <TrendingUp className="w-3 h-3" />
                        <span>Graficar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteObject(obj.id)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors ml-0.5"
                        title="Tachar / Eliminar expresión"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* RENDER OTHER SIMULATION WIDGETS */}
              {obj.type === 'graph' && (
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteObject(obj.id);
                    }}
                    className="absolute -top-2.5 -right-2.5 z-20 w-6 h-6 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full border border-slate-200 shadow-sm flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar gráfica"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <GraphCard graph={obj as GraphBoardObject} />
                </div>
              )}

              {obj.type === 'graph3d' && (
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteObject(obj.id);
                    }}
                    className="absolute -top-2.5 -right-2.5 z-20 w-6 h-6 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full border border-slate-200 shadow-sm flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar 3D"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <Graph3DCard graph3d={obj as Graph3DBoardObject} />
                </div>
              )}

              {obj.type === 'geometry' && (
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteObject(obj.id);
                    }}
                    className="absolute -top-2.5 -right-2.5 z-20 w-6 h-6 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full border border-slate-200 shadow-sm flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar geometría"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <GeometryCard geo={obj as GeometryBoardObject} />
                </div>
              )}

              {obj.type === 'physics' && (
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteObject(obj.id);
                    }}
                    className="absolute -top-2.5 -right-2.5 z-20 w-6 h-6 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full border border-slate-200 shadow-sm flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar física"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <PhysicsCard physicsObj={obj as PhysicsBoardObject} />
                </div>
              )}

              {obj.type === 'exercise' && (
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteObject(obj.id);
                    }}
                    className="absolute -top-2.5 -right-2.5 z-20 w-6 h-6 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full border border-slate-200 shadow-sm flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar ejercicio"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <ExerciseCard exercise={obj as ExerciseBoardObject} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Status Indicator */}
      <div className="fixed bottom-4 left-4 z-30 bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-3 text-xs text-slate-500 font-mono">
        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Hoja Inteligente Activa</span>
        </span>
        <span className="text-slate-300">|</span>
        <span>
          Modo: {currentTool === 'pencil' ? 'Lápiz (Escritura libre)' : currentTool === 'pan' ? 'Mano (Navegación)' : 'Selección'}
        </span>
        {writingState === 'WAITING_FOR_PAUSE' && (
          <>
            <span className="text-slate-300">|</span>
            <span className="text-indigo-600 font-semibold animate-pulse">Pausa detectada (2s)...</span>
          </>
        )}
      </div>

      {/* Variable Scope Drawer Panel */}
      <VariableScopePanel
        isOpen={showVariables}
        onClose={() => setShowVariables(false)}
        variables={variables}
        onSetVariable={(name, val) => scopeRef.current.setVariable(name, val)}
        onRemoveVariable={(name) => scopeRef.current.removeVariable(name)}
      />

      {/* Handwriting Multi-Example & Profile Calibration Modal */}
      {calibrationOpen && (
        <HandwritingCalibrationModal
          isOpen={calibrationOpen}
          onClose={() => setCalibrationOpen(false)}
        />
      )}

      {/* Math Editor Modal */}
      {editorOpen && (
        <MathEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={(latex) => handleAddMathObject(latex)}
        />
      )}

      {/* Step by step Viewer Modal */}
      {stepsModal.open && (
        <StepsModal
          isOpen={stepsModal.open}
          expression={stepsModal.expr}
          steps={stepsModal.steps}
          onClose={() => setStepsModal({ open: false, expr: '', steps: [] })}
        />
      )}
    </div>
  );
}
