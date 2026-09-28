import { Stroke, type StrokePoint, type BoundingBox } from './stroke';

export interface StrokeCluster {
  id: string;
  strokes: StrokePoint[][];
  bbox: BoundingBox;
}

export class SpatialStrokeGrouper {
  /**
   * Groups a set of raw strokes into distinct lines or separate spatial expressions.
   */
  static groupStrokes(rawStrokes: StrokePoint[][]): StrokeCluster[] {
    if (rawStrokes.length === 0) return [];
    if (rawStrokes.length === 1) {
      return [
        {
          id: 'cluster-0',
          strokes: rawStrokes,
          bbox: Stroke.computeBoundingBox(rawStrokes[0]),
        },
      ];
    }

    const strokesWithBBox = rawStrokes.map((s, idx) => ({
      index: idx,
      points: s,
      bbox: Stroke.computeBoundingBox(s),
    }));

    // Estimate line height
    const heights = strokesWithBBox.map((s) => s.bbox.height).filter((h) => h > 5);
    const avgHeight = heights.length > 0
      ? heights.reduce((sum, h) => sum + h, 0) / heights.length
      : 35;
    const verticalLineThreshold = Math.max(25, avgHeight * 0.85);

    // 1. Group into vertical line bands
    // Sort by vertical center Y
    const sortedByY = [...strokesWithBBox].sort((a, b) => a.bbox.centerY - b.bbox.centerY);
    const lineBands: Array<typeof strokesWithBBox> = [];

    for (const item of sortedByY) {
      let placed = false;
      for (const band of lineBands) {
        // Average Y center of band
        const bandCenterY = band.reduce((sum, s) => sum + s.bbox.centerY, 0) / band.length;
        if (Math.abs(item.bbox.centerY - bandCenterY) <= verticalLineThreshold) {
          band.push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        lineBands.push([item]);
      }
    }

    // 2. Within each line band, split horizontally if gap is large (e.g. side-by-side expressions)
    const horizontalGapThreshold = Math.max(90, avgHeight * 2.8);
    const clusters: StrokeCluster[] = [];
    let clusterCounter = 0;

    for (const band of lineBands) {
      // Sort left-to-right
      band.sort((a, b) => a.bbox.minX - b.bbox.minX);

      let currentSubGroup: typeof strokesWithBBox = [band[0]];

      for (let i = 1; i < band.length; i++) {
        const prev = currentSubGroup[currentSubGroup.length - 1];
        const curr = band[i];
        const gap = curr.bbox.minX - prev.bbox.maxX;

        if (gap > horizontalGapThreshold) {
          // Commit current sub group
          clusters.push(this.buildCluster(`cluster-${clusterCounter++}`, currentSubGroup));
          currentSubGroup = [curr];
        } else {
          currentSubGroup.push(curr);
        }
      }

      if (currentSubGroup.length > 0) {
        clusters.push(this.buildCluster(`cluster-${clusterCounter++}`, currentSubGroup));
      }
    }

    return clusters;
  }

  private static buildCluster(
    id: string,
    items: Array<{ points: StrokePoint[]; bbox: BoundingBox }>
  ): StrokeCluster {
    const allPoints = items.flatMap((it) => it.points);
    return {
      id,
      strokes: items.map((it) => it.points),
      bbox: Stroke.computeBoundingBox(allPoints),
    };
  }
}
