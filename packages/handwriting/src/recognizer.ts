import { Stroke, type StrokePoint } from './stroke';

export interface RecognizedGlyph {
  symbol: string;
  latex: string;
  confidence: number;
  bbox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    centerX: number;
    centerY: number;
  };
}

export class MathematicalStrokeRecognizer {
  /**
   * Group strokes into glyph clusters based on spatial proximity
   */
  static clusterStrokes(strokes: Stroke[]): Stroke[][] {
    if (strokes.length === 0) return [];
    if (strokes.length === 1) return [[strokes[0]]];

    const clusters: Stroke[][] = [];
    const visited = new Set<number>();

    for (let i = 0; i < strokes.length; i++) {
      if (visited.has(i)) continue;
      const cluster = [strokes[i]];
      visited.add(i);

      for (let j = i + 1; j < strokes.length; j++) {
        if (visited.has(j)) continue;
        const b1 = strokes[i].bbox;
        const b2 = strokes[j].bbox;

        // Check if b1 and b2 overlap or are very close (e.g. for '=', '+', 'x')
        const xOverlap = Math.max(0, Math.min(b1.maxX, b2.maxX) - Math.max(b1.minX, b2.minX));
        const yOverlap = Math.max(0, Math.min(b1.maxY, b2.maxY) - Math.max(b1.minY, b2.minY));
        const xDist = Math.max(0, Math.max(b1.minX, b2.minX) - Math.min(b1.maxX, b2.maxX));
        const yDist = Math.max(0, Math.max(b1.minY, b2.minY) - Math.min(b1.maxY, b2.maxY));

        const maxDim = Math.max(b1.width, b1.height, b2.width, b2.height);
        const isClose = (xOverlap > 0 && yDist < maxDim * 0.8) || (xDist < maxDim * 0.4 && yOverlap > 0);

        if (isClose) {
          cluster.push(strokes[j]);
          visited.add(j);
        }
      }
      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Classify a single cluster of strokes into a mathematical glyph
   */
  static classifyCluster(cluster: Stroke[]): RecognizedGlyph {
    // Combined bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of cluster) {
      if (s.bbox.minX < minX) minX = s.bbox.minX;
      if (s.bbox.maxX > maxX) maxX = s.bbox.maxX;
      if (s.bbox.minY < minY) minY = s.bbox.minY;
      if (s.bbox.maxY > maxY) maxY = s.bbox.maxY;
    }
    const bbox = {
      minX, maxX, minY, maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };

    // 1. Two-stroke symbols
    if (cluster.length === 2) {
      const [s1, s2] = cluster;

      // Equal sign '=': two horizontal parallel strokes
      if (s1.isHorizontalLine && s2.isHorizontalLine) {
        return { symbol: '=', latex: '=', confidence: 0.95, bbox };
      }

      // Plus sign '+': one horizontal and one vertical intersecting
      if (
        (s1.isHorizontalLine && s2.isVerticalLine) ||
        (s2.isHorizontalLine && s1.isVerticalLine)
      ) {
        return { symbol: '+', latex: '+', confidence: 0.92, bbox };
      }

      // 'x' (two crossing diagonal strokes)
      const isDiagonal1 = Math.abs(s1.bbox.width - s1.bbox.height) < Math.max(s1.bbox.width, s1.bbox.height) * 0.7;
      const isDiagonal2 = Math.abs(s2.bbox.width - s2.bbox.height) < Math.max(s2.bbox.width, s2.bbox.height) * 0.7;
      if (isDiagonal1 && isDiagonal2) {
        return { symbol: 'x', latex: 'x', confidence: 0.90, bbox };
      }

      // Default for 2 strokes
      return { symbol: 'x', latex: 'x', confidence: 0.75, bbox };
    }

    // 2. Single-stroke symbols
    if (cluster.length === 1) {
      const s = cluster[0];

      // Horizontal line '-'
      if (s.isHorizontalLine) {
        return { symbol: '-', latex: '-', confidence: 0.95, bbox };
      }

      // Vertical line '1'
      if (s.isVerticalLine) {
        return { symbol: '1', latex: '1', confidence: 0.92, bbox };
      }

      // Closed loop '0'
      if (s.isClosed) {
        return { symbol: '0', latex: '0', confidence: 0.90, bbox };
      }

      // Diagonal stroke '/'
      if (s.startPoint && s.endPoint) {
        const dx = s.endPoint.x - s.startPoint.x;
        const dy = s.endPoint.y - s.startPoint.y;
        if (Math.abs(dx) > 10 && Math.abs(dy) > 10) {
          if (dx * dy < 0) {
            // Upward or downward right-to-left
            return { symbol: '/', latex: '/', confidence: 0.85, bbox };
          }
        }
      }

      // Tall S-curve: Integral '\int'
      if (s.bbox.height > 2.2 * s.bbox.width && s.length > 1.4 * s.bbox.height) {
        return { symbol: '∫', latex: '\\int', confidence: 0.88, bbox };
      }

      // Square root '\sqrt'
      if (s.points.length > 8 && s.bbox.width > 20) {
        const midPoint = s.points[Math.floor(s.points.length / 2)];
        if (midPoint.y < s.bbox.minY + 0.3 * s.bbox.height && s.endPoint && s.endPoint.x > s.bbox.centerX) {
          return { symbol: '√', latex: '\\sqrt{}', confidence: 0.86, bbox };
        }
      }

      // Curved shapes: ( or )
      if (s.bbox.height > 1.8 * s.bbox.width) {
        const midX = s.points[Math.floor(s.points.length / 2)].x;
        if (midX < s.bbox.centerX) {
          return { symbol: ')', latex: ')', confidence: 0.80, bbox };
        } else {
          return { symbol: '(', latex: '(', confidence: 0.80, bbox };
        }
      }

      // Letters vs digits heuristics:
      // If width and height are comparable
      const aspect = s.bbox.width / s.bbox.height;
      if (aspect > 0.6 && aspect < 1.4) {
        // Could be a, b, c, 2, 3, etc. Default to variable 'x' or 'a'
        return { symbol: 'x', latex: 'x', confidence: 0.80, bbox };
      }

      return { symbol: 'x', latex: 'x', confidence: 0.70, bbox };
    }

    // Default for 3 or more strokes
    return { symbol: 'a', latex: 'a', confidence: 0.65, bbox };
  }

  /**
   * Recognize complete formula from drawn strokes and return clean LaTeX
   */
  static recognizeStrokesToLatex(rawStrokesPoints: StrokePoint[][]): { latex: string; glyphs: RecognizedGlyph[] } {
    if (rawStrokesPoints.length === 0) return { latex: '', glyphs: [] };

    const strokes = rawStrokesPoints
      .filter((pts) => pts.length > 1)
      .map((pts) => new Stroke(pts));

    if (strokes.length === 0) return { latex: '', glyphs: [] };

    const clusters = this.clusterStrokes(strokes);
    const glyphs = clusters.map((c) => this.classifyCluster(c));

    // Sort glyphs left to right by their horizontal center
    glyphs.sort((a, b) => a.bbox.centerX - b.bbox.centerX);

    // Compute average height to detect exponents (superscripts)
    const avgHeight = glyphs.reduce((sum, g) => sum + (g.bbox.maxY - g.bbox.minY), 0) / glyphs.length;
    const avgCenterY = glyphs.reduce((sum, g) => sum + g.bbox.centerY, 0) / glyphs.length;

    let latex = '';
    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i];
      const gHeight = g.bbox.maxY - g.bbox.minY;

      // Check if this glyph is a superscript/exponent:
      // Smaller height and significantly higher than average center
      const isExponent = i > 0 && gHeight < avgHeight * 0.75 && g.bbox.centerY < avgCenterY - avgHeight * 0.3;

      if (isExponent) {
        latex += `^{${g.latex}}`;
      } else {
        if (i > 0 && ['+', '-', '=', '\\int'].includes(g.latex)) {
          latex += ` ${g.latex} `;
        } else {
          latex += g.latex;
        }
      }
    }

    return {
      latex: latex.trim(),
      glyphs,
    };
  }
}
