import { describe, it, expect } from 'vitest';
import { MathLexer, SemanticAnalyzer, classifyExpression } from '../src/index';

describe('Math Lexer and Semantic Analyzer', () => {
  it('tokenizes complex latex equations', () => {
    const lexer = new MathLexer('2x^2 + 5x - 3 = 0');
    const tokens = lexer.tokenize();
    expect(tokens.length).toBeGreaterThan(5);
    expect(tokens.some((t) => t.type === 'EQUALS')).toBe(true);
    expect(tokens.some((t) => t.type === 'POWER')).toBe(true);
  });

  it('correctly classifies a quadratic equation', () => {
    const analysis = SemanticAnalyzer.analyze('2x^2 + 5x - 3 = 0');
    expect(analysis.semanticType).toBe('equation');
    expect(analysis.degree).toBe(2);
    expect(analysis.isQuadratic).toBe(true);
    expect(analysis.variables).toEqual(['x']);
  });

  it('classifies derivatives and integrals', () => {
    expect(classifyExpression('\\frac{d}{dx}(x^2)')).toBe('derivative');
    expect(classifyExpression("\\int x^2 dx")).toBe('integral');
  });

  it('classifies matrices', () => {
    expect(classifyExpression('\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}')).toBe('matrix');
  });
});
