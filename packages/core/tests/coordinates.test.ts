import { describe, it, expect } from 'vitest';
import { CoordinateManager, type Viewport, type CanvasRect } from '../src/index';

describe('CoordinateManager (Precise Input Transformation)', () => {
  // Case A: Canvas without zoom or displacement
  it('Case A: handles 100% zoom and (0,0) pan with exact identity', () => {
    const viewport: Viewport = { x: 0, y: 0, zoom: 1.0 };
    const screenPt = { clientX: 250, clientY: 180 };
    const boardPt = CoordinateManager.screenToBoard(screenPt, viewport);

    expect(boardPt.x).toBe(250);
    expect(boardPt.y).toBe(180);

    const backToScreen = CoordinateManager.boardToScreen(boardPt, viewport);
    expect(backToScreen.x).toBe(250);
    expect(backToScreen.y).toBe(180);
  });

  // Case B: Canvas with zoom (50%, 150%, 250%)
  it('Case B: handles diverse zoom factors (50%, 150%, 250%) with exact scaling', () => {
    const zooms = [0.5, 1.5, 2.5];
    for (const zoom of zooms) {
      const viewport: Viewport = { x: 0, y: 0, zoom };
      const screenPt = { clientX: 300, clientY: 450 };
      const boardPt = CoordinateManager.screenToBoard(screenPt, viewport);

      expect(boardPt.x).toBeCloseTo(300 / zoom);
      expect(boardPt.y).toBeCloseTo(450 / zoom);

      const back = CoordinateManager.boardToScreen(boardPt, viewport);
      expect(back.x).toBeCloseTo(300);
      expect(back.y).toBeCloseTo(450);
    }
  });

  // Case C: Canvas with pan displacement
  it('Case C: handles positive and negative pan displacements', () => {
    const viewport: Viewport = { x: 120, y: -80, zoom: 1.0 };
    const screenPt = { clientX: 400, clientY: 200 };
    const boardPt = CoordinateManager.screenToBoard(screenPt, viewport);

    expect(boardPt.x).toBe(400 - 120);
    expect(boardPt.y).toBe(200 - (-80));

    const back = CoordinateManager.boardToScreen(boardPt, viewport);
    expect(back.x).toBe(400);
    expect(back.y).toBe(200);
  });

  // Case D: Canvas with zoom + displacement combined
  it('Case D: handles simultaneous zoom and pan displacement correctly', () => {
    const viewport: Viewport = { x: 150, y: 75, zoom: 1.75 };
    const screenPt = { clientX: 500, clientY: 350 };
    const boardPt = CoordinateManager.screenToBoard(screenPt, viewport);

    expect(boardPt.x).toBeCloseTo((500 - 150) / 1.75);
    expect(boardPt.y).toBeCloseTo((350 - 75) / 1.75);

    const back = CoordinateManager.boardToScreen(boardPt, viewport);
    expect(back.x).toBeCloseTo(500);
    expect(back.y).toBeCloseTo(350);
  });

  // Case E: Writing near edges with canvas rect offset
  it('Case E: accounts for DOM bounding client rect offset near edges', () => {
    const rect: CanvasRect = { left: 40, top: 60, width: 1200, height: 800 };
    const viewport: Viewport = { x: 50, y: 50, zoom: 1.2 };

    // Point near top-left edge of canvas
    const screenPt = { clientX: 42, clientY: 62 };
    const boardPt = CoordinateManager.screenToBoard(screenPt, viewport, rect);

    // offset relative to canvas: (2, 2)
    expect(boardPt.x).toBeCloseTo((2 - 50) / 1.2);
    expect(boardPt.y).toBeCloseTo((2 - 50) / 1.2);

    const back = CoordinateManager.boardToScreen(boardPt, viewport, rect);
    expect(back.x).toBeCloseTo(42);
    expect(back.y).toBeCloseTo(62);
  });

  // Case F: Invariance property (boardToScreen(screenToBoard(p)) === p)
  it('Case F: guarantees strict reversibility invariance across dynamic zooms', () => {
    const testPoints = [
      { clientX: 0, clientY: 0 },
      { clientX: 1920, clientY: 1080 },
      { clientX: 960, clientY: 540 },
      { clientX: -50, clientY: -30 },
    ];
    const viewports: Viewport[] = [
      { x: 0, y: 0, zoom: 1.0 },
      { x: -300, y: 400, zoom: 0.4 },
      { x: 550, y: -220, zoom: 2.8 },
      { x: 100, y: 100, zoom: 1.33 },
    ];
    const rect: CanvasRect = { left: 10, top: 20, width: 1920, height: 1080 };

    for (const v of viewports) {
      for (const p of testPoints) {
        const board = CoordinateManager.screenToBoard(p, v, rect);
        const screen = CoordinateManager.boardToScreen(board, v, rect);
        expect(screen.x).toBeCloseTo(p.clientX, 4);
        expect(screen.y).toBeCloseTo(p.clientY, 4);
      }
    }
  });
});
