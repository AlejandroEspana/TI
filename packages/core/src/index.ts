import type { BoardObject } from '@mathboard/shared';

export interface BoardState {
  objects: Map<string, BoardObject>;
  selectedIds: string[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

export class ObjectManager {
  private objects: Map<string, BoardObject> = new Map();

  addObject(obj: BoardObject): void {
    this.objects.set(obj.id, obj);
  }

  getObject(id: string): BoardObject | undefined {
    return this.objects.get(id);
  }

  removeObject(id: string): boolean {
    return this.objects.delete(id);
  }

  getAllObjects(): BoardObject[] {
    return Array.from(this.objects.values());
  }

  clear(): void {
    this.objects.clear();
  }
}
