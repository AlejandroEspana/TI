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

export type BoardObjectType = 'text' | 'math' | 'geometry' | 'graph';

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

export interface MathObject extends BoardObject {
  type: 'math';
  latex: string;
  source: 'keyboard' | 'handwriting';
  semanticType?: MathSemanticType;
  ast?: MathASTNode;
  degree?: number;
  variable?: string;
  domain?: string;
}

export interface TextObject extends BoardObject {
  type: 'text';
  content: string;
  fontSize?: number;
  color?: string;
}

export interface GraphObject extends BoardObject {
  type: 'graph';
  sourceMathObjectId?: string;
  expression: string;
  domain: [number, number];
  showRoots?: boolean;
  showVertex?: boolean;
  showGrid?: boolean;
}

export interface MathStep {
  id: string;
  before: string;
  operation: string;
  after: string;
  value?: string | number;
  explanation?: string;
}

export interface MathSolveResponse {
  expression: string;
  semanticType: MathSemanticType;
  variable?: string;
  result: string[];
  steps?: MathStep[];
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
