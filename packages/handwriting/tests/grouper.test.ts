import { describe, it, expect } from 'vitest';
import { SpatialStrokeGrouper } from '../src/grouper';

describe('SpatialStrokeGrouper (Multi-Line Expression Segmentation)', () => {
  it('groups strokes on the same horizontal line together', () => {
    // 2 strokes on line 1: (10, 50) and (40, 50)
    const s1 = [{ x: 10, y: 50, time: 10 }, { x: 30, y: 50, time: 20 }];
    const s2 = [{ x: 40, y: 50, time: 30 }, { x: 60, y: 50, time: 40 }];

    const clusters = SpatialStrokeGrouper.groupStrokes([s1, s2]);
    expect(clusters.length).toBe(1);
    expect(clusters[0].strokes.length).toBe(2);
  });

  it('separates strokes written on distinct vertical lines', () => {
    // Line 1 (Y ~ 50): 2x^2
    const line1_s1 = [{ x: 50, y: 40, time: 10 }, { x: 70, y: 60, time: 20 }];
    const line1_s2 = [{ x: 80, y: 40, time: 30 }, { x: 100, y: 60, time: 40 }];

    // Line 2 (Y ~ 150): a = 2
    const line2_s1 = [{ x: 50, y: 140, time: 50 }, { x: 70, y: 160, time: 60 }];
    const line2_s2 = [{ x: 80, y: 140, time: 70 }, { x: 100, y: 160, time: 80 }];

    const clusters = SpatialStrokeGrouper.groupStrokes([line1_s1, line1_s2, line2_s1, line2_s2]);
    expect(clusters.length).toBe(2);
    // Line 1 should have 2 strokes, Line 2 should have 2 strokes
    expect(clusters[0].strokes.length).toBe(2);
    expect(clusters[1].strokes.length).toBe(2);
  });
});
