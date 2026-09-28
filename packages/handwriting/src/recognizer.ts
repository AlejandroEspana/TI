import { Stroke, type StrokePoint } from './stroke';
import { PointCloud } from './point_cloud';
import { TemplateStore } from './template_store';
import { CANONICAL_TEMPLATES } from './canonical_templates';
import {
  type RecognizedSymbol,
  type SymbolCategory,
  SpatialRelationAnalyzer,
} from './spatial_relations';
import { StructuralTreeBuilder, type MathStructureNode } from './math_structure';
import type { MathASTNode } from '@mathboard/shared';

export interface RecognizedGlyph extends RecognizedSymbol {}

export class MathematicalStrokeRecognizer {
  /**
   * Evaluates whether two individual strokes belong to the same glyph.
   */
  static areStrokesSameGlyph(s1: Stroke, s2: Stroke): boolean {
    const b1 = s1.bbox;
    const b2 = s2.bbox;

    const xOverlap = Math.max(0, Math.min(b1.maxX, b2.maxX) - Math.max(b1.minX, b2.minX));
    const yOverlap = Math.max(0, Math.min(b1.maxY, b2.maxY) - Math.max(b1.minY, b2.minY));
    const xDist = Math.max(0, Math.max(b1.minX, b2.minX) - Math.min(b1.maxX, b2.maxX));
    const yDist = Math.max(0, Math.max(b1.minY, b2.minY) - Math.min(b1.maxY, b2.maxY));

    const minW = Math.min(b1.width, b2.width);
    const minH = Math.min(b1.height, b2.height);
    const maxH = Math.max(b1.height, b2.height);

    // 1. Two strokes that physically intersect or heavily overlap in 2D (e.g. 'x', '+', '*', '4', 't')
    if (xOverlap > 0 && yOverlap > 0) {
      const relW = minW > 0 ? xOverlap / minW : 0;
      const relH = minH > 0 ? yOverlap / minH : 0;
      if (relW >= 0.22 && relH >= 0.2) {
        return true;
      }
    }

    // 2. Vertically stacked strokes with heavy horizontal overlap (e.g. '=', ':', '!', 'i')
    if (xDist === 0 && xOverlap >= 0.42 * minW) {
      if (yDist <= Math.max(22, maxH * 1.5)) {
        return true;
      }
    }

    // 3. Touching endpoints (e.g. multi-stroke '7', square root checkmark + roof bar)
    const p1Start = s1.points[0];
    const p1End = s1.points[s1.points.length - 1];
    const p2Start = s2.points[0];
    const p2End = s2.points[s2.points.length - 1];

    if (p1Start && p1End && p2Start && p2End) {
      const d1 = Math.hypot(p1End.x - p2Start.x, p1End.y - p2Start.y);
      const d2 = Math.hypot(p2End.x - p1Start.x, p2End.y - p1Start.y);
      const d3 = Math.hypot(p1Start.x - p2Start.x, p1Start.y - p2Start.y);
      const d4 = Math.hypot(p1End.x - p2End.x, p1End.y - p2End.y);
      const minTouch = Math.min(d1, d2, d3, d4);
      if (minTouch < 10) {
        return true;
      }
    }

    // Strokes that are horizontally side-by-side belong to separate characters
    return false;
  }

  /**
   * Group strokes into glyph clusters based on spatial connected components
   */
  static clusterStrokes(strokes: Stroke[]): Stroke[][] {
    if (strokes.length === 0) return [];
    if (strokes.length === 1) return [[strokes[0]]];

    const clusters: Stroke[][] = [];
    const visited = new Set<number>();

    for (let i = 0; i < strokes.length; i++) {
      if (visited.has(i)) continue;

      const cluster: Stroke[] = [];
      const queue: number[] = [i];
      visited.add(i);

      while (queue.length > 0) {
        const currIdx = queue.shift()!;
        cluster.push(strokes[currIdx]);

        for (let j = 0; j < strokes.length; j++) {
          if (visited.has(j)) continue;
          if (this.areStrokesSameGlyph(strokes[currIdx], strokes[j])) {
            visited.add(j);
            queue.push(j);
          }
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Classifies a cluster of strokes using geometry analysis and the hybrid $P Point Cloud engine,
   * computing the exact bounding box, category, and mathematical baseline.
   */
  static classifyCluster(cluster: Stroke[], profileId?: string): RecognizedSymbol {
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
      minX, maxX, minY, maxY, width, height,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };

    const id = `sym_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Fast-path A: Two horizontal parallel strokes is definitely '='
    if (cluster.length === 2) {
      const [s1, s2] = cluster;
      if (s1.isHorizontalLine && s2.isHorizontalLine) {
        return {
          id,
          symbol: '=',
          latex: '=',
          category: 'operator',
          confidence: 0.98,
          bbox,
          baseline: bbox.centerY,
          centerX: bbox.centerX,
          centerY: bbox.centerY,
        };
      }
      if (
        (s1.isHorizontalLine && s2.isVerticalLine) ||
        (s2.isHorizontalLine && s1.isVerticalLine)
      ) {
        return {
          id,
          symbol: '+',
          latex: '+',
          category: 'operator',
          confidence: 0.96,
          bbox,
          baseline: bbox.centerY,
          centerX: bbox.centerX,
          centerY: bbox.centerY,
        };
      }

      // Fast-path B: Two crossed diagonal strokes is definitely variable 'x'
      const pts1 = s1.points;
      const pts2 = s2.points;
      if (pts1.length >= 2 && pts2.length >= 2) {
        const p1Start = pts1[0], p1End = pts1[pts1.length - 1];
        const p2Start = pts2[0], p2End = pts2[pts2.length - 1];

        const dx1 = p1End.x - p1Start.x;
        const dy1 = p1End.y - p1Start.y;
        const dx2 = p2End.x - p2Start.x;
        const dy2 = p2End.y - p2Start.y;

        const slope1 = dy1 / (dx1 || 0.001);
        const slope2 = dy2 / (dx2 || 0.001);

        if (
          Math.abs(dx1) > 4 && Math.abs(dy1) > 4 &&
          Math.abs(dx2) > 4 && Math.abs(dy2) > 4 &&
          slope1 * slope2 < 0 &&
          Math.abs(s1.bbox.centerX - s2.bbox.centerX) < bbox.width * 0.6 &&
          Math.abs(s1.bbox.centerY - s2.bbox.centerY) < bbox.height * 0.6
        ) {
          return {
            id,
            symbol: 'x',
            latex: 'x',
            category: 'variable',
            confidence: 0.98,
            bbox,
            baseline: bbox.minY + bbox.height * 0.85,
            centerX: bbox.centerX,
            centerY: bbox.centerY,
          };
        }
      }
    }

    // Fast-path C: Single horizontal line: either minus sign '-' or fraction bar
    if (cluster.length === 1 && cluster[0].isHorizontalLine) {
      const category: SymbolCategory = width > 2.2 * height && width > 25 ? 'fraction_bar' : 'operator';
      return {
        id,
        symbol: '-',
        latex: '-',
        category,
        confidence: 0.98,
        bbox,
        baseline: bbox.centerY,
        centerX: bbox.centerX,
        centerY: bbox.centerY,
      };
    }

    // Fast-path D: Single vertical / slender stroke: distinguish '(', ')', and '1' by curvature
    if (cluster.length === 1 && (cluster[0].isVerticalLine || (aspect < 0.45 && height > 16))) {
      const s = cluster[0];
      const pts = s.points;
      if (pts.length >= 2) {
        const start = pts[0];
        const end = pts[pts.length - 1];

        let maxLeftDev = 0;
        let maxRightDev = 0;
        const ySpan = end.y - start.y || 1;

        for (const p of pts) {
          const chordX = start.x + ((end.x - start.x) * (p.y - start.y)) / ySpan;
          const diff = p.x - chordX;
          if (diff < -maxLeftDev) maxLeftDev = -diff;
          if (diff > maxRightDev) maxRightDev = diff;
        }

        // Strong leftward curvature -> '('
        if (maxLeftDev > Math.max(3.5, width * 0.35) && maxLeftDev > maxRightDev * 1.5) {
          return {
            id,
            symbol: '(',
            latex: '(',
            category: 'fence',
            confidence: 0.98,
            bbox,
            baseline: bbox.centerY,
            centerX: bbox.centerX,
            centerY: bbox.centerY,
          };
        }

        // Strong rightward curvature -> ')'
        if (maxRightDev > Math.max(3.5, width * 0.35) && maxRightDev > maxLeftDev * 1.5) {
          return {
            id,
            symbol: ')',
            latex: ')',
            category: 'fence',
            confidence: 0.98,
            bbox,
            baseline: bbox.centerY,
            centerX: bbox.centerX,
            centerY: bbox.centerY,
          };
        }

        // Very low curvature -> digit '1'
        if (aspect < 0.28 && maxLeftDev < height * 0.12 && maxRightDev < height * 0.12) {
          return {
            id,
            symbol: '1',
            latex: '1',
            category: 'digit',
            confidence: 0.98,
            bbox,
            baseline: bbox.minY + bbox.height * 0.88,
            centerX: bbox.centerX,
            centerY: bbox.centerY,
          };
        }
      }
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

      // Multi-example & personalization preference
      const isCustom = 'createdAt' in t || 'profileId' in t;
      const userWeight = isCustom ? 0.82 : 1.0;

      const weightedDist = rawDist * penalty * userWeight;

      if (weightedDist < minWeightedDistance) {
        minWeightedDistance = weightedDist;
        bestSymbol = t.symbol;
        bestLatex = t.latex;
      }
    }

    const confidence = Math.max(0.4, Math.min(0.99, 1.0 - minWeightedDistance * 1.5));
    const category = SpatialRelationAnalyzer.categorizeSymbol(bestSymbol, bbox);
    const baseline = SpatialRelationAnalyzer.computeBaseline(bestSymbol, bbox, category);

    return {
      id,
      symbol: bestSymbol,
      latex: bestLatex,
      category,
      confidence: Number(confidence.toFixed(2)),
      bbox,
      baseline,
      centerX: bbox.centerX,
      centerY: bbox.centerY,
    };
  }

  /**
   * Recognizes drawn strokes into mathematical structures using the 2D spatial relationships pipeline.
   * Returns clean LaTeX, recognized symbols, structural tree, and computational AST.
   */
  static recognizeStrokesToLatex(
    rawStrokesPoints: StrokePoint[][],
    profileId?: string
  ): {
    latex: string;
    glyphs: RecognizedSymbol[];
    tree?: MathStructureNode;
    ast?: MathASTNode;
  } {
    if (rawStrokesPoints.length === 0) return { latex: '', glyphs: [] };

    const strokes = rawStrokesPoints
      .filter((pts) => pts.length > 1)
      .map((pts) => new Stroke(pts));

    if (strokes.length === 0) return { latex: '', glyphs: [] };

    const clusters = this.clusterStrokes(strokes);
    const symbols = clusters.map((c) => this.classifyCluster(c, profileId));

    // Sort symbols left to right by their horizontal center
    symbols.sort((a, b) => a.centerX - b.centerX);

    // Build the hierarchical mathematical structure tree
    const tree = StructuralTreeBuilder.buildTree(symbols);
    const latex = StructuralTreeBuilder.toLatex(tree);
    const ast = StructuralTreeBuilder.toAST(tree);

    return {
      latex: latex.trim(),
      glyphs: symbols,
      tree,
      ast,
    };
  }
}
