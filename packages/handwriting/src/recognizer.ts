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

    // Fast-path for distinct geometric operators:
    // A. Two horizontal parallel strokes is definitely '='
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
          confidence: 0.95,
          bbox,
          baseline: bbox.centerY,
          centerX: bbox.centerX,
          centerY: bbox.centerY,
        };
      }
    }

    // B. Single horizontal line: either minus sign '-' or fraction bar
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

    // C. Single vertical line is definitely '1'
    if (cluster.length === 1 && cluster[0].isVerticalLine && aspect < 0.25) {
      return {
        id,
        symbol: '1',
        latex: '1',
        category: 'digit',
        confidence: 0.96,
        bbox,
        baseline: bbox.minY + bbox.height * 0.88,
        centerX: bbox.centerX,
        centerY: bbox.centerY,
      };
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
