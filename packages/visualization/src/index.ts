import type { GraphBoardObject } from '@mathboard/shared';

export * from './graph3d';

export interface PlotDataPoint {
  x: number;
  y: number;
}

export interface PlotSeries {
  name: string;
  points: PlotDataPoint[];
  color?: string;
  type?: 'line' | 'scatter';
}

export interface GraphRenderSpec {
  title?: string;
  xDomain: [number, number];
  yDomain?: [number, number];
  series: PlotSeries[];
  roots?: number[];
  extrema?: { x: number; y: number; type: 'min' | 'max' }[];
  annotations?: {
    x: number;
    y: number;
    text: string;
  }[];
}

/**
 * Clean deterministic function evaluator for standard polynomials and elementary functions
 */
export function evaluateFunctionAt(rawExpr: string, x: number): number {
  try {
    // Sanitize and replace math expressions for JS evaluation
    let sanitized = rawExpr
      .replace(/\s+/g, '')
      .replace(/\^/g, '**')
      .replace(/(\d)([a-zA-Z])/g, '$1*$2') // 2x -> 2*x
      .replace(/([a-zA-Z])(\d)/g, '$1*$2')
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/log/g, 'Math.log')
      .replace(/ln/g, 'Math.log')
      .replace(/exp/g, 'Math.exp')
      .replace(/pi/g, 'Math.PI');

    // Remove "=0" or "y=" or "f(x)=" if present
    if (sanitized.includes('=')) {
      const parts = sanitized.split('=');
      sanitized = parts[1] || parts[0];
    }

    const fn = new Function('x', `return ${sanitized};`);
    const val = fn(x);
    return isFinite(val) ? val : NaN;
  } catch {
    return NaN;
  }
}

/**
 * Sample a mathematical function over a continuous domain [xMin, xMax]
 */
export function sampleFunction(
  expression: string,
  domain: [number, number],
  sampleCount = 200
): PlotDataPoint[] {
  const points: PlotDataPoint[] = [];
  const [minX, maxX] = domain;
  const step = (maxX - minX) / sampleCount;

  for (let i = 0; i <= sampleCount; i++) {
    const x = minX + i * step;
    const y = evaluateFunctionAt(expression, x);
    if (!isNaN(y) && isFinite(y)) {
      points.push({ x, y });
    }
  }

  return points;
}

/**
 * Detect real roots numerically by sign change bisection
 */
export function findRootsInDomain(
  expression: string,
  domain: [number, number],
  subdivisions = 100
): number[] {
  const roots: number[] = [];
  const [minX, maxX] = domain;
  const step = (maxX - minX) / subdivisions;

  let prevX = minX;
  let prevY = evaluateFunctionAt(expression, prevX);

  for (let i = 1; i <= subdivisions; i++) {
    const currX = minX + i * step;
    const currY = evaluateFunctionAt(expression, currX);

    // Exact zero
    if (Math.abs(currY) < 1e-7) {
      roots.push(Number(currX.toFixed(4)));
    } else if (prevY * currY < 0) {
      // Sign change -> bisect
      let left = prevX;
      let right = currX;
      for (let iter = 0; iter < 20; iter++) {
        const mid = (left + right) / 2;
        const midY = evaluateFunctionAt(expression, mid);
        if (Math.abs(midY) < 1e-6) {
          left = mid;
          break;
        }
        if (prevY * midY < 0) {
          right = mid;
        } else {
          left = mid;
        }
      }
      roots.push(Number(left.toFixed(4)));
    }

    prevX = currX;
    prevY = currY;
  }

  // Remove duplicates within tolerance
  return roots.filter((val, index, arr) => index === 0 || Math.abs(val - arr[index - 1]) > 0.01);
}

export function createGraphSpecFromObject(graphObj: GraphBoardObject): GraphRenderSpec {
  const points = sampleFunction(graphObj.expression, graphObj.domain);
  const roots = graphObj.showRoots ? findRootsInDomain(graphObj.expression, graphObj.domain) : [];

  return {
    title: `f(${graphObj.variable}) = ${graphObj.expression}`,
    xDomain: graphObj.domain,
    roots,
    series: [
      {
        name: graphObj.expression,
        points,
        color: graphObj.color || '#4f46e5',
        type: 'line',
      },
    ],
  };
}
