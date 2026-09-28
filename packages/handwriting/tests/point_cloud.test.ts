import { describe, it, expect } from 'vitest';
import { PointCloud } from '../src/point_cloud';

describe('PointCloud $P Core Engine', () => {
  it('resamples a line into exact N equidistant points', () => {
    const rawLine = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const resampled = PointCloud.resample(rawLine, 32);
    expect(resampled.length).toBe(32);
    expect(resampled[0].x).toBeCloseTo(0);
    expect(resampled[31].x).toBeCloseTo(100);
    // Check spacing
    const step = 100 / 31;
    expect(resampled[1].x).toBeCloseTo(step);
    expect(resampled[15].x).toBeCloseTo(15 * step);
  });

  it('normalizes points centering centroid at (0, 0)', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
    ];
    const normalized = PointCloud.normalize(points);
    let sumX = 0, sumY = 0;
    for (const p of normalized) {
      sumX += p.x;
      sumY += p.y;
    }
    expect(sumX / normalized.length).toBeCloseTo(0, 5);
    expect(sumY / normalized.length).toBeCloseTo(0, 5);
  });

  it('computes 0 distance between identical point clouds', () => {
    const raw = [
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 0 },
    ];
    const cloudA = PointCloud.normalizeStrokes([raw], 32);
    const cloudB = PointCloud.normalizeStrokes([raw], 32);
    const dist = PointCloud.cloudDistance(cloudA, cloudB);
    expect(dist).toBeCloseTo(0, 4);
  });

  it('returns small distance for similar scaled/shifted gestures', () => {
    // A 'V' shape small vs large
    const v1 = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 20, y: 0 },
    ];
    const v2 = [
      { x: 100, y: 100 },
      { x: 150, y: 200 },
      { x: 200, y: 100 },
    ];
    const cloud1 = PointCloud.normalizeStrokes([v1], 32);
    const cloud2 = PointCloud.normalizeStrokes([v2], 32);
    const dist = PointCloud.cloudDistance(cloud1, cloud2);
    expect(dist).toBeLessThan(0.08); // very close
  });
});
