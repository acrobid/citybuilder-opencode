import * as Phaser from "phaser";
import { SATELLITE_TYPES, SYNERGY, SHIELD_BARRIER } from "../config.js";
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
  drawShieldBarrier,
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
  originX: number;
  originY: number;
  maxDist: number;
  distTraveled: number;
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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

export class DefenseSystem {
  satellites: OrbitalSatellite[] = [];
  projectiles: Projectile[] = [];
  drones: Drone[] = [];
  private cooldowns: Map<OrbitalSatellite, number> = new Map();
  private _lastSynergyTime = 0;
  private _synergyDirty = true;
  // Explosion effects (position, radius, remaining time)
  explosions: { x: number; y: number; r: number; time: number; color: number }[] = [];
  particles: Particle[] = [];

  /** Place a satellite on the nearest ring at the cursor angle. Returns false if can't afford. */
  placeSatellite(type: SatelliteType, angle: number, ring: OrbitRing): boolean {
    const config = SATELLITE_TYPES[type];
    if (window.gameState.money < config.cost) return false;
    window.gameState.money -= config.cost;

    const sat = new OrbitalSatellite(type, ring, angle);
    this.satellites.push(sat);
    this.cooldowns.set(sat, 0);
    this._synergyDirty = true;

    if (type === "shield") {
      sat.barriers = Array.from({ length: SHIELD_BARRIER.count }, () => SHIELD_BARRIER.hitCount);
      sat.barrierRegenTimer = SHIELD_BARRIER.regenTime;
    }

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
      this._synergyDirty = true;
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
    // Remove dead satellites
    for (let i = this.satellites.length - 1; i >= 0; i--) {
      if (!this.satellites[i].alive) {
        this.cooldowns.delete(this.satellites[i]);
        this.satellites[i] = this.satellites[this.satellites.length - 1];
        this.satellites.pop();
      }
    }

    // Orbit all satellites
    for (const sat of this.satellites) {
      sat.orbit(delta);
    }

    // Calculate synergy (throttled to 500ms or when dirty)
    if (this._synergyDirty || time - this._lastSynergyTime >= 500) {
      this.calculateSynergy();
      this._lastSynergyTime = time;
      this._synergyDirty = false;
    }

    // Apply continuous effects (gravity, shield)
    for (const sat of this.satellites) {
      if (sat.config.special === "slow") {
        this.applyGravitySlow(sat, enemies, delta);
      }
      if (sat.config.special === "shield") {
        this.updateShieldBarriers(sat, delta);
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
        originX: sat.worldX,
        originY: sat.worldY,
        maxDist: config.range * 1.5,
        distTraveled: 0,
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
        this.projectiles[i] = this.projectiles[this.projectiles.length - 1];
        this.projectiles.pop();
        continue;
      }

      if (p.targetEnemy && p.targetEnemy.alive) {
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
        p.distTraveled += move;
      } else {
        // Target dead: tesla tries to chain, others fly through
        if (p.drawType === "tesla" && p.chainCount < 2) {
          const next = this.findClosestEnemyAt(p.worldX, p.worldY, 60, enemies, p.piercedEnemies);
          if (next) {
            p.targetEnemy = next;
            p.chainCount++;
            p.damage = Math.floor(p.damage * 0.5);
            continue;
          }
        }
        // Continue in current direction
        const move = (p.speed * delta) / 1000;
        p.worldX += Math.cos(p.angle) * move;
        p.worldY += Math.sin(p.angle) * move;
        p.distTraveled += move;
      }

      // Check range limit
      if (p.distTraveled >= p.maxDist) {
        p.alive = false;
      }
    }

    // Update explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].time -= delta;
      if (this.explosions[i].time <= 0) {
        this.explosions[i] = this.explosions[this.explosions.length - 1];
        this.explosions.pop();
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= delta;
      if (pt.life <= 0) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }
      pt.x += pt.vx * (delta / 1000);
      pt.y += pt.vy * (delta / 1000);
      pt.vx *= 0.97;
      pt.vy *= 0.97;
    }
  }

  private getExplosionColor(type: SatelliteType): number {
    switch (type) {
      case "laser":
        return 0x00ffff;
      case "missile":
        return 0xff8800;
      case "plasma":
        return 0x00ff88;
      case "railgun":
        return 0xff4444;
      case "ion":
        return 0x88aaff;
      case "tesla":
        return 0x00ccff;
      case "emp":
        return 0xffff44;
      case "shield":
        return 0x88ccff;
      case "drone":
        return 0xffaa00;
      default:
        return 0xffaa00;
    }
  }

  private doProjectileHit(p: Projectile, enemies: Enemy[]): void {
    const config = SATELLITE_TYPES[p.drawType];
    const color = this.getExplosionColor(p.drawType);

    if (config.special === "pierce" && p.targetEnemy) {
      // Railgun: damage target, explode if killed, continue
      const killed = p.targetEnemy.takeDamage(p.damage);
      if (killed) {
        this.addExplosion(
          p.targetEnemy.worldX,
          p.targetEnemy.worldY,
          p.targetEnemy.radius * 1.5,
          500,
          color,
        );
      }
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
      if (p.targetEnemy.alive) p.targetEnemy.takeDamage(Number.MAX_SAFE_INTEGER);
      this.addExplosion(p.worldX, p.worldY, 16, 500, color);
      p.alive = false;
      return;
    }

    if (config.special === "splash" && p.targetEnemy) {
      // Plasma: damage target + splash nearby
      const killed = p.targetEnemy.takeDamage(p.damage);
      if (killed) {
        this.addExplosion(
          p.targetEnemy.worldX,
          p.targetEnemy.worldY,
          p.targetEnemy.radius * 1.5,
          500,
          color,
        );
      }
      for (const e of enemies) {
        if (!e.alive || e === p.targetEnemy) continue;
        const dx = e.worldX - p.worldX;
        const dy = e.worldY - p.worldY;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
          const splatKill = e.takeDamage(Math.floor(p.damage * 0.5));
          if (splatKill) {
            this.addExplosion(e.worldX, e.worldY, e.radius * 1.5, 400, color);
          }
        }
      }
      this.addExplosion(p.worldX, p.worldY, 20, 600, color);
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
          const killed = e.takeDamage(p.damage);
          if (killed) {
            this.addExplosion(e.worldX, e.worldY, e.radius * 1.5, 500, color);
          }
        }
      }
      const killed = p.targetEnemy.takeDamage(p.damage);
      if (killed) {
        this.addExplosion(
          p.targetEnemy.worldX,
          p.targetEnemy.worldY,
          p.targetEnemy.radius * 1.5,
          500,
          color,
        );
      }
      this.addExplosion(p.worldX, p.worldY, 15, 400, color);
      p.alive = false;
      return;
    }

    if (config.special === "stun" && p.targetEnemy) {
      // EMP: damage + stun
      const killed = p.targetEnemy.takeDamage(p.damage);
      if (killed) {
        this.addExplosion(
          p.targetEnemy.worldX,
          p.targetEnemy.worldY,
          p.targetEnemy.radius * 1.5,
          600,
          color,
        );
      }
      p.targetEnemy.stunTimer = 1500;
      this.addExplosion(p.worldX, p.worldY, 25, 700, color);
      p.alive = false;
      return;
    }

    // Default: direct hit
    if (p.targetEnemy) {
      const killed = p.targetEnemy.takeDamage(p.damage);
      if (killed) {
        this.addExplosion(
          p.targetEnemy.worldX,
          p.targetEnemy.worldY,
          p.targetEnemy.radius * 1.5,
          600,
          color,
        );
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

  private updateShieldBarriers(sat: OrbitalSatellite, delta: number): void {
    if (!sat.barriers || sat.barriers.length === 0) return;

    sat.barrierRegenTimer -= delta;
    if (sat.barrierRegenTimer <= 0) {
      sat.barrierRegenTimer = SHIELD_BARRIER.regenTime;
      for (let i = 0; i < sat.barriers.length; i++) {
        if (sat.barriers[i] <= 0) {
          sat.barriers[i] = SHIELD_BARRIER.hitCount;
          break;
        }
      }
    }

    if (sat.barriers.every((hits) => hits <= 0)) {
      sat.alive = false;
      this.addExplosion(sat.worldX, sat.worldY, sat.range * 0.3, 600, 0x88ccff);
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
        this.drones[i] = this.drones[this.drones.length - 1];
        this.drones.pop();
        continue;
      }

      // Find or refresh target
      if (!d.targetEnemy || !d.targetEnemy.alive) {
        d.targetEnemy = this.findClosestEnemyAt(d.worldX, d.worldY, 300, enemies, new Set());
      }
      if (!d.targetEnemy) {
        this.drones[i] = this.drones[this.drones.length - 1];
        this.drones.pop();
        continue;
      }

      // Move toward target
      const dx = d.targetEnemy.worldX - d.worldX;
      const dy = d.targetEnemy.worldY - d.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 6) {
        const killed = d.targetEnemy.takeDamage(d.damage);
        if (killed) {
          this.addExplosion(
            d.targetEnemy.worldX,
            d.targetEnemy.worldY,
            d.targetEnemy.radius * 1.5,
            400,
            0xffaa00,
          );
        }
        this.drones[i] = this.drones[this.drones.length - 1];
        this.drones.pop();
        continue;
      }
      const move = (d.speed * delta) / 1000;
      d.worldX += (dx / dist) * move;
      d.worldY += (dy / dist) * move;
    }
  }

  // ── Effects ──

  private addExplosion(
    x: number,
    y: number,
    r: number,
    duration: number,
    color: number = 0xffaa00,
  ): void {
    this.explosions.push({ x, y, r, time: duration, color });
    this.spawnExplosionParticles(x, y, 15, Math.max(2, Math.floor(r / 2)), color);
  }

  private spawnExplosionParticles(
    x: number,
    y: number,
    count: number,
    size: number,
    color: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500 + Math.random() * 500,
        maxLife: 1000,
        size: size * (0.5 + Math.random() * 1.0),
        color: Math.random() > 0.4 ? color : 0xffdd44,
      });
    }
  }

  // ── Save/Load helpers ──

  getSatelliteData(): {
    type: string;
    ring: string;
    angle: number;
    barriers: number[];
    barrierRegenTimer: number;
  }[] {
    return this.satellites.map((s) => ({
      type: s.type,
      ring: s.ring,
      angle: s.angle,
      barriers: s.barriers ? [...s.barriers] : [],
      barrierRegenTimer: s.barrierRegenTimer,
    }));
  }

  loadSatellites(
    data: {
      type: string;
      ring: string;
      angle: number;
      barriers?: number[];
      barrierRegenTimer?: number;
    }[],
  ): void {
    this.satellites = [];
    this.cooldowns.clear();
    for (const d of data) {
      const sat = new OrbitalSatellite(d.type as SatelliteType, d.ring as OrbitRing, d.angle);
      if (d.barriers && d.barriers.length > 0) {
        sat.barriers = d.barriers;
        sat.barrierRegenTimer = d.barrierRegenTimer ?? SHIELD_BARRIER.regenTime;
      }
      this.satellites.push(sat);
      this.cooldowns.set(sat, 0);
    }
    this._synergyDirty = true;
  }

  render(g: Phaser.GameObjects.Graphics): void {
    // Shield barriers
    for (const sat of this.satellites) {
      if (sat.type !== "shield" || !sat.barriers) continue;
      for (let i = 0; i < sat.barriers.length; i++) {
        if (sat.barriers[i] <= 0) continue;
        const pos = OrbitalSatellite.getBarrierWorldPos(sat, i);
        drawShieldBarrier(g, pos.x, pos.y, sat.barriers[i], SHIELD_BARRIER.hitCount);
      }
    }

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
      const t = Math.max(0, ex.time / 500);
      const alpha = Math.min(1, t * 2);
      const expand = 1 + (1 - t) * 1.5;
      drawExplosion(g, ex.x, ex.y, Math.round(ex.r * expand), alpha, ex.color);
    }

    // Particles
    for (const pt of this.particles) {
      const alpha = Math.max(0, pt.life / pt.maxLife);
      g.fillStyle(pt.color, alpha * 0.8);
      g.fillCircle(Math.round(pt.x), Math.round(pt.y), Math.max(1, Math.round(pt.size * alpha)));
    }
  }
}
