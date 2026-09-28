/**
 * @mathboard/geometry-core
 * Pure 2D Computational Geometry Engine
 */

export interface Point2D {
  x: number;
  y: number;
}

export class Vector2D {
  constructor(public readonly x: number, public readonly y: number) {}

  static fromPoints(start: Point2D, end: Point2D): Vector2D {
    return new Vector2D(end.x - start.x, end.y - start.y);
  }

  get magnitude(): number {
    return Math.hypot(this.x, this.y);
  }

  get angle(): number {
    return Math.atan2(this.y, this.x);
  }

  add(v: Vector2D): Vector2D {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  subtract(v: Vector2D): Vector2D {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  dot(v: Vector2D): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vector2D): number {
    return this.x * v.y - this.y * v.x;
  }

  normalize(): Vector2D {
    const mag = this.magnitude;
    if (mag === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / mag, this.y / mag);
  }

  angleWith(v: Vector2D): number {
    const dot = this.dot(v);
    const mag = this.magnitude * v.magnitude;
    if (mag === 0) return 0;
    const cosTheta = Math.max(-1, Math.min(1, dot / mag));
    return Math.acos(cosTheta);
  }

  projectOnto(v: Vector2D): Vector2D {
    const vMagSq = v.dot(v);
    if (vMagSq === 0) return new Vector2D(0, 0);
    const scalar = this.dot(v) / vMagSq;
    return v.multiply(scalar);
  }
}

export class GeometryMath {
  static distance(p1: Point2D, p2: Point2D): number {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  static midpoint(p1: Point2D, p2: Point2D): Point2D {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  /**
   * Find intersection of two lines defined by points (p1-p2) and (p3-p4).
   * Returns null if parallel or collinear.
   */
  static lineIntersection(
    p1: Point2D,
    p2: Point2D,
    p3: Point2D,
    p4: Point2D
  ): Point2D | null {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(denom) < 1e-10) return null;

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    };
  }

  /**
   * Area of polygon using Shoelace formula
   */
  static polygonArea(points: Point2D[]): number {
    if (points.length < 3) return 0;
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      sum += points[i].x * points[j].y - points[j].x * points[i].y;
    }
    return Math.abs(sum) / 2;
  }

  /**
   * Centroid of polygon
   */
  static polygonCentroid(points: Point2D[]): Point2D {
    if (points.length === 0) return { x: 0, y: 0 };
    if (points.length === 1) return points[0];
    if (points.length === 2) return this.midpoint(points[0], points[1]);

    let cx = 0;
    let cy = 0;
    let signedArea = 0;

    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const factor = points[i].x * points[j].y - points[j].x * points[i].y;
      signedArea += factor;
      cx += (points[i].x + points[j].x) * factor;
      cy += (points[i].y + points[j].y) * factor;
    }

    signedArea *= 0.5;
    if (Math.abs(signedArea) < 1e-10) {
      // Degenerate collinear points - fallback to arithmetic mean
      const sumX = points.reduce((acc, p) => acc + p.x, 0);
      const sumY = points.reduce((acc, p) => acc + p.y, 0);
      return { x: sumX / points.length, y: sumY / points.length };
    }

    return {
      x: cx / (6 * signedArea),
      y: cy / (6 * signedArea),
    };
  }
}
