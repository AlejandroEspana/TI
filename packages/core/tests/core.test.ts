import { describe, it, expect } from 'vitest';
import {
  ObjectManager,
  CommandHistory,
  AddObjectCommand,
  DeleteObjectCommand,
  MoveObjectCommand,
  defaultCoordinateTransformer,
} from '../src/index';
import type { MathBoardObject } from '@mathboard/shared';

describe('ObjectManager & Command History (Undo/Redo)', () => {
  it('adds and removes objects via commands with full undo/redo capability', () => {
    const manager = new ObjectManager();
    const history = new CommandHistory();

    const obj: MathBoardObject = {
      id: 'math-1',
      type: 'math',
      latex: 'x^2 - 4 = 0',
      source: 'keyboard',
      position: { x: 100, y: 100 },
    };

    // Execute Add
    const addCmd = new AddObjectCommand(manager, obj);
    history.execute(addCmd);
    expect(manager.getAllObjects().length).toBe(1);
    expect(manager.getObject('math-1')).toBeDefined();

    // Undo Add
    expect(history.canUndo).toBe(true);
    history.undo();
    expect(manager.getAllObjects().length).toBe(0);

    // Redo Add
    expect(history.canRedo).toBe(true);
    history.redo();
    expect(manager.getAllObjects().length).toBe(1);
  });

  it('moves objects with undo/redo', () => {
    const manager = new ObjectManager();
    const history = new CommandHistory();

    const obj: MathBoardObject = {
      id: 'math-2',
      type: 'math',
      latex: 'y = 2x',
      source: 'keyboard',
      position: { x: 50, y: 50 },
    };
    manager.addObject(obj);

    const moveCmd = new MoveObjectCommand(manager, 'math-2', { x: 50, y: 50 }, { x: 200, y: 300 });
    history.execute(moveCmd);
    expect(manager.getObject('math-2')?.position).toEqual({ x: 200, y: 300 });

    history.undo();
    expect(manager.getObject('math-2')?.position).toEqual({ x: 50, y: 50 });
  });

  it('transforms coordinates accurately between screen and world coordinates', () => {
    const viewport = { x: 50, y: 100, zoom: 2.0 };
    const screenPt = { x: 250, y: 300 };

    const worldPt = defaultCoordinateTransformer.screenToWorld(screenPt, viewport);
    // x = (250 - 50) / 2 = 100
    // y = (300 - 100) / 2 = 100
    expect(worldPt).toEqual({ x: 100, y: 100 });

    const backToScreen = defaultCoordinateTransformer.worldToScreen(worldPt, viewport);
    expect(backToScreen).toEqual(screenPt);
  });
});
