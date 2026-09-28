import { describe, it, expect, beforeEach } from 'vitest';
import { MathematicalStrokeRecognizer, Stroke, TemplateStore } from '../src/index';

describe('Mathematical Handwriting Recognition Engine ($P Point Cloud & Multi-Examples)', () => {
  beforeEach(() => {
    const store = TemplateStore.getInstance();
    store.resetProfileToDefaults('default');
    store.resetProfileToDefaults('profesor');
    store.setActiveProfile('default');
  });

  it('recognizes a horizontal line as minus sign', () => {
    // Horizontal line: (10, 50) to (60, 50)
    const points = [
      { x: 10, y: 50, time: 100 },
      { x: 35, y: 50, time: 120 },
      { x: 60, y: 50, time: 140 },
    ];
    const { latex, glyphs } = MathematicalStrokeRecognizer.recognizeStrokesToLatex([points]);
    expect(glyphs.length).toBe(1);
    expect(latex).toBe('-');
  });

  it('recognizes a vertical line as number 1', () => {
    // Vertical line: (50, 10) to (50, 80)
    const points = [
      { x: 50, y: 10, time: 100 },
      { x: 50, y: 45, time: 120 },
      { x: 50, y: 80, time: 140 },
    ];
    const { latex, glyphs } = MathematicalStrokeRecognizer.recognizeStrokesToLatex([points]);
    expect(glyphs.length).toBe(1);
    expect(latex).toBe('1');
  });

  it('recognizes two parallel horizontal strokes as equal sign =', () => {
    // Stroke 1: (10, 40) to (50, 40)
    const s1 = [
      { x: 10, y: 40, time: 100 },
      { x: 50, y: 40, time: 120 },
    ];
    // Stroke 2: (10, 55) to (50, 55)
    const s2 = [
      { x: 10, y: 55, time: 150 },
      { x: 50, y: 55, time: 170 },
    ];
    const { latex, glyphs } = MathematicalStrokeRecognizer.recognizeStrokesToLatex([s1, s2]);
    expect(glyphs.length).toBe(1);
    expect(latex).toBe('=');
  });

  it('recognizes a closed loop stroke as 0', () => {
    // Circle: (30, 20) -> (50, 40) -> (30, 60) -> (10, 40) -> (30, 20)
    const points = [
      { x: 30, y: 20, time: 100 },
      { x: 50, y: 40, time: 120 },
      { x: 30, y: 60, time: 140 },
      { x: 10, y: 40, time: 160 },
      { x: 30, y: 20, time: 180 },
    ];
    const stroke = new Stroke(points);
    expect(stroke.isClosed).toBe(true);
    const { latex } = MathematicalStrokeRecognizer.recognizeStrokesToLatex([points]);
    expect(latex).toBe('0');
  });

  it('prioritizes user-calibrated multi-examples in a teacher/student profile', () => {
    const store = TemplateStore.getInstance();
    store.setActiveProfile('profesor');

    // A specific zigzag shape trained as variable 'z'
    const customZ1 = [
      [{ x: 10, y: 10 }, { x: 40, y: 10 }, { x: 10, y: 40 }, { x: 40, y: 40 }],
    ];
    const customZ2 = [
      [{ x: 12, y: 12 }, { x: 42, y: 12 }, { x: 12, y: 42 }, { x: 42, y: 42 }],
    ];

    // Add multiple examples to teacher's profile
    store.addExample('z', 'z', customZ1);
    store.addExample('z', 'z', customZ2);

    expect(store.getExamplesForSymbol('z', 'profesor').length).toBe(2);

    // Test recognizing a similar stroke under teacher profile
    const testZ = [
      [{ x: 11, y: 11 }, { x: 41, y: 11 }, { x: 11, y: 41 }, { x: 41, y: 41 }],
    ];

    const result = MathematicalStrokeRecognizer.recognizeStrokesToLatex(testZ, 'profesor');
    expect(result.glyphs[0].symbol).toBe('z');
    expect(result.latex).toBe('z');
  });

  it('clusters crossed strokes into x, but preserves horizontal separation for ( 2 x )', () => {
    // 1. Left parenthesis: curves to the left
    const pLeft = [
      { x: 25, y: 15, time: 10 },
      { x: 12, y: 50, time: 20 },
      { x: 25, y: 85, time: 30 },
    ];
    // 2. Digit 2 (side by side, x ~ 40..65)
    const p2 = [
      { x: 40, y: 35, time: 40 },
      { x: 60, y: 30, time: 50 },
      { x: 40, y: 85, time: 60 },
      { x: 65, y: 85, time: 70 },
    ];
    // 3. Variable x: 2 crossed diagonal strokes (x ~ 80..105)
    const pX1 = [
      { x: 80, y: 35, time: 80 },
      { x: 105, y: 85, time: 90 },
    ];
    const pX2 = [
      { x: 105, y: 35, time: 100 },
      { x: 80, y: 85, time: 110 },
    ];
    // 4. Right parenthesis: curves to the right (x ~ 120..135)
    const pRight = [
      { x: 120, y: 15, time: 120 },
      { x: 133, y: 50, time: 130 },
      { x: 120, y: 85, time: 140 },
    ];
    // 5. Exponent 2: elevated superscript (x ~ 145..165, y ~ 10..40)
    const pExp2 = [
      { x: 145, y: 20, time: 150 },
      { x: 160, y: 15, time: 160 },
      { x: 145, y: 40, time: 170 },
      { x: 165, y: 40, time: 180 },
    ];

    const strokes = [pLeft, p2, pX1, pX2, pRight, pExp2].map((pts) => new Stroke(pts));
    const clusters = MathematicalStrokeRecognizer.clusterStrokes(strokes);

    // Should create exactly 5 clusters: '(', '2', 'x' (2 crossed strokes), ')', '2'
    expect(clusters.length).toBe(5);
    // Cluster for x should have the 2 crossed strokes
    const xCluster = clusters.find((c) => c.length === 2);
    expect(xCluster).toBeDefined();

    // Verify individual glyph classification
    const symLeft = MathematicalStrokeRecognizer.classifyCluster(clusters[0]);
    expect(symLeft.symbol).toBe('(');
    expect(symLeft.category).toBe('fence');

    const symX = MathematicalStrokeRecognizer.classifyCluster(xCluster!);
    expect(symX.symbol).toBe('x');
    expect(symX.category).toBe('variable');

    const symRight = MathematicalStrokeRecognizer.classifyCluster(clusters[3]);
    expect(symRight.symbol).toBe(')');
    expect(symRight.category).toBe('fence');
  });

  it('correctly interprets (2x^x)^2 handwritten strokes into structured mathematical LaTeX and AST', () => {
    // Left parenthesis '('
    const pLeft = [
      { x: 25, y: 15, time: 10 },
      { x: 12, y: 50, time: 20 },
      { x: 25, y: 85, time: 30 },
    ];
    // Digit '2' with curved arch top
    const p2 = [
      { x: 35, y: 38, time: 40 },
      { x: 50, y: 18, time: 45 },
      { x: 65, y: 38, time: 50 },
      { x: 50, y: 60, time: 55 },
      { x: 35, y: 85, time: 60 },
      { x: 70, y: 85, time: 70 },
    ];
    // Base variable 'x'
    const pX1 = [
      { x: 80, y: 35, time: 80 },
      { x: 105, y: 85, time: 90 },
    ];
    const pX2 = [
      { x: 105, y: 35, time: 100 },
      { x: 80, y: 85, time: 110 },
    ];
    // Elevated exponent variable '^x'
    const pExpX1 = [
      { x: 112, y: 15, time: 120 },
      { x: 128, y: 45, time: 130 },
    ];
    const pExpX2 = [
      { x: 128, y: 15, time: 140 },
      { x: 112, y: 45, time: 150 },
    ];
    // Right parenthesis ')'
    const pRight = [
      { x: 138, y: 15, time: 160 },
      { x: 150, y: 50, time: 170 },
      { x: 138, y: 85, time: 180 },
    ];
    // Elevated exponent digit '^2' with curved arch top
    const pExp2 = [
      { x: 160, y: 22, time: 190 },
      { x: 170, y: 12, time: 195 },
      { x: 180, y: 22, time: 200 },
      { x: 170, y: 32, time: 205 },
      { x: 160, y: 44, time: 210 },
      { x: 182, y: 44, time: 220 },
    ];

    const rawStrokes = [pLeft, p2, pX1, pX2, pExpX1, pExpX2, pRight, pExp2];
    const result = MathematicalStrokeRecognizer.recognizeStrokesToLatex(rawStrokes);

    expect(result.glyphs.length).toBe(6);
    expect(result.glyphs.map((g) => g.symbol)).toEqual(['(', '2', 'x', 'x', ')', '2']);

    // AST and LaTeX should be (2x^{x})^{2}
    expect(result.latex).toBe('(2x^{x})^{2}');
    expect(result.tree).toBeDefined();
    expect(result.tree?.type).toBe('Power');
  });

  it('correctly interprets (2x)^2 handwritten strokes into structured mathematical LaTeX', () => {
    // Left parenthesis '('
    const pLeft = [
      { x: 25, y: 15, time: 10 },
      { x: 12, y: 50, time: 20 },
      { x: 25, y: 85, time: 30 },
    ];
    // Digit '2'
    const p2 = [
      { x: 35, y: 38, time: 40 },
      { x: 50, y: 18, time: 45 },
      { x: 65, y: 38, time: 50 },
      { x: 50, y: 60, time: 55 },
      { x: 35, y: 85, time: 60 },
      { x: 70, y: 85, time: 70 },
    ];
    // Base variable 'x'
    const pX1 = [
      { x: 80, y: 35, time: 80 },
      { x: 105, y: 85, time: 90 },
    ];
    const pX2 = [
      { x: 105, y: 35, time: 100 },
      { x: 80, y: 85, time: 110 },
    ];
    // Right parenthesis ')'
    const pRight = [
      { x: 115, y: 15, time: 120 },
      { x: 127, y: 50, time: 130 },
      { x: 115, y: 85, time: 140 },
    ];
    // Elevated exponent digit '^2'
    const pExp2 = [
      { x: 138, y: 22, time: 150 },
      { x: 148, y: 12, time: 155 },
      { x: 158, y: 22, time: 160 },
      { x: 148, y: 32, time: 165 },
      { x: 138, y: 44, time: 170 },
      { x: 160, y: 44, time: 180 },
    ];

    const rawStrokes = [pLeft, p2, pX1, pX2, pRight, pExp2];
    const result = MathematicalStrokeRecognizer.recognizeStrokesToLatex(rawStrokes);

    expect(result.glyphs.length).toBe(5);
    expect(result.glyphs.map((g) => g.symbol)).toEqual(['(', '2', 'x', ')', '2']);
    expect(result.latex).toBe('(2x)^{2}');
    expect(result.tree?.type).toBe('Power');
  });
});
