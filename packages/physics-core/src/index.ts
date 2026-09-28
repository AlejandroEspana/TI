/**
 * @mathboard/physics-core
 * Deterministic Newtonian Physics Engine
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface PhysicsBody {
  id: string;
  mass: number;
  position: Vector2;
  velocity: Vector2;
  acceleration: Vector2;
  forces: Vector2[];
  isStatic?: boolean;
  radius?: number;
  color?: string;
}

export interface EnergyMetrics {
  kinetic: number;
  potential: number;
  total: number;
}

export class PhysicsEngine2D {
  public gravity: Vector2 = { x: 0, y: -9.81 };
  public airResistanceCoefficient: number = 0.01;
  public bodies: Map<string, PhysicsBody> = new Map();

  addBody(body: PhysicsBody): void {
    this.bodies.set(body.id, {
      ...body,
      forces: [...(body.forces || [])],
    });
  }

  getBody(id: string): PhysicsBody | undefined {
    return this.bodies.get(id);
  }

  removeBody(id: string): boolean {
    return this.bodies.delete(id);
  }

  clear(): void {
    this.bodies.clear();
  }

  /**
   * Apply a force vector to a specific body
   */
  applyForce(id: string, force: Vector2): void {
    const body = this.bodies.get(id);
    if (body && !body.isStatic) {
      body.forces.push(force);
    }
  }

  /**
   * Symplectic Semi-Implicit Euler Step
   * Preserves mechanical energy better than standard forward Euler.
   */
  step(dt: number): void {
    if (dt <= 0) return;

    for (const body of this.bodies.values()) {
      if (body.isStatic || body.mass <= 0) continue;

      // 1. Calculate net force: Gravity + Air Drag + Applied Forces
      let netFx = body.mass * this.gravity.x;
      let netFy = body.mass * this.gravity.y;

      // Linear Drag
      netFx -= this.airResistanceCoefficient * body.velocity.x;
      netFy -= this.airResistanceCoefficient * body.velocity.y;

      // Accumulate external forces
      for (const f of body.forces) {
        netFx += f.x;
        netFy += f.y;
      }
      // Clear applied forces for the step
      body.forces = [];

      // 2. Acceleration = F_net / m
      body.acceleration.x = netFx / body.mass;
      body.acceleration.y = netFy / body.mass;

      // 3. Update velocity
      body.velocity.x += body.acceleration.x * dt;
      body.velocity.y += body.acceleration.y * dt;

      // 4. Update position (using new velocity - semi-implicit)
      body.position.x += body.velocity.x * dt;
      body.position.y += body.velocity.y * dt;
    }
  }

  /**
   * Compute mechanical energy of a body
   * (assuming reference potential energy at y = 0)
   */
  calculateEnergy(id: string, groundY = 0): EnergyMetrics | null {
    const body = this.bodies.get(id);
    if (!body) return null;

    const speedSq = body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y;
    const kinetic = 0.5 * body.mass * speedSq;

    // Potential energy: m * g * h (assuming gravity acts along y)
    const height = Math.max(0, body.position.y - groundY);
    const gMagnitude = Math.abs(this.gravity.y);
    const potential = body.mass * gMagnitude * height;

    return {
      kinetic,
      potential,
      total: kinetic + potential,
    };
  }

  /**
   * Analytical projectile trajectory calculation
   * y(x) = x * tan(theta) - (g * x^2) / (2 * v0^2 * cos^2(theta))
   */
  static calculateProjectileTrajectory(
    v0: number,
    angleDeg: number,
    g = 9.81,
    steps = 50
  ): { x: number; y: number }[] {
    const theta = (angleDeg * Math.PI) / 180;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    if (cosTheta === 0 || g <= 0 || v0 <= 0) return [];

    // Total flight time: 2 * v0 * sin(theta) / g
    const flightTime = (2 * v0 * sinTheta) / g;
    const dt = flightTime / steps;
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const x = v0 * cosTheta * t;
      const y = Math.max(0, v0 * sinTheta * t - 0.5 * g * t * t);
      points.push({ x, y });
    }

    return points;
  }
}
