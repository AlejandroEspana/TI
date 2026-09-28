import { describe, it, expect } from 'vitest';
import { sampleSurface3D, project3DTo2D } from '../src/graph3d';

describe('3D Graph Surface Engine', () => {
  it('samples a 3D paraboloid z = x^2 + y^2 accurately', () => {
    const mesh = sampleSurface3D('x^2 + y^2', [-2, 2], [-2, 2], 10);
    expect(mesh.grid.length).toBe(11);
    expect(mesh.grid[0].length).toBe(11);
    expect(mesh.zMin).toBeCloseTo(0, 1);
    expect(mesh.zMax).toBeCloseTo(8, 1);
  });

  it('projects 3D points to 2D screen coordinates with depth', () => {
    const pt = { x: 0, y: 0, z: 5 };
    const center = { x: 150, y: 150 };
    const proj = project3DTo2D(pt, 0, 0, 20, center);

    expect(proj.x).toBe(150);
    expect(proj.y).toBe(50); // screenY = 150 - 5 * 20 = 50
  });
});
