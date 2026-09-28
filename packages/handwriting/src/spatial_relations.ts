import type { BoundingBox } from './stroke';

export type SymbolCategory =
  | 'variable'
  | 'digit'
  | 'operator'
  | 'fraction_bar'
  | 'radical'
  | 'fence'
  | 'calculus'
  | 'other';

export interface RecognizedSymbol {
  id: string;
  symbol: string;
  latex: string;
  category: SymbolCategory;
  bbox: BoundingBox;
  baseline: number;
  centerX: number;
  centerY: number;
  confidence: number;
  strokeIndices?: number[];
}

export enum SpatialRelation {
  RIGHT = 'RIGHT',                 // Standard sequence along the same baseline: 2x, x + 3
  SUPER_SCRIPT = 'SUPER_SCRIPT',   // Power/exponent: x², (x+1)³
  SUB_SCRIPT = 'SUB_SCRIPT',       // Subscript: x₁, a_n
  ABOVE = 'ABOVE',                 // Numerator above fraction bar
  BELOW = 'BELOW',                 // Denominator below fraction bar
  CONTAINS = 'CONTAINS',           // Inside radical √ or inside parentheses
  OVER = 'OVER',                   // Upper bound in limit/integral
  UNDER = 'UNDER',                 // Lower bound in limit/integral
  EQUALS = 'EQUALS',               // Right side of equation: expr = expr
}

export class SpatialRelationAnalyzer {
  /**
   * Computes the mathematical baseline for a symbol based on its character type and bounding box.
   */
  static computeBaseline(symbol: string, bbox: BoundingBox, category?: SymbolCategory): number {
    const s = symbol.trim();

    // Descenders: 'y', 'p', 'q', 'g', 'j' have baseline around 68% of height
    if (['y', 'p', 'q', 'g', 'j'].includes(s)) {
      return bbox.minY + bbox.height * 0.68;
    }

    // Centered operators & lines
    if (category === 'fraction_bar' || ['-', '=', '+', '*', '/'].includes(s)) {
      return bbox.centerY;
    }

    // Radical: baseline is near bottom of hook
    if (s === '√' || s === '\\sqrt' || category === 'radical') {
      return bbox.maxY;
    }

    // Standard variables and digits
    return bbox.minY + bbox.height * 0.88;
  }

  /**
   * Categorizes a recognized symbol string.
   */
  static categorizeSymbol(symbol: string, bbox?: BoundingBox): SymbolCategory {
    const s = symbol.trim();
    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(s)) {
      return 'digit';
    }
    if (['x', 'y', 'z', 'a', 'b', 'c', 'n', 'm', 't', 'k', 'd'].includes(s)) {
      return 'variable';
    }
    if (s === '√' || s.startsWith('\\sqrt')) {
      return 'radical';
    }
    if (['(', ')', '[', ']', '{', '}'].includes(s)) {
      return 'fence';
    }
    if (s === '∫' || s.startsWith('\\int') || s === 'lim' || s.startsWith('d/dx')) {
      return 'calculus';
    }
    if (s === '-' && bbox && bbox.width > 2.0 * bbox.height && bbox.width > 22) {
      return 'fraction_bar';
    }
    if (['+', '-', '*', '/', '='].includes(s)) {
      return 'operator';
    }
    return 'other';
  }

  /**
   * Determines the formal spatial relation from `base` to `target`.
   */
  static determineRelation(base: RecognizedSymbol, target: RecognizedSymbol): SpatialRelation {
    // 1. Fraction Bar relation (Above / Below)
    if (base.category === 'fraction_bar' || (base.symbol === '-' && base.bbox.width > 2.0 * base.bbox.height && base.bbox.width > 22)) {
      const withinHorizontalSpan =
        target.centerX >= base.bbox.minX - 15 && target.centerX <= base.bbox.maxX + 15;

      if (withinHorizontalSpan) {
        if (target.bbox.maxY <= base.bbox.centerY + 8) {
          return SpatialRelation.ABOVE;
        }
        if (target.bbox.minY >= base.bbox.centerY - 8) {
          return SpatialRelation.BELOW;
        }
      }
    }

    // 2. Radical Containment relation
    if (base.category === 'radical' || base.symbol === '√') {
      const insideHorizontalRoof =
        target.centerX >= base.bbox.minX + 8 && target.centerX <= base.bbox.maxX + 25;
      const insideVerticalRoof =
        target.bbox.minY >= base.bbox.minY - 12 && target.bbox.maxY <= base.bbox.maxY + 15;

      if (insideHorizontalRoof && insideVerticalRoof) {
        return SpatialRelation.CONTAINS;
      }
    }

    // 3. Limit under relationship (e.g. lim under-expression x->0)
    if (base.symbol === 'lim' || base.latex === '\\lim') {
      if (
        target.centerX >= base.bbox.minX - 10 &&
        target.centerX <= base.bbox.maxX + 10 &&
        target.bbox.minY >= base.bbox.maxY - 5
      ) {
        return SpatialRelation.UNDER;
      }
    }

    // 4. Equal sign relation
    if (base.symbol === '=') {
      if (target.bbox.minX >= base.centerX) {
        return SpatialRelation.EQUALS;
      }
    }

    // Calculate vertical differences
    const verticalCenterDiff = target.centerY - base.centerY;
    const avgHeight = (base.bbox.height + target.bbox.height) / 2;

    // Check if target is an operator (operators like +, -, *, = are NEVER superscripts of variables/digits)
    const targetIsOperator = ['+', '-', '*', '/', '='].includes(target.symbol);

    // If vertical centers are aligned within 38% of average height, or target is an operator on the baseline band, it's on the same line
    if (Math.abs(verticalCenterDiff) < 0.38 * avgHeight || (targetIsOperator && Math.abs(verticalCenterDiff) < 0.7 * avgHeight)) {
      return SpatialRelation.RIGHT;
    }

    // Horizontal check: target must be to the right of base center
    const isToTheRight = target.bbox.minX >= base.centerX - 10;
    const horizontalClose = target.bbox.minX <= base.bbox.maxX + Math.max(35, base.bbox.width * 0.95);

    if (isToTheRight && horizontalClose && !targetIsOperator) {
      // 5. Superscript (Power / Exponent)
      // Elevated: target center is substantially higher than base center
      // and target's center is around or above the top half of base
      if (
        verticalCenterDiff < -0.38 * avgHeight &&
        target.centerY <= base.bbox.minY + 0.45 * base.bbox.height &&
        target.bbox.maxY <= base.baseline + 8
      ) {
        return SpatialRelation.SUPER_SCRIPT;
      }

      // 6. Subscript
      // Depressed: target center is substantially lower than base baseline
      if (
        verticalCenterDiff > 0.38 * avgHeight &&
        target.centerY > base.baseline - 2 &&
        target.bbox.minY > base.centerY - 5
      ) {
        return SpatialRelation.SUB_SCRIPT;
      }
    }

    // 7. Default inline sequence on same baseline
    return SpatialRelation.RIGHT;
  }
}
