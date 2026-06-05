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
      return false; // don't move while stunned
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
