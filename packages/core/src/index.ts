import type { BoardObject, Position } from '@mathboard/shared';

export * from './scope';

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CoordinateTransformer {
  screenToWorld(screen: Position, viewport: Viewport): Position;
  worldToScreen(world: Position, viewport: Viewport): Position;
}

export const defaultCoordinateTransformer: CoordinateTransformer = {
  screenToWorld(screen: Position, viewport: Viewport): Position {
    return {
      x: (screen.x - viewport.x) / viewport.zoom,
      y: (screen.y - viewport.y) / viewport.zoom,
    };
  },
  worldToScreen(world: Position, viewport: Viewport): Position {
    return {
      x: world.x * viewport.zoom + viewport.x,
      y: world.y * viewport.zoom + viewport.y,
    };
  },
};

/**
 * Command Pattern for Board Operations (Undo / Redo)
 */
export interface Command {
  readonly description: string;
  execute(): void;
  undo(): void;
}

export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxDepth: number = 100;
  private listeners: (() => void)[] = [];

  constructor(maxDepth = 100) {
    this.maxDepth = maxDepth;
  }

  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.notify();
  }

  undo(): boolean {
    const cmd = this.undoStack.pop();
    if (!cmd) return false;
    cmd.undo();
    this.redoStack.push(cmd);
    this.notify();
    return true;
  }

  redo(): boolean {
    const cmd = this.redoStack.pop();
    if (!cmd) return false;
    cmd.execute();
    this.undoStack.push(cmd);
    this.notify();
    return true;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/**
 * Object Manager with Observer Pattern & Serialization
 */
export type ObjectChangeType = 'add' | 'update' | 'delete' | 'clear';
export type ObjectChangeListener = (type: ObjectChangeType, obj?: BoardObject) => void;

export class ObjectManager {
  private objects: Map<string, BoardObject> = new Map();
  private selectedIds: Set<string> = new Set();
  private listeners: ObjectChangeListener[] = [];

  addObject(obj: BoardObject): void {
    this.objects.set(obj.id, { ...obj, updatedAt: new Date().toISOString() });
    this.notify('add', obj);
  }

  getObject(id: string): BoardObject | undefined {
    return this.objects.get(id);
  }

  updateObject(id: string, updates: Partial<BoardObject>): BoardObject | undefined {
    const existing = this.objects.get(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as BoardObject;
    this.objects.set(id, updated);
    this.notify('update', updated);
    return updated;
  }

  removeObject(id: string): boolean {
    const existing = this.objects.get(id);
    if (!existing) return false;
    this.objects.delete(id);
    this.selectedIds.delete(id);
    this.notify('delete', existing);
    return true;
  }

  getAllObjects(): BoardObject[] {
    return Array.from(this.objects.values());
  }

  clear(): void {
    this.objects.clear();
    this.selectedIds.clear();
    this.notify('clear');
  }

  // Selection
  select(id: string, multi = false): void {
    if (!multi) this.selectedIds.clear();
    if (this.objects.has(id)) {
      this.selectedIds.add(id);
    }
  }

  deselect(id: string): void {
    this.selectedIds.delete(id);
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  getSelectedObjects(): BoardObject[] {
    return this.getSelectedIds()
      .map((id) => this.objects.get(id))
      .filter((o): o is BoardObject => o !== undefined);
  }

  // Serialization
  toJSON(): string {
    return JSON.stringify({
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      objects: Array.from(this.objects.values()),
    }, null, 2);
  }

  fromJSON(jsonStr: string): void {
    const data = JSON.parse(jsonStr);
    if (Array.isArray(data.objects)) {
      this.clear();
      for (const obj of data.objects) {
        if (obj && obj.id && obj.type && obj.position) {
          this.addObject(obj);
        }
      }
    }
  }

  subscribe(listener: ObjectChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(type: ObjectChangeType, obj?: BoardObject): void {
    for (const listener of this.listeners) {
      listener(type, obj);
    }
  }
}

/**
 * Concrete Commands
 */
export class AddObjectCommand implements Command {
  readonly description = 'Add board object';

  constructor(
    private manager: ObjectManager,
    private object: BoardObject
  ) {}

  execute(): void {
    this.manager.addObject(this.object);
  }

  undo(): void {
    this.manager.removeObject(this.object.id);
  }
}

export class DeleteObjectCommand implements Command {
  readonly description = 'Delete board object';
  private previousState?: BoardObject;

  constructor(
    private manager: ObjectManager,
    private objectId: string
  ) {
    this.previousState = manager.getObject(objectId);
  }

  execute(): void {
    this.manager.removeObject(this.objectId);
  }

  undo(): void {
    if (this.previousState) {
      this.manager.addObject(this.previousState);
    }
  }
}

export class MoveObjectCommand implements Command {
  readonly description = 'Move board object';

  constructor(
    private manager: ObjectManager,
    private objectId: string,
    private oldPosition: Position,
    private newPosition: Position
  ) {}

  execute(): void {
    this.manager.updateObject(this.objectId, { position: this.newPosition });
  }

  undo(): void {
    this.manager.updateObject(this.objectId, { position: this.oldPosition });
  }
}
