/**
 * PhysicsEngine.js - AG-04 Sector Physics Engine
 * Smooth vector shift (0, -9.81, 0) -> (0, +4.5, 0) with low-buoyancy dampening curves
 */
import { Vector2 } from "./Vector2.js";

export class PhysicsEngine {
  constructor(width = 1000, height = 620) {
    this.width = width;
    this.height = height;
    this.groundY = height - 70;

    // Gravity Configuration
    // In 3D physics: Normal = (0, -9.81, 0), Anti-Gravity = (0, +4.5, 0)
    // In 2D screen units (+y is down):
    // Normal 1G: acceleration downwards = +490 px/s^2
    // Anti-Gravity: acceleration upwards = -225 px/s^2
    this.GRAVITY_NORMAL_Y = 490.5; // corresponds to 1G (-9.81 m/s^2 in 3D)
    this.GRAVITY_AG_Y = -225.0;    // corresponds to +4.5 m/s^2 in 3D

    this.isAntiGravityActive = false;
    this.transitionProgress = 0.0; // 0.0 = 1G, 1.0 = full AG-04
    this.transitionDuration = 1.2; // seconds for smooth dampening curve transition

    // AG-04 Sector Definition
    this.sector = {
      id: "AG-04",
      x: 100,
      y: 40,
      width: width - 200,
      height: height - 120,
    };

    // Low-Buoyancy & Ether Fluid Dampening Parameters
    this.normalDrag = 0.002;
    this.agEtherDrag = 0.045; // dampening curve factor
    this.terminalUpwardSpeed = -240; // px/s clamp in floating realm
    this.neutralLevitationY = 160;   // equilibrium floating plane
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.groundY = height - 70;
    this.sector.x = 100;
    this.sector.y = 40;
    this.sector.width = width - 200;
    this.sector.height = height - 120;
  }

  toggleAntiGravity() {
    this.isAntiGravityActive = !this.isAntiGravityActive;
    return this.isAntiGravityActive;
  }

  update(dt) {
    // Smooth transition using S-curve (Hermite / SmoothStep interpolation)
    const target = this.isAntiGravityActive ? 1.0 : 0.0;
    const rate = dt / this.transitionDuration;
    if (this.transitionProgress < target) {
      this.transitionProgress = Math.min(target, this.transitionProgress + rate);
    } else if (this.transitionProgress > target) {
      this.transitionProgress = Math.max(target, this.transitionProgress - rate);
    }
  }

  // Smooth-step dampening curve: S(t) = 3t^2 - 2t^3
  getDampenedProgress() {
    const t = this.transitionProgress;
    return t * t * (3 - 2 * t);
  }

  // Current effective gravity vector in screen px/s^2
  getCurrentGravityY() {
    const p = this.getDampenedProgress();
    return this.GRAVITY_NORMAL_Y + (this.GRAVITY_AG_Y - this.GRAVITY_NORMAL_Y) * p;
  }

  // Formatted 3D physical gravity vector display string (0, Y, 0)
  getPhysicalGravityVectorString() {
    const p = this.getDampenedProgress();
    const physY = -9.81 + (4.50 - (-9.81)) * p;
    const sign = physY >= 0 ? "+" : "";
    return `(0.00, ${sign}${physY.toFixed(2)}, 0.00)`;
  }

  // Check if position is inside AG-04 Sector
  isInsideSector(x, y) {
    return (
      x >= this.sector.x &&
      x <= this.sector.x + this.sector.width &&
      y >= this.sector.y &&
      y <= this.sector.y + this.sector.height
    );
  }

  applyForces(entity, dt) {
    const p = this.getDampenedProgress();
    const inSector = this.isInsideSector(entity.pos.x, entity.pos.y);
    const sectorFactor = inSector ? p : 0;

    // 1. Gravity Acceleration
    const effectiveGravity = this.GRAVITY_NORMAL_Y + (this.GRAVITY_AG_Y - this.GRAVITY_NORMAL_Y) * sectorFactor;
    entity.acc.y += effectiveGravity;

    // 2. Low-Buoyancy Floating Dampening
    if (sectorFactor > 0.05) {
      // Viscous dampening curve opposes current velocity
      const dragFactor = this.normalDrag + (this.agEtherDrag - this.normalDrag) * sectorFactor;
      entity.acc.x -= entity.vel.x * dragFactor * 60;
      entity.acc.y -= entity.vel.y * dragFactor * 60;

      // Buoyant equilibrium spring force as entities approach neutral levitation plane
      if (entity.pos.y < this.neutralLevitationY) {
        const ceilingRepel = (this.neutralLevitationY - entity.pos.y) * 4.2;
        entity.acc.y += ceilingRepel;
      }

      // Terminal velocity clamping
      if (entity.vel.y < this.terminalUpwardSpeed) {
        entity.vel.y = this.terminalUpwardSpeed;
      }

      // Subtle oscillatory buoyancy bobbing
      const bobTime = Date.now() * 0.003;
      entity.acc.y += Math.sin(bobTime + (entity.pos.x * 0.02)) * 14 * sectorFactor;
    }
  }
}
