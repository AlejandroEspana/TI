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
});
