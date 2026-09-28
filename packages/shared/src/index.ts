/**
 * Shared Type Definitions for MathBoard
 * Used across frontend apps and internal packages.
 */

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type BoardObjectType = 'text' | 'math' | 'geometry' | 'graph' | 'physics';

export interface BoardObject {
  id: string;
  type: BoardObjectType;
  position: Position;
  size?: Size;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export type MathSemanticType =
  | 'number'
  | 'variable'
  | 'expression'
  | 'equation'
  | 'inequality'
  | 'polynomial'
  | 'function'
  | 'derivative'
  | 'integral'
  | 'limit'
  | 'matrix'
  | 'vector'
  | 'geometry';

export interface MathASTNode {
  type: string;
  value?: string | number;
  operator?: string;
  children?: MathASTNode[];
  meta?: Record<string, unknown>;
}

export interface MathStep {
  id: string;
  stepNumber: number;
  before: string;
  operation: string;
  after: string;
  explanation: string;
}

export interface MathBoardObject extends BoardObject {
  type: 'math';
  latex: string;
  source: 'keyboard' | 'handwriting';
  semanticType?: MathSemanticType;
  ast?: MathASTNode;
  degree?: number;
  variable?: string;
  domain?: string;
  solutions?: string[];
  steps?: MathStep[];
}

export interface TextBoardObject extends BoardObject {
  type: 'text';
  content: string;
  fontSize?: number;
  color?: string;
}

export interface GraphBoardObject extends BoardObject {
  type: 'graph';
  sourceMathObjectId?: string;
  expression: string;
  variable: string;
  domain: [number, number];
  showRoots?: boolean;
  showVertex?: boolean;
  showGrid?: boolean;
  color?: string;
  roots?: number[];
  vertex?: { x: number; y: number };
}

export type GeometryFigureType = 'point' | 'segment' | 'vector' | 'circle' | 'polygon';

export interface GeometryBoardObject extends BoardObject {
  type: 'geometry';
  figureType: GeometryFigureType;
  points: Position[];
  radius?: number;
  label?: string;
  color?: string;
  properties?: {
    length?: number;
    angleDeg?: number;
    area?: number;
  };
}

export interface PhysicsBoardObject extends BoardObject {
  type: 'physics';
  mass: number;
  velocity: Position;
  acceleration: Position;
  isStatic?: boolean;
  radius?: number;
  color?: string;
  trajectory?: Position[];
  energy?: {
    kinetic: number;
    potential: number;
    total: number;
  };
}

export interface MathSolveResponse {
  expression: string;
  semanticType: MathSemanticType;
  variable: string;
  result: string[];
  latex_result: string[];
  steps?: MathStep[];
}

export interface CalculusResponse {
  expression: string;
  operation: 'derivative' | 'integral' | 'limit';
  variable: string;
  result: string;
  latex_result: string;
  steps?: MathStep[];
}

export interface MatrixResponse {
  operation: string;
  result: (number | string)[][];
  determinant?: number | string;
  latex_result: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  services: {
    math_engine: 'available' | 'degraded';
    sympy_version?: string;
  };
}
