import { describe, it, expect } from 'vitest';
import { StrikethroughDetector, type TargetBounds } from '../src/strikethrough';

describe('StrikethroughDetector (Tachado Gesture Recognition)', () => {
  const targets: TargetBounds[] = [
    {
      id: 'eq-1',
      bbox: {
        minX: 100,
        maxX: 300,
        minY: 100,
        maxY: 150,
        width: 200,
        height: 50,
        centerX: 200,
        centerY: 125,
      },
    },
    {
      id: 'eq-2',
      bbox: {
        minX: 100,
        maxX: 250,
        minY: 250,
        maxY: 300,
        width: 150,
        height: 50,
        centerX: 175,
        centerY: 275,
      },
    },
  ];

  it('detects a horizontal slash striking through an expression', () => {
    // Horizontal line cutting from (90, 125) to (310, 125) across eq-1
    const strikePoints = [
      { x: 90, y: 125, time: 100 },
      { x: 200, y: 125, time: 150 },
      { x: 310, y: 125, time: 200 },
    ];

    const match = StrikethroughDetector.detectStrikethrough(strikePoints, targets);
    expect(match.isStrikethrough).toBe(true);
    expect(match.targetId).toBe('eq-1');
    expect(match.confidence).toBeGreaterThan(0.7);
  });

  it('detects a zigzag scribble over an expression as strikethrough', () => {
    // Zigzag over eq-2 (Y ~ 275)
    const scribble = [
      { x: 120, y: 270, time: 100 },
      { x: 230, y: 275, time: 130 },
      { x: 130, y: 278, time: 160 },
      { x: 220, y: 280, time: 190 },
    ];

    const match = StrikethroughDetector.detectStrikethrough(scribble, targets);
    expect(match.isStrikethrough).toBe(true);
    expect(match.targetId).toBe('eq-2');
  });

  it('does NOT trigger strikethrough for a normal stroke far away from targets', () => {
    // Minus sign in another quadrant (500, 500)
    const normalMinus = [
      { x: 500, y: 500, time: 100 },
      { x: 530, y: 500, time: 140 },
    ];

    const match = StrikethroughDetector.detectStrikethrough(normalMinus, targets);
    expect(match.isStrikethrough).toBe(false);
  });
});
