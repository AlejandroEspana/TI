export interface StrokePoint {
  x: number;
  y: number;
  time: number;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export class Stroke {
  public readonly bbox: BoundingBox;
  public readonly length: number;

  constructor(public readonly points: StrokePoint[]) {
    this.bbox = Stroke.computeBoundingBox(points);
    this.length = Stroke.computeLength(points);
  }

  get startPoint(): StrokePoint | undefined {
    return this.points[0];
  }

  get endPoint(): StrokePoint | undefined {
    return this.points[this.points.length - 1];
  }

  get isClosed(): boolean {
    if (!this.startPoint || !this.endPoint || this.points.length < 5) return false;
    const dist = Math.hypot(this.endPoint.x - this.startPoint.x, this.endPoint.y - this.startPoint.y);
    const diag = Math.hypot(this.bbox.width, this.bbox.height);
    return dist < 0.25 * diag;
  }

  get isHorizontalLine(): boolean {
    return this.bbox.width > 2.5 * this.bbox.height && this.bbox.width > 12;
  }

  get isVerticalLine(): boolean {
    return this.bbox.height > 2.5 * this.bbox.width && this.bbox.height > 12;
  }

  static computeBoundingBox(points: StrokePoint[]): BoundingBox {
    if (points.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    return {
      minX, maxX, minY, maxY, width, height,
      centerX: minX + width / 2,
      centerY: minY + height / 2,
    };
  }

  static computeLength(points: StrokePoint[]): number {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return len;
  }
}
