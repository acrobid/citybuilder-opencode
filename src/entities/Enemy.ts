import { PLANET_CENTER_X, PLANET_CENTER_Y } from "../config.js";

export type EnemyTypeName = "asteroid" | "scout" | "mothership";

export class Enemy {
  type: EnemyTypeName;
  worldX: number;
  worldY: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  radius: number;
  score: number;
  alive = true;
  hasSpawnedScouts = false;
  // Special effects (applied by DefenseSystem)
  slowTimer = 0; // >0 = slowed (remaining ms)
  stunTimer = 0; // >0 = stunned (remaining ms)
  shootTimer = 0; // cooldown until next shot
  knockbackVx = 0;
  knockbackVy = 0;
  ejectionVx = 0;
  ejectionVy = 0;
  ejectionTimer = 0;

  constructor(
    type: EnemyTypeName,
    worldX: number,
    worldY: number,
    health: number,
    speed: number,
    damage: number,
    radius: number,
    score: number,
  ) {
    this.type = type;
    this.worldX = worldX;
    this.worldY = worldY;
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.damage = damage;
    this.radius = radius;
    this.score = score;
  }

  /** Move toward planet center. Returns true if reached surface. */
  update(delta: number): boolean {
    // Handle stun
    if (this.stunTimer > 0) {
      this.stunTimer -= delta;
      return false;
    }

    // Apply knockback
    if (this.knockbackVx !== 0 || this.knockbackVy !== 0) {
      this.worldX += this.knockbackVx * (delta / 1000);
      this.worldY += this.knockbackVy * (delta / 1000);
      this.knockbackVx *= 0.85;
      this.knockbackVy *= 0.85;
      if (Math.abs(this.knockbackVx) < 1 && Math.abs(this.knockbackVy) < 1) {
        this.knockbackVx = 0;
        this.knockbackVy = 0;
      }
    }

    // Mothership burst ejection (with corkscrew spiral)
    if (this.ejectionTimer > 0) {
      this.ejectionTimer -= delta;
      const speed = Math.sqrt(
        this.ejectionVx * this.ejectionVx + this.ejectionVy * this.ejectionVy,
      );
      const wobbleAmp = Math.min(120, speed * 0.3);
      const wobble = Math.sin(this.ejectionTimer * 0.015) * wobbleAmp;
      const perpX = -this.ejectionVy;
      const perpY = this.ejectionVx;
      const perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
      this.worldX += (this.ejectionVx + (perpX / perpLen) * wobble) * (delta / 1000);
      this.worldY += (this.ejectionVy + (perpY / perpLen) * wobble) * (delta / 1000);
      this.ejectionVx *= 0.93;
      this.ejectionVy *= 0.93;
    }

    const dx = PLANET_CENTER_X - this.worldX;
    const dy = PLANET_CENTER_Y - this.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return true;

    let effectiveSpeed = this.speed;
    if (this.slowTimer > 0) {
      effectiveSpeed *= 0.5;
      this.slowTimer -= delta;
    }

    const move = (effectiveSpeed * delta) / 1000;
    const nx = dx / dist;
    const ny = dy / dist;
    this.worldX += nx * move;
    this.worldY += ny * move;
    return false;
  }

  /** Returns true if enemy died */
  takeDamage(amount: number): boolean {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  distanceToCenter(): number {
    const dx = PLANET_CENTER_X - this.worldX;
    const dy = PLANET_CENTER_Y - this.worldY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
