import * as Phaser from "phaser";
import { SATELLITE_TYPES, SYNERGY, PLANET_CENTER_X, PLANET_CENTER_Y } from "../config.js";
import type { OrbitRing, SatelliteType } from "../config.js";
import { OrbitalSatellite } from "../entities/OrbitalSatellite.js";
import { Enemy } from "../entities/Enemy.js";
import {
  drawLaserBeam,
  drawMissileProj,
  drawPlasmaBlob,
  drawRailgunTracer,
  drawIonBolt,
  drawTeslaBolt,
  drawEMPWave,
  drawShieldWave,
  drawDroneProj,
} from "../graphics/SatelliteGraphics.js";
import { drawExplosion } from "../graphics/EnemyGraphics.js";

interface Projectile {
  worldX: number;
  worldY: number;
  targetEnemy: Enemy | null;
  speed: number;
  damage: number;
  alive: boolean;
  drawType: SatelliteType;
  angle: number;
  // specials
  piercedEnemies: Set<Enemy>; // railgun
  chainCount: number; // tesla
  droneLifetime: number; // drone hub
}

// Drone entity for drone hub
interface Drone {
  worldX: number;
  worldY: number;
  targetEnemy: Enemy | null;
  lifetime: number;
  damage: number;
  speed: number;
}

export class DefenseSystem {
  satellites: OrbitalSatellite[] = [];
  projectiles: Projectile[] = [];
  drones: Drone[] = [];
  private cooldowns: Map<OrbitalSatellite, number> = new Map();
  // Explosion effects (position, radius, remaining time)
  explosions: { x: number; y: number; r: number; time: number }[] = [];

  /** Place a satellite on the nearest ring at the cursor angle. Returns false if can't afford. */
  placeSatellite(type: SatelliteType, angle: number, ring: OrbitRing): boolean {
    const config = SATELLITE_TYPES[type];
    if (window.gameState.money < config.cost) return false;
    window.gameState.money -= config.cost;

    const sat = new OrbitalSatellite(type, ring, angle);
    this.satellites.push(sat);
    this.cooldowns.set(sat, 0);
    return true;
  }

  /** Remove and refund the satellite closest to the given world position */
  removeSatellite(worldX: number, worldY: number): boolean {
    let closest: OrbitalSatellite | null = null;
    let closestDist = 30; // 30px snap radius

    for (const sat of this.satellites) {
      const dx = sat.worldX - worldX;
      const dy = sat.worldY - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = sat;
      }
    }

    if (closest) {
      const refund = Math.floor(SATELLITE_TYPES[closest.type].cost * 0.5);
      window.gameState.money += refund;
      this.satellites = this.satellites.filter((s) => s !== closest);
      this.cooldowns.delete(closest);
      return true;
    }
    return false;
  }

  /** Calculate synergy for all satellites based on current positions */
  private calculateSynergy(): void {
    // Reset all
    for (const sat of this.satellites) {
      sat.hasTwinSynergy = false;
      sat.hasTrinitySynergy = false;
      sat.hasCrossRingSynergy = false;
    }

    const count = this.satellites.length;
    for (let i = 0; i < count; i++) {
      const a = this.satellites[i];
      let sameRingCount = 1;
      let differentRingSynergy = false;

      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const b = this.satellites[j];
        const angDist = a.angularDistanceTo(b);

        if (a.ring === b.ring) {
          // Same ring: check for twin/trinity
          if (angDist <= SYNERGY.twinMaxAngle) {
            sameRingCount++;
          }
        } else {
          // Different ring: check for cross-ring
          if (angDist <= SYNERGY.crossRingMaxAngle) {
            differentRingSynergy = true;
          }
        }
      }

      if (sameRingCount >= 3) a.hasTrinitySynergy = true;
      if (sameRingCount >= 2) a.hasTwinSynergy = true;
      if (differentRingSynergy) a.hasCrossRingSynergy = true;
    }
  }

  /** Main update: orbit, synergy, fire, projectiles, specials */
  update(time: number, delta: number, enemies: Enemy[]): void {
    // Orbit all satellites
    for (const sat of this.satellites) {
      sat.orbit(delta);
    }

    // Calculate synergy
    this.calculateSynergy();

    // Apply continuous effects (gravity, shield)
    for (const sat of this.satellites) {
      if (sat.config.special === "slow") {
        this.applyGravitySlow(sat, enemies, delta);
      }
      if (sat.config.special === "shield") {
        this.applyShieldEffect(sat, enemies, delta);
      }
    }

    // Fire from each satellite
    for (const sat of this.satellites) {
      const config = sat.config;
      if (config.fireRate === 0) continue;

      const lastFire = this.cooldowns.get(sat) || 0;
      if (time - lastFire < sat.fireRate) continue;

      if (config.special === "drone") {
        this.spawnDrones(sat, enemies);
        this.cooldowns.set(sat, time);
        continue;
      }

      // Find closest enemy in range
      const closest = this.findClosestEnemy(sat, enemies);
      if (!closest) continue;

      this.cooldowns.set(sat, time);

      // Create projectile
      const angle = Math.atan2(closest.worldY - sat.worldY, closest.worldX - sat.worldX);
      this.projectiles.push({
        worldX: sat.worldX,
        worldY: sat.worldY,
        targetEnemy: closest,
        speed: config.projectileSpeed,
        damage: sat.damage,
        alive: true,
        drawType: sat.type,
        angle,
        piercedEnemies: new Set(),
        chainCount: 0,
        droneLifetime: 0,
      });
    }

    // Update drones
    this.updateDrones(delta, enemies);

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.alive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // If target is dead, find new target or die
      if (!p.targetEnemy || !p.targetEnemy.alive) {
        if (p.drawType === "tesla" && p.chainCount < 2) {
          // Tesla chains to next enemy
          const next = this.findClosestEnemyAt(p.worldX, p.worldY, 60, enemies, p.piercedEnemies);
          if (next) {
            p.targetEnemy = next;
            p.chainCount++;
            p.damage = Math.floor(p.damage * 0.5);
          } else {
            p.alive = false;
            continue;
          }
        } else if (p.drawType === "railgun") {
          // Railgun keeps going in same direction
          p.worldX += (Math.cos(p.angle) * (p.speed * delta)) / 1000;
          p.worldY += (Math.sin(p.angle) * (p.speed * delta)) / 1000;
          // Check if off screen
          if (
            Math.abs(p.worldX - PLANET_CENTER_X) > 1500 ||
            Math.abs(p.worldY - PLANET_CENTER_Y) > 1500
          ) {
            p.alive = false;
          }
          continue;
        } else {
          p.alive = false;
          continue;
        }
      }

      // Move toward target
      const dx = p.targetEnemy.worldX - p.worldX;
      const dy = p.targetEnemy.worldY - p.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 8) {
        // Hit!
        this.doProjectileHit(p, enemies);
        continue;
      }

      const move = (p.speed * delta) / 1000;
      const nx = dx / dist;
      const ny = dy / dist;
      p.worldX += nx * move;
      p.worldY += ny * move;
      p.angle = Math.atan2(ny, nx);
    }

    // Update explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].time -= delta;
      if (this.explosions[i].time <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  private doProjectileHit(p: Projectile, enemies: Enemy[]): void {
    const config = SATELLITE_TYPES[p.drawType];

    if (config.special === "pierce" && p.targetEnemy) {
      // Railgun: damage target and continue
      p.targetEnemy.takeDamage(p.damage);
      p.piercedEnemies.add(p.targetEnemy);
      p.targetEnemy = null; // will continue in update loop
      return;
    }

    if (config.special === "chain" && p.targetEnemy) {
      // Tesla: damage target, then chain
      p.targetEnemy.takeDamage(p.damage);
      p.piercedEnemies.add(p.targetEnemy);
      if (p.chainCount < 2) {
        const next = this.findClosestEnemyAt(p.worldX, p.worldY, 60, enemies, p.piercedEnemies);
        if (next) {
          p.targetEnemy = next;
          p.chainCount++;
          p.damage = Math.floor(p.damage * 0.5);
          return; // don't kill projectile
        }
      }
      // Kill target and explode
      if (p.targetEnemy.alive) p.targetEnemy.takeDamage(Number.MAX_SAFE_INTEGER); // force kill
      this.addExplosion(p.worldX, p.worldY, 6, 200);
      p.alive = false;
      return;
    }

    if (config.special === "splash" && p.targetEnemy) {
      // Plasma: damage target + splash nearby
      p.targetEnemy.takeDamage(p.damage);
      for (const e of enemies) {
        if (!e.alive || e === p.targetEnemy) continue;
        const dx = e.worldX - p.worldX;
        const dy = e.worldY - p.worldY;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
          e.takeDamage(Math.floor(p.damage * 0.5));
        }
      }
      this.addExplosion(p.worldX, p.worldY, 8, 250);
      p.alive = false;
      return;
    }

    if (config.special === "beam" && p.targetEnemy) {
      // Ion: hit all enemies along the beam path
      const startX = p.worldX;
      const startY = p.worldY;
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.worldX - startX;
        const dy = e.worldY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20) {
          // thin beam, check proximity to line
          e.takeDamage(p.damage);
        }
      }
      p.targetEnemy.takeDamage(p.damage);
      p.alive = false;
      return;
    }

    if (config.special === "stun" && p.targetEnemy) {
      // EMP: damage + stun
      p.targetEnemy.takeDamage(p.damage);
      p.targetEnemy.stunTimer = 1500;
      this.addExplosion(p.worldX, p.worldY, 10, 300);
      p.alive = false;
      return;
    }

    // Default: direct hit
    if (p.targetEnemy) {
      p.targetEnemy.takeDamage(p.damage);
      if (!p.targetEnemy.alive) {
        this.addExplosion(p.targetEnemy.worldX, p.targetEnemy.worldY, p.targetEnemy.radius, 300);
      }
    }
    p.alive = false;
  }

  private findClosestEnemy(sat: OrbitalSatellite, enemies: Enemy[]): Enemy | null {
    return this.findClosestEnemyAt(sat.worldX, sat.worldY, sat.range, enemies, new Set());
  }

  private findClosestEnemyAt(
    wx: number,
    wy: number,
    range: number,
    enemies: Enemy[],
    exclude: Set<Enemy>,
  ): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = range;
    for (const e of enemies) {
      if (!e.alive || exclude.has(e)) continue;
      const dx = e.worldX - wx;
      const dy = e.worldY - wy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = e;
      }
    }
    return best;
  }

  // ── Special effects ──

  private applyGravitySlow(sat: OrbitalSatellite, enemies: Enemy[], _delta: number): void {
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.worldX - sat.worldX;
      const dy = e.worldY - sat.worldY;
      if (Math.sqrt(dx * dx + dy * dy) < sat.range) {
        e.slowTimer = 200; // keep refreshing while in range
      }
    }
  }

  private applyShieldEffect(sat: OrbitalSatellite, enemies: Enemy[], _delta: number): void {
    // Shield arc: 60° cone facing outward from planet
    const satAngle = sat.angle; // satellite's angle from planet center
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.worldX - sat.worldX;
      const dy = e.worldY - sat.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > sat.range) continue;

      // Check if enemy is in the shield arc (facing outward from planet)
      const enemyAngle = Math.atan2(e.worldY - PLANET_CENTER_Y, e.worldX - PLANET_CENTER_X);
      let diff = Math.abs(enemyAngle - satAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff < (30 * Math.PI) / 180) {
        // 30° half-angle = 60° cone
        // Push enemy back
        const nx = dx / dist;
        const ny = dy / dist;
        e.worldX += nx * 3;
        e.worldY += ny * 3;
        e.takeDamage(5);
        e.stunTimer = 200;
      }
    }
  }

  private spawnDrones(sat: OrbitalSatellite, enemies: Enemy[]): void {
    const closest = this.findClosestEnemy(sat, enemies);
    if (!closest) return;

    for (let i = 0; i < 2; i++) {
      const offX = (Math.random() - 0.5) * 20;
      const offY = (Math.random() - 0.5) * 20;
      this.drones.push({
        worldX: sat.worldX + offX,
        worldY: sat.worldY + offY,
        targetEnemy: closest,
        lifetime: 8000,
        damage: sat.config.damage,
        speed: 200,
      });
    }
  }

  private updateDrones(delta: number, enemies: Enemy[]): void {
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      d.lifetime -= delta;
      if (d.lifetime <= 0) {
        this.drones.splice(i, 1);
        continue;
      }

      // Find or refresh target
      if (!d.targetEnemy || !d.targetEnemy.alive) {
        d.targetEnemy = this.findClosestEnemyAt(d.worldX, d.worldY, 300, enemies, new Set());
      }
      if (!d.targetEnemy) {
        this.drones.splice(i, 1);
        continue;
      }

      // Move toward target
      const dx = d.targetEnemy.worldX - d.worldX;
      const dy = d.targetEnemy.worldY - d.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 6) {
        d.targetEnemy.takeDamage(d.damage);
        this.drones.splice(i, 1);
        continue;
      }
      const move = (d.speed * delta) / 1000;
      d.worldX += (dx / dist) * move;
      d.worldY += (dy / dist) * move;
    }
  }

  // ── Effects ──

  private addExplosion(x: number, y: number, r: number, duration: number): void {
    this.explosions.push({ x, y, r, time: duration });
  }

  // ── Save/Load helpers ──

  getSatelliteData(): { type: string; ring: string; angle: number }[] {
    return this.satellites.map((s) => ({ type: s.type, ring: s.ring, angle: s.angle }));
  }

  loadSatellites(data: { type: string; ring: string; angle: number }[]): void {
    this.satellites = [];
    this.cooldowns.clear();
    for (const d of data) {
      const sat = new OrbitalSatellite(d.type as SatelliteType, d.ring as OrbitRing, d.angle);
      this.satellites.push(sat);
      this.cooldowns.set(sat, 0);
    }
  }

  // ── Rendering ──

  render(g: Phaser.GameObjects.Graphics): void {
    // Drones
    for (const d of this.drones) {
      drawDroneProj(g, d.worldX, d.worldY);
    }

    // Projectiles
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      switch (p.drawType) {
        case "laser":
          drawLaserBeam(g, p.worldX, p.worldY);
          break;
        case "missile":
          drawMissileProj(g, p.worldX, p.worldY, p.angle);
          break;
        case "plasma":
          drawPlasmaBlob(g, p.worldX, p.worldY);
          break;
        case "railgun":
          drawRailgunTracer(g, p.worldX, p.worldY);
          break;
        case "ion":
          drawIonBolt(g, p.worldX, p.worldY);
          break;
        case "tesla":
          drawTeslaBolt(g, p.worldX, p.worldY);
          break;
        case "emp":
          drawEMPWave(g, p.worldX, p.worldY);
          break;
        case "shield":
          drawShieldWave(g, p.worldX, p.worldY);
          break;
        case "drone":
          drawDroneProj(g, p.worldX, p.worldY);
          break;
        default:
          drawLaserBeam(g, p.worldX, p.worldY);
          break;
      }
    }

    // Explosions
    for (const ex of this.explosions) {
      const alpha = Math.max(0, ex.time / 500);
      drawExplosion(g, ex.x, ex.y, ex.r, alpha);
    }
  }
}
