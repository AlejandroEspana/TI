import { describe, it, expect } from 'vitest';
import { Vector2D, GeometryMath } from '../src/index';

describe('Computational Geometry Engine', () => {
  it('computes vector magnitude and dot product accurately', () => {
    const v1 = new Vector2D(3, 4);
    expect(v1.magnitude).toBe(5);

    const v2 = new Vector2D(1, 0);
    expect(v1.dot(v2)).toBe(3);
  });

  it('normalizes vector to unit length', () => {
    const v = new Vector2D(0, 10);
    const unit = v.normalize();
    expect(unit.x).toBe(0);
    expect(unit.y).toBe(1);
    expect(unit.magnitude).toBeCloseTo(1.0);
  });

  it('calculates polygon area using Shoelace formula', () => {
    // 4x4 square: (0,0), (4,0), (4,4), (0,4) -> area = 16
    const square = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ];
    expect(GeometryMath.polygonArea(square)).toBe(16);
  });

  it('detects intersection between two non-parallel line segments', () => {
    // Line 1: (0, 0) to (4, 4) -> y = x
    // Line 2: (0, 4) to (4, 0) -> y = 4 - x
    // Intersection at (2, 2)
    const p = GeometryMath.lineIntersection(
      { x: 0, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
      { x: 4, y: 0 }
    );
    expect(p).not.toBeNull();
    expect(p?.x).toBeCloseTo(2);
    expect(p?.y).toBeCloseTo(2);
  });
});
