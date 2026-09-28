import { Stroke, type StrokePoint } from './stroke';
import { PointCloud } from './point_cloud';
import { TemplateStore } from './template_store';
import { CANONICAL_TEMPLATES } from './canonical_templates';

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
        const isClose = (xOverlap > 0 && yDist < maxDim * 0.9) || (xDist < maxDim * 0.4 && yOverlap > 0);

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
   * Classifies a cluster of strokes using the hybrid $P Point Cloud engine,
   * evaluating against both canonical and multi-example user calibrated templates.
   */
  static classifyCluster(cluster: Stroke[], profileId?: string): RecognizedGlyph {
    // 1. Calculate combined bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let anyLoop = false;

    for (const s of cluster) {
      if (s.bbox.minX < minX) minX = s.bbox.minX;
      if (s.bbox.maxX > maxX) maxX = s.bbox.maxX;
      if (s.bbox.minY < minY) minY = s.bbox.minY;
      if (s.bbox.maxY > maxY) maxY = s.bbox.maxY;
      if (s.isClosed) anyLoop = true;
    }

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const aspect = width / height;

    const bbox = {
      minX, maxX, minY, maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };

    // Fast-path for distinct geometric operators:
    // A. Two horizontal parallel strokes is definitely '='
    if (cluster.length === 2) {
      const [s1, s2] = cluster;
      if (s1.isHorizontalLine && s2.isHorizontalLine) {
        return { symbol: '=', latex: '=', confidence: 0.98, bbox };
      }
      if (
        (s1.isHorizontalLine && s2.isVerticalLine) ||
        (s2.isHorizontalLine && s1.isVerticalLine)
      ) {
        return { symbol: '+', latex: '+', confidence: 0.95, bbox };
      }
    }

    // B. Single horizontal line is definitely '-'
    if (cluster.length === 1 && cluster[0].isHorizontalLine) {
      return { symbol: '-', latex: '-', confidence: 0.98, bbox };
    }

    // C. Single vertical line is definitely '1'
    if (cluster.length === 1 && cluster[0].isVerticalLine && aspect < 0.25) {
      return { symbol: '1', latex: '1', confidence: 0.96, bbox };
    }

    // 2. Prepare normalized candidate point cloud
    const rawStrokes = cluster.map((s) => s.points);
    const candidateCloud = PointCloud.normalizeStrokes(rawStrokes, 32);

    // 3. Match against Active Templates (Canonical + User Multi-Examples)
    const store = TemplateStore.getInstance();
    const activeTemplates = profileId
      ? [...CANONICAL_TEMPLATES, ...store.getProfiles().find((p) => p.id === profileId)?.customTemplates || []]
      : store.getAllActiveTemplates();

    let bestSymbol = 'x';
    let bestLatex = 'x';
    let minWeightedDistance = Infinity;

    for (const t of activeTemplates) {
      let penalty = 1.0;

      // Stroke count compatibility
      if (t.strokeCount !== cluster.length) {
        penalty *= 1.35;
      }

      // Loop topology compatibility
      if (anyLoop && !t.hasLoop) {
        penalty *= 1.8;
      } else if (!anyLoop && t.hasLoop) {
        penalty *= 1.6;
      }

      // 1D Aspect ratio compatibility
      if (aspect > 2.0 && t.aspectRatio < 0.8) {
        penalty *= 2.0;
      } else if (aspect < 0.4 && t.aspectRatio > 1.5) {
        penalty *= 2.0;
      }

      // Calculate Point Cloud Distance
      const rawDist = PointCloud.cloudDistance(candidateCloud, t.points);

      // Multi-example & personalization preference:
      // If template is custom created by teacher/student, award a 18% bonus
      const isCustom = 'createdAt' in t || 'profileId' in t;
      const userWeight = isCustom ? 0.82 : 1.0;

      const weightedDist = rawDist * penalty * userWeight;

      if (weightedDist < minWeightedDistance) {
        minWeightedDistance = weightedDist;
        bestSymbol = t.symbol;
        bestLatex = t.latex;
      }
    }

    // Calculate confidence from distance
    const confidence = Math.max(0.4, Math.min(0.99, 1.0 - minWeightedDistance * 1.5));

    return {
      symbol: bestSymbol,
      latex: bestLatex,
      confidence: Number(confidence.toFixed(2)),
      bbox,
    };
  }

  /**
   * Recognize complete formula from drawn strokes and return clean LaTeX
   */
  static recognizeStrokesToLatex(
    rawStrokesPoints: StrokePoint[][],
    profileId?: string
  ): { latex: string; glyphs: RecognizedGlyph[] } {
    if (rawStrokesPoints.length === 0) return { latex: '', glyphs: [] };

    const strokes = rawStrokesPoints
      .filter((pts) => pts.length > 1)
      .map((pts) => new Stroke(pts));

    if (strokes.length === 0) return { latex: '', glyphs: [] };

    const clusters = this.clusterStrokes(strokes);
    const glyphs = clusters.map((c) => this.classifyCluster(c, profileId));

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
