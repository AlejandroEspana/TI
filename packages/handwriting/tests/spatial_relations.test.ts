import { describe, it, expect } from 'vitest';
import {
  SpatialRelationAnalyzer,
  SpatialRelation,
  type RecognizedSymbol,
} from '../src/spatial_relations';

describe('SpatialRelationAnalyzer', () => {
  const makeSymbol = (
    id: string,
    symbol: string,
    category: RecognizedSymbol['category'],
    bbox: { minX: number; maxX: number; minY: number; maxY: number }
  ): RecognizedSymbol => {
    const width = bbox.maxX - bbox.minX;
    const height = bbox.maxY - bbox.minY;
    const b = { ...bbox, width, height, centerX: bbox.minX + width / 2, centerY: bbox.minY + height / 2 };
    const baseline = SpatialRelationAnalyzer.computeBaseline(symbol, b, category);
    return {
      id,
      symbol,
      latex: symbol,
      category,
      bbox: b,
      baseline,
      centerX: b.centerX,
      centerY: b.centerY,
      confidence: 0.95,
    };
  };

  it('detects SUPER_SCRIPT when symbol 2 is in top-right of x (x²)', () => {
    // x at (100, 100) to (140, 150) -> height 50, baseline ~ 144
    const symX = makeSymbol('s-x', 'x', 'variable', { minX: 100, maxX: 140, minY: 100, maxY: 150 });
    // 2 at (145, 80) to (165, 110) -> elevated above baseline
    const sym2 = makeSymbol('s-2', '2', 'digit', { minX: 145, maxX: 165, minY: 80, maxY: 110 });

    const rel = SpatialRelationAnalyzer.determineRelation(symX, sym2);
    expect(rel).toBe(SpatialRelation.SUPER_SCRIPT);
  });

  it('detects SUB_SCRIPT when symbol 1 is below baseline of x (x₁)', () => {
    const symX = makeSymbol('s-x', 'x', 'variable', { minX: 100, maxX: 140, minY: 100, maxY: 150 });
    // 1 at (145, 140) to (160, 175) -> below baseline
    const sym1 = makeSymbol('s-1', '1', 'digit', { minX: 145, maxX: 160, minY: 140, maxY: 175 });

    const rel = SpatialRelationAnalyzer.determineRelation(symX, sym1);
    expect(rel).toBe(SpatialRelation.SUB_SCRIPT);
  });

  it('detects ABOVE and BELOW for fraction bar', () => {
    // Fraction bar from x=100 to x=180 at y=150
    const bar = makeSymbol('bar', '-', 'fraction_bar', { minX: 100, maxX: 180, minY: 148, maxY: 152 });
    // Numerator (x + 1) above at y=110 to y=140
    const num = makeSymbol('num', 'x', 'variable', { minX: 120, maxX: 150, minY: 110, maxY: 140 });
    // Denominator (x - 2) below at y=160 to y=190
    const den = makeSymbol('den', 'x', 'variable', { minX: 120, maxX: 150, minY: 160, maxY: 190 });

    expect(SpatialRelationAnalyzer.determineRelation(bar, num)).toBe(SpatialRelation.ABOVE);
    expect(SpatialRelationAnalyzer.determineRelation(bar, den)).toBe(SpatialRelation.BELOW);
  });

  it('detects CONTAINS for radical √ enclosing a symbol', () => {
    // Radical from x=100 to x=200, y=100 to y=160
    const rad = makeSymbol('rad', '√', 'radical', { minX: 100, maxX: 200, minY: 100, maxY: 160 });
    // Inside symbol x at x=130, y=120
    const innerX = makeSymbol('inner-x', 'x', 'variable', { minX: 125, maxX: 155, minY: 115, maxY: 150 });

    expect(SpatialRelationAnalyzer.determineRelation(rad, innerX)).toBe(SpatialRelation.CONTAINS);
  });

  it('detects RIGHT for symbols on the same horizontal baseline (x + 2)', () => {
    const symX = makeSymbol('s-x', 'x', 'variable', { minX: 100, maxX: 140, minY: 100, maxY: 150 });
    const symPlus = makeSymbol('s-plus', '+', 'operator', { minX: 155, maxX: 185, minY: 110, maxY: 140 });
    const sym2 = makeSymbol('s-2', '2', 'digit', { minX: 200, maxX: 230, minY: 102, maxY: 150 });

    expect(SpatialRelationAnalyzer.determineRelation(symX, symPlus)).toBe(SpatialRelation.RIGHT);
    expect(SpatialRelationAnalyzer.determineRelation(symPlus, sym2)).toBe(SpatialRelation.RIGHT);
  });
});
