/**
 * 3D Cartesian Surface Grid Sampler and Orbital Projection Engine
 */

export interface Surface3DPoint {
  x: number;
  y: number;
  z: number;
}

export interface Surface3DMesh {
  grid: Surface3DPoint[][];
  xDomain: [number, number];
  yDomain: [number, number];
  zMin: number;
  zMax: number;
}

export function evaluateFunction3D(expr: string, x: number, y: number): number {
  try {
    let sanitized = expr
      .replace(/\s+/g, '')
      .replace(/\^/g, '**')
      .replace(/(\d)([a-zA-Z])/g, '$1*$2')
      .replace(/([a-zA-Z])(\d)/g, '$1*$2')
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/exp/g, 'Math.exp')
      .replace(/pi/g, 'Math.PI');

    if (sanitized.includes('=')) {
      sanitized = sanitized.split('=')[1] || sanitized.split('=')[0];
    }

    const fn = new Function('x', 'y', `return ${sanitized};`);
    const val = fn(x, y);
    return isFinite(val) ? val : 0;
  } catch {
    return 0;
  }
}

export function sampleSurface3D(
  expression: string,
  xDomain: [number, number] = [-3, 3],
  yDomain: [number, number] = [-3, 3],
  resolution = 20
): Surface3DMesh {
  const grid: Surface3DPoint[][] = [];
  const [xMin, xMax] = xDomain;
  const [yMin, yMax] = yDomain;

  const dx = (xMax - xMin) / resolution;
  const dy = (yMax - yMin) / resolution;

  let zMin = Infinity;
  let zMax = -Infinity;

  for (let i = 0; i <= resolution; i++) {
    const row: Surface3DPoint[] = [];
    const x = xMin + i * dx;
    for (let j = 0; j <= resolution; j++) {
      const y = yMin + j * dy;
      const z = evaluateFunction3D(expression, x, y);

      if (z < zMin) zMin = z;
      if (z > zMax) zMax = z;

      row.push({ x, y, z });
    }
    grid.push(row);
  }

  if (!isFinite(zMin) || !isFinite(zMax) || zMin === zMax) {
    zMin = -5;
    zMax = 5;
  }

  return { grid, xDomain, yDomain, zMin, zMax };
}

/**
 * 3D to 2D Orbital Camera Projection
 * @param pt 3D point (x, y, z)
 * @param theta Azimuth angle in radians (horizontal orbit)
 * @param phi Elevation angle in radians (vertical orbit)
 * @param scale Pixels per unit
 * @param center Screen viewport center (cx, cy)
 */
export function project3DTo2D(
  pt: Surface3DPoint,
  theta: number,
  phi: number,
  scale: number,
  center: { x: number; y: number }
): { x: number; y: number; depth: number } {
  // 1. Rotate around Z axis (azimuth)
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const x1 = pt.x * cosT - pt.y * sinT;
  const y1 = pt.x * sinT + pt.y * cosT;
  const z1 = pt.z;

  // 2. Rotate around X axis (elevation)
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const y2 = y1 * cosP - z1 * sinP;
  const z2 = y1 * sinP + z1 * cosP;

  // 3. Isometric / weak perspective projection
  const screenX = center.x + x1 * scale;
  const screenY = center.y - z2 * scale; // Invert Y for screen coords

  return {
    x: screenX,
    y: screenY,
    depth: y2,
  };
}
