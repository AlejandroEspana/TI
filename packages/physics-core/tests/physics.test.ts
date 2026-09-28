import { describe, it, expect } from 'vitest';
import { PhysicsEngine2D } from '../src/index';

describe('Deterministic Physics Engine 2D', () => {
  it('updates position under constant gravitational acceleration', () => {
    const engine = new PhysicsEngine2D();
    engine.gravity = { x: 0, y: -10 };
    engine.airResistanceCoefficient = 0; // frictionless

    engine.addBody({
      id: 'ball',
      mass: 1,
      position: { x: 0, y: 100 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      forces: [],
    });

    // Step 1 second (dt = 1)
    engine.step(1);
    const body = engine.getBody('ball');
    expect(body).toBeDefined();
    // v = v0 + a*dt = 0 + (-10)*1 = -10
    expect(body?.velocity.y).toBe(-10);
    // y = y0 + v*dt = 100 + (-10)*1 = 90
    expect(body?.position.y).toBe(90);
  });

  it('calculates total mechanical energy conservation', () => {
    const engine = new PhysicsEngine2D();
    engine.gravity = { x: 0, y: -10 };
    engine.airResistanceCoefficient = 0;

    engine.addBody({
      id: 'pendulum',
      mass: 2,
      position: { x: 0, y: 50 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      forces: [],
    });

    const initialEnergy = engine.calculateEnergy('pendulum', 0);
    // Potential = 2 * 10 * 50 = 1000 J, Kinetic = 0
    expect(initialEnergy?.potential).toBe(1000);
    expect(initialEnergy?.kinetic).toBe(0);
    expect(initialEnergy?.total).toBe(1000);
  });

  it('calculates analytical projectile trajectory', () => {
    // 45 degrees, v0 = 10 m/s
    const traj = PhysicsEngine2D.calculateProjectileTrajectory(10, 45, 9.81, 10);
    expect(traj.length).toBe(11);
    expect(traj[0].x).toBe(0);
    expect(traj[0].y).toBe(0);
    expect(traj[traj.length - 1].y).toBeCloseTo(0, 1);
  });
});
