import { describe, it, expect } from 'vitest';
import {
  StructuralTreeBuilder,
  type MathStructureNode,
} from '../src/math_structure';
import {
  type RecognizedSymbol,
  SpatialRelationAnalyzer,
} from '../src/spatial_relations';

describe('MathStructure & AST Pipeline (Mandatory Battery of Tests)', () => {
  const sym = (
    symbol: string,
    category: RecognizedSymbol['category'],
    x: number,
    y: number,
    w = 30,
    h = 45
  ): RecognizedSymbol => {
    const bbox = { minX: x, maxX: x + w, minY: y, maxY: y + h, width: w, height: h, centerX: x + w / 2, centerY: y + h / 2 };
    const baseline = SpatialRelationAnalyzer.computeBaseline(symbol, bbox, category);
    return {
      id: `s-${symbol}-${x}-${y}`,
      symbol,
      latex: symbol,
      category,
      bbox,
      baseline,
      centerX: bbox.centerX,
      centerY: bbox.centerY,
      confidence: 0.95,
    };
  };

  describe('1. Basic Expressions', () => {
    it('recognizes isolated variable x', () => {
      const tree = StructuralTreeBuilder.buildTree([sym('x', 'variable', 100, 100)]);
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('x');
    });

    it('recognizes implicit multiplication 2x', () => {
      const symbols = [
        sym('2', 'digit', 100, 100),
        sym('x', 'variable', 135, 100),
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('2x');
      const ast = StructuralTreeBuilder.toAST(tree);
      expect(ast.type).toBe('BINARY_OP');
      expect(ast.operator).toBe('*');
    });

    it('recognizes x + 2', () => {
      const symbols = [
        sym('x', 'variable', 100, 100),
        sym('+', 'operator', 140, 105),
        sym('2', 'digit', 180, 100),
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('x + 2');
    });

    it('recognizes 2x + 5', () => {
      const symbols = [
        sym('2', 'digit', 100, 100),
        sym('x', 'variable', 135, 100),
        sym('+', 'operator', 175, 105),
        sym('5', 'digit', 215, 100),
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('2x + 5');
    });
  });

  describe('2. Powers (Exponents)', () => {
    it('recognizes x² as Power(x, 2)', () => {
      const symbols = [
        sym('x', 'variable', 100, 100, 35, 50),
        sym('2', 'digit', 142, 80, 20, 28), // elevated above baseline
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(tree.type).toBe('Power');
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('x^{2}');

      const ast = StructuralTreeBuilder.toAST(tree);
      expect(ast.type).toBe('POWER');
      expect(ast.operator).toBe('^');
    });

    it('recognizes 2x²', () => {
      const symbols = [
        sym('2', 'digit', 100, 100, 28, 48),
        sym('x', 'variable', 135, 100, 35, 50),
        sym('2', 'digit', 175, 82, 20, 28), // power exponent
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('2x^{2}');
    });

    it('recognizes x² + 5x', () => {
      const symbols = [
        sym('x', 'variable', 100, 100, 35, 50),
        sym('2', 'digit', 140, 80, 20, 28), // power
        sym('+', 'operator', 175, 105, 25, 25),
        sym('5', 'digit', 210, 100, 28, 48),
        sym('x', 'variable', 245, 100, 35, 50),
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('x^{2} + 5x');
    });

    it('recognizes (x + 2)²', () => {
      const symbols = [
        sym('(', 'fence', 80, 95, 15, 60),
        sym('x', 'variable', 105, 100, 30, 48),
        sym('+', 'operator', 145, 105, 25, 25),
        sym('2', 'digit', 180, 100, 25, 48),
        sym(')', 'fence', 215, 95, 15, 60),
        sym('2', 'digit', 238, 78, 20, 28), // power over parenthesis
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(tree.type).toBe('Power');
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('(x + 2)^{2}');
    });
  });

  describe('3. Fractions', () => {
    it('recognizes numerical fraction 1/2', () => {
      const symbols = [
        sym('1', 'digit', 110, 80, 20, 35), // Numerator
        sym('-', 'fraction_bar', 95, 125, 50, 6), // Fraction Bar
        sym('2', 'digit', 110, 140, 20, 35), // Denominator
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(tree.type).toBe('Fraction');
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('\\frac{1}{2}');

      const ast = StructuralTreeBuilder.toAST(tree);
      expect(ast.type).toBe('FRACTION');
    });

    it('recognizes algebraic fraction (x + 1) / (x - 2)', () => {
      const symbols = [
        // Numerator x + 1 (y: 80)
        sym('x', 'variable', 100, 80),
        sym('+', 'operator', 135, 85),
        sym('1', 'digit', 170, 80),
        // Fraction Bar at y: 135 spanning from x=90 to x=210
        sym('-', 'fraction_bar', 90, 135, 120, 6),
        // Denominator x - 2 (y: 155)
        sym('x', 'variable', 100, 155),
        sym('-', 'operator', 135, 160),
        sym('2', 'digit', 170, 155),
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(tree.type).toBe('Fraction');
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('\\frac{x + 1}{x - 2}');
    });
  });

  describe('4. Radicals (Roots)', () => {
    it('recognizes √x', () => {
      const symbols = [
        sym('√', 'radical', 100, 95, 75, 60),
        sym('x', 'variable', 135, 105, 30, 45), // inside radical
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(tree.type).toBe('Radical');
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('\\sqrt{x}');
    });

    it('recognizes √(x + 1)', () => {
      const symbols = [
        sym('√', 'radical', 100, 95, 135, 60),
        sym('x', 'variable', 135, 105, 28, 45),
        sym('+', 'operator', 170, 110, 22, 25),
        sym('1', 'digit', 200, 105, 25, 45),
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(tree.type).toBe('Radical');
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('\\sqrt{x + 1}');
    });
  });

  describe('5. Subscripts', () => {
    it('recognizes x₁', () => {
      const symbols = [
        sym('x', 'variable', 100, 100, 35, 50),
        sym('1', 'digit', 142, 135, 18, 26), // subscript below baseline
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(tree.type).toBe('Subscript');
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('x_{1}');
    });
  });

  describe('6. Mixed Quadratic Equation', () => {
    it('recognizes 2x² + 5x - 3 = 0 with full AST', () => {
      const symbols = [
        sym('2', 'digit', 80, 100, 25, 48),
        sym('x', 'variable', 115, 100, 35, 50),
        sym('2', 'digit', 155, 80, 20, 28), // power
        sym('+', 'operator', 190, 105, 25, 25),
        sym('5', 'digit', 225, 100, 25, 48),
        sym('x', 'variable', 260, 100, 35, 50),
        sym('-', 'operator', 305, 115, 25, 6),
        sym('3', 'digit', 340, 100, 25, 48),
        sym('=', 'operator', 380, 108, 30, 20),
        sym('0', 'digit', 425, 100, 25, 48),
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(tree.type).toBe('Equation');
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('2x^{2} + 5x - 3 = 0');

      const ast = StructuralTreeBuilder.toAST(tree);
      expect(ast.type).toBe('EQUATION');
      expect(ast.operator).toBe('=');
    });
  });

  describe('7. Calculus Expressions', () => {
    it('recognizes integral ∫ x² dx', () => {
      const symbols = [
        sym('∫', 'calculus', 80, 80, 25, 90),
        sym('x', 'variable', 115, 100, 30, 48),
        sym('2', 'digit', 150, 82, 18, 26),
        sym('d', 'variable', 180, 100, 25, 48),
        sym('x', 'variable', 215, 100, 30, 48),
      ];
      const tree = StructuralTreeBuilder.buildTree(symbols);
      expect(tree.type).toBe('Calculus');
      expect(StructuralTreeBuilder.toLatex(tree)).toBe('\\int x^{2} dx');
    });
  });
});
