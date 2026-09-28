export interface Point2D {
  x: number;
  y: number;
  strokeId?: number;
}

export interface RawStrokePoint {
  x: number;
  y: number;
  time?: number;
}

export class PointCloud {
  /**
   * Resamples an array of points to exactly `n` points uniformly spaced by arc length.
   */
  static resample(points: RawStrokePoint[], n: number = 32): Point2D[] {
    if (points.length === 0) return [];
    if (points.length === 1) {
      return Array.from({ length: n }, () => ({ x: points[0].x, y: points[0].y }));
    }

    // Compute total path length
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      totalLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }

    if (totalLength === 0) {
      return Array.from({ length: n }, () => ({ x: points[0].x, y: points[0].y }));
    }

    const interval = totalLength / (n - 1);
    const resampled: Point2D[] = [{ x: points[0].x, y: points[0].y }];
    let currentDist = 0;

    let srcIndex = 1;
    let currP = points[0];

    while (srcIndex < points.length && resampled.length < n) {
      const nextP = points[srcIndex];
      const segDist = Math.hypot(nextP.x - currP.x, nextP.y - currP.y);

      if (currentDist + segDist >= interval) {
        const ratio = (interval - currentDist) / segDist;
        const interpX = currP.x + ratio * (nextP.x - currP.x);
        const interpY = currP.y + ratio * (nextP.y - currP.y);
        const newPt: Point2D = { x: interpX, y: interpY };
        resampled.push(newPt);
        currP = newPt;
        currentDist = 0;
      } else {
        currentDist += segDist;
        currP = nextP;
        srcIndex++;
      }
    }

    // Pad if numerical precision left us with n - 1 points
    while (resampled.length < n) {
      const last = points[points.length - 1];
      resampled.push({ x: last.x, y: last.y });
    }

    return resampled;
  }

  /**
   * Scales points to unit box while preserving aspect ratio for 1D-like strokes (e.g. horizontal minus or vertical one),
   * and translates centroid to origin (0, 0).
   */
  static normalize(points: Point2D[]): Point2D[] {
    if (points.length === 0) return [];

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const width = Math.max(0.001, maxX - minX);
    const height = Math.max(0.001, maxY - minY);
    const aspect = width / height;

    // 1D check: if aspect is very wide (> 2.5) or very tall (< 0.4), scale uniformly by max dimension
    const isOneDimensional = aspect > 2.5 || aspect < 0.4;
    const scaleX = isOneDimensional ? 1 / Math.max(width, height) : 1 / width;
    const scaleY = isOneDimensional ? 1 / Math.max(width, height) : 1 / height;

    // Scale
    const scaled = points.map((p) => ({
      x: (p.x - minX) * scaleX,
      y: (p.y - minY) * scaleY,
      strokeId: p.strokeId,
    }));

    // Find centroid
    let sumX = 0, sumY = 0;
    for (const p of scaled) {
      sumX += p.x;
      sumY += p.y;
    }
    const centroidX = sumX / scaled.length;
    const centroidY = sumY / scaled.length;

    // Translate centroid to (0, 0)
    return scaled.map((p) => ({
      x: p.x - centroidX,
      y: p.y - centroidY,
      strokeId: p.strokeId,
    }));
  }

  /**
   * Converts multiple raw strokes into a single normalized point cloud of N points.
   */
  static normalizeStrokes(rawStrokes: RawStrokePoint[][], totalPoints: number = 32): Point2D[] {
    if (rawStrokes.length === 0) return [];

    // Distribute total points proportionally across strokes by stroke length
    const lengths = rawStrokes.map((s) => {
      let l = 0;
      for (let i = 1; i < s.length; i++) {
        l += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y);
      }
      return Math.max(1, l);
    });

    const sumLengths = lengths.reduce((acc, v) => acc + v, 0);
    const combinedPoints: Point2D[] = [];

    for (let i = 0; i < rawStrokes.length; i++) {
      const stroke = rawStrokes[i];
      if (stroke.length === 0) continue;

      let strokePointsCount = Math.round((lengths[i] / sumLengths) * totalPoints);
      strokePointsCount = Math.max(4, strokePointsCount);

      const resampled = this.resample(stroke, strokePointsCount);
      for (const p of resampled) {
        combinedPoints.push({ x: p.x, y: p.y, strokeId: i });
      }
    }

    // Ensure exact count by trimming or padding
    let finalCloud = combinedPoints;
    if (finalCloud.length > totalPoints) {
      finalCloud = finalCloud.slice(0, totalPoints);
    } else {
      while (finalCloud.length < totalPoints && finalCloud.length > 0) {
        const last = finalCloud[finalCloud.length - 1];
        finalCloud.push({ ...last });
      }
    }

    return this.normalize(finalCloud);
  }

  /**
   * Computes the bidirectional Point Cloud distance between two point clouds A and B.
   * Distance = ( (1/|A|) sum_{a in A} min_{b in B} ||a - b|| + (1/|B|) sum_{b in B} min_{a in A} ||b - a|| ) / 2
   */
  static cloudDistance(cloudA: Point2D[], cloudB: Point2D[]): number {
    if (cloudA.length === 0 || cloudB.length === 0) return Infinity;

    // Directed distance A -> B
    let sumDistAB = 0;
    for (const a of cloudA) {
      let minDist = Infinity;
      for (const b of cloudB) {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < minDist) minDist = d;
      }
      sumDistAB += minDist;
    }
    const avgDistAB = sumDistAB / cloudA.length;

    // Directed distance B -> A
    let sumDistBA = 0;
    for (const b of cloudB) {
      let minDist = Infinity;
      for (const a of cloudA) {
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d < minDist) minDist = d;
      }
      sumDistBA += minDist;
    }
    const avgDistBA = sumDistBA / cloudB.length;

    return (avgDistAB + avgDistBA) / 2;
  }
}
