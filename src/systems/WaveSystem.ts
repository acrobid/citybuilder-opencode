import { Enemy, EnemyTypeName } from "../entities/Enemy.js";
import {
  ENEMY_TYPES,
  WAVE_CONFIG,
  SHIELD_BARRIER,
  PLANET_CENTER_X,
  PLANET_CENTER_Y,
  PLANET_RADIUS,
} from "../config.js";
import type { WorldMap } from "../map/WorldMap.js";
import { OrbitalSatellite } from "../entities/OrbitalSatellite.js";
import { isOnPlanet } from "../graphics/SpaceGraphics.js";

function randomSpawnPos(): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  const spawnDist = 2500;
  return {
    x: PLANET_CENTER_X + Math.cos(angle) * spawnDist,
    y: PLANET_CENTER_Y + Math.sin(angle) * spawnDist,
  };
}

function randomSpawnPosAt(dist: number): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: PLANET_CENTER_X + Math.cos(angle) * dist,
    y: PLANET_CENTER_Y + Math.sin(angle) * dist,
  };
}

interface QueuedSpawn {
  type: EnemyTypeName;
  delay: number; // ms from wave start
}

interface EnemyBullet {
  worldX: number;
  worldY: number;
  vx: number;
  vy: number;
  damage: number;
  alive: boolean;
}

interface SatelliteCrash {
  worldX: number;
  worldY: number;
  angle: number;
  startDist: number;
  elapsed: number;
  duration: number;
}

export class WaveSystem {
  enemies: Enemy[] = [];
  enemyBullets: EnemyBullet[] = [];
  enemyBulletExplosions: { x: number; y: number; time: number; color?: number; radius?: number }[] =
    [];
  satelliteCrashes: SatelliteCrash[] = [];
  private waveNumber = 0;
  private waveActive = false;
  private inBuildPhase = true;
  private gameStarted = false;
  private buildPhaseEnd = 0;
  private waveStartTime = 0;
  private spawnQueue: QueuedSpawn[] = [];
  private spawnIndex = 0;
  private waveClearReward = 0;
  private closeSpawnDist: number | null = null;

  update(time: number, delta: number, worldMap: WorldMap, satellites: OrbitalSatellite[]): void {
    // Initialize on first frame
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.buildPhaseEnd = time + WAVE_CONFIG.initialDelay;
      this.inBuildPhase = true;
      this.waveNumber = 0;
      window.gameState.wave = 0;
      window.gameState.waveActive = false;
      return;
    }

    // Build phase: check timer
    if (this.inBuildPhase) {
      if (time >= this.buildPhaseEnd) {
        this.startNextWave(time);
      }
      // Update enemies (mothership-scout spawned enemies may still exist)
      this.updateEnemies(delta, worldMap, satellites);
      this.updateEnemyBullets(delta, satellites);
      this.updateSatelliteCrashes(delta, worldMap);
      window.gameState.enemiesRemaining =
        this.enemies.length + (this.spawnQueue.length - this.spawnIndex);
      return;
    }

    // Spawn queued enemies
    const elapsed = time - this.waveStartTime;
    while (this.spawnIndex < this.spawnQueue.length) {
      const s = this.spawnQueue[this.spawnIndex];
      if (elapsed >= s.delay) {
        this.spawnEnemy(s.type);
        this.spawnIndex++;
      } else {
        break;
      }
    }

    // Update all enemies
    this.updateEnemies(delta, worldMap, satellites);
    this.updateEnemyBullets(delta, satellites);
    this.updateSatelliteCrashes(delta, worldMap);

    // Check wave complete
    if (this.spawnIndex >= this.spawnQueue.length && this.enemies.length === 0 && this.waveActive) {
      this.completeWave(time);
    }

    window.gameState.enemiesRemaining =
      this.enemies.length + (this.spawnQueue.length - this.spawnIndex);
  }

  private updateEnemies(delta: number, worldMap: WorldMap, satellites: OrbitalSatellite[]): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.alive) {
        this.enemies[i] = this.enemies[this.enemies.length - 1];
        this.enemies.pop();
        continue;
      }

      const hitSurface = enemy.update(delta);
      if (hitSurface) {
        this.doImpact(enemy, worldMap);
        this.enemies[i] = this.enemies[this.enemies.length - 1];
        this.enemies.pop();
        continue;
      }

      // Mothership spawns scouts when close
      if (
        enemy.type === "mothership" &&
        !enemy.hasSpawnedScouts &&
        enemy.distanceToCenter() < 800
      ) {
        enemy.hasSpawnedScouts = true;
        this.spawnScoutsFrom(enemy.worldX, enemy.worldY, 3);
      }

      // Aliens shoot at satellites
      if (enemy.type !== "asteroid" && satellites.length > 0) {
        enemy.shootTimer -= delta;
        if (enemy.shootTimer <= 0) {
          const cooldown = enemy.type === "mothership" ? 800 : 2000;
          enemy.shootTimer = cooldown;
          const sat = this.findBestSatelliteTarget(enemy, satellites);
          if (sat) {
            const dx = sat.worldX - enemy.worldX;
            const dy = sat.worldY - enemy.worldY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              const speed = 200;
              const damage = enemy.type === "mothership" ? 2 : 1;
              this.enemyBullets.push({
                worldX: enemy.worldX,
                worldY: enemy.worldY,
                vx: (dx / dist) * speed,
                vy: (dy / dist) * speed,
                damage,
                alive: true,
              });
            }
          }
        }
      }
    }
  }

  private updateEnemyBullets(delta: number, satellites: OrbitalSatellite[]): void {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      if (!b.alive) {
        this.enemyBullets[i] = this.enemyBullets[this.enemyBullets.length - 1];
        this.enemyBullets.pop();
        continue;
      }

      b.worldX += b.vx * (delta / 1000);
      b.worldY += b.vy * (delta / 1000);

      // Bullet enters planet surface — impact explosion
      if (isOnPlanet(b.worldX, b.worldY)) {
        b.alive = false;
        this.enemyBulletExplosions.push({
          x: b.worldX,
          y: b.worldY,
          time: 400,
          color: 0xff6600,
          radius: 8,
        });
        continue;
      }

      // Check collision with shield barriers
      let blockedByBarrier = false;
      for (const sat of satellites) {
        if (!sat.alive || sat.type !== "shield" || !sat.barriers) continue;
        for (let bi = 0; bi < sat.barriers.length; bi++) {
          if (sat.barriers[bi] <= 0) continue;
          const pos = OrbitalSatellite.getBarrierWorldPos(sat, bi);
          const halfSize = SHIELD_BARRIER.size / 2;
          if (Math.abs(b.worldX - pos.x) < halfSize && Math.abs(b.worldY - pos.y) < halfSize) {
            sat.barriers[bi]--;
            b.alive = false;
            this.enemyBulletExplosions.push({
              x: b.worldX,
              y: b.worldY,
              time: 200,
              color: 0x88ccff,
            });
            blockedByBarrier = true;
            break;
          }
        }
        if (blockedByBarrier) break;
      }
      if (blockedByBarrier) continue;

      // Check collision with satellites
      for (const sat of satellites) {
        if (!sat.alive) continue;
        const dx = b.worldX - sat.worldX;
        const dy = b.worldY - sat.worldY;
        if (Math.sqrt(dx * dx + dy * dy) < 12) {
          sat.health -= b.damage;
          b.alive = false;
          this.enemyBulletExplosions.push({ x: b.worldX, y: b.worldY, time: 200 });
          if (sat.health <= 0) {
            sat.alive = false;
            this.enemyBulletExplosions.push({ x: sat.worldX, y: sat.worldY, time: 400, radius: 6 });
            const cdx = sat.worldX - PLANET_CENTER_X;
            const cdy = sat.worldY - PLANET_CENTER_Y;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            this.satelliteCrashes.push({
              worldX: sat.worldX,
              worldY: sat.worldY,
              angle: Math.atan2(cdy, cdx),
              startDist: cdist,
              elapsed: 0,
              duration: 1800,
            });
          }
          break;
        }
      }

      // Remove if too far from planet (out of bounds)
      const dx2 = b.worldX - PLANET_CENTER_X;
      const dy2 = b.worldY - PLANET_CENTER_Y;
      if (Math.sqrt(dx2 * dx2 + dy2 * dy2) > 3000) {
        b.alive = false;
      }
    }

    // Update explosions
    for (let i = this.enemyBulletExplosions.length - 1; i >= 0; i--) {
      this.enemyBulletExplosions[i].time -= delta;
      if (this.enemyBulletExplosions[i].time <= 0) {
        this.enemyBulletExplosions[i] =
          this.enemyBulletExplosions[this.enemyBulletExplosions.length - 1];
        this.enemyBulletExplosions.pop();
      }
    }
  }

  private findBestSatelliteTarget(
    enemy: Enemy,
    satellites: OrbitalSatellite[],
  ): OrbitalSatellite | null {
    const maxRange = 600;
    let best: OrbitalSatellite | null = null;
    let bestDist = maxRange;
    for (const sat of satellites) {
      if (!sat.alive) continue;
      const dx = sat.worldX - enemy.worldX;
      const dy = sat.worldY - enemy.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= bestDist) continue;
      if (this.lineIntersectsPlanet(enemy.worldX, enemy.worldY, sat.worldX, sat.worldY)) continue;
      bestDist = dist;
      best = sat;
    }
    return best;
  }

  private lineIntersectsPlanet(x1: number, y1: number, x2: number, y2: number): boolean {
    const cx = PLANET_CENTER_X;
    const cy = PLANET_CENTER_Y;
    const r = PLANET_RADIUS;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;

    const a = dx * dx + dy * dy;
    if (a < 0.001) {
      return Math.sqrt(fx * fx + fy * fy) <= r;
    }

    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;
    let discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return false;
    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);

    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  }

  private spawnEnemy(type: EnemyTypeName): void {
    const cfg = ENEMY_TYPES[type];
    const pos =
      this.closeSpawnDist !== null ? randomSpawnPosAt(this.closeSpawnDist) : randomSpawnPos();
    const e = new Enemy(
      type,
      pos.x,
      pos.y,
      cfg.health,
      cfg.speed,
      cfg.damage,
      cfg.radius,
      cfg.score,
    );
    this.enemies.push(e);
  }

  private spawnScoutsFrom(x: number, y: number, count: number): void {
    const cfg = ENEMY_TYPES.scout;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const e = new Enemy(
        "scout",
        x + Math.cos(a) * 30,
        y + Math.sin(a) * 30,
        cfg.health,
        cfg.speed,
        cfg.damage,
        cfg.radius,
        cfg.score,
      );
      this.enemies.push(e);
    }
  }

  private doImpact(enemy: Enemy, worldMap: WorldMap): void {
    // Find tile at impact position
    const tile = worldMap.tileAt(enemy.worldX, enemy.worldY);
    if (!tile) return;

    // Damage the tile if it has health
    if (tile.zone !== "empty" && tile.zone !== "road") {
      if (tile.health === undefined || tile.health <= 0) {
        tile.health = tile.zone === "powerplant" ? 5 : 3;
      }
      tile.health -= enemy.damage;
      if (tile.health <= 0) {
        tile.zone = "empty";
        tile.level = 0;
        tile.health = 0;
      }
    } else if (tile.zone === "road") {
      // Roads take damage too
      if (tile.health === undefined || tile.health <= 0) tile.health = 2;
      tile.health -= enemy.damage;
      if (tile.health <= 0) {
        tile.zone = "empty";
        tile.level = 0;
        tile.health = 0;
      }
    }

    worldMap.recalculateConnectivity();
  }

  private updateSatelliteCrashes(delta: number, worldMap: WorldMap): void {
    for (let i = this.satelliteCrashes.length - 1; i >= 0; i--) {
      const crash = this.satelliteCrashes[i];
      crash.elapsed += delta;
      const t = Math.min(crash.elapsed / crash.duration, 1);
      crash.worldX =
        PLANET_CENTER_X +
        Math.cos(crash.angle) * (crash.startDist + (PLANET_RADIUS - crash.startDist) * t);
      crash.worldY =
        PLANET_CENTER_Y +
        Math.sin(crash.angle) * (crash.startDist + (PLANET_RADIUS - crash.startDist) * t);

      if (t >= 1) {
        this.enemyBulletExplosions.push({
          x: crash.worldX,
          y: crash.worldY,
          time: 800,
          color: 0xff4400,
          radius: 14,
        });
        this.doCrashImpact(crash.worldX, crash.worldY, worldMap);
        this.satelliteCrashes[i] = this.satelliteCrashes[this.satelliteCrashes.length - 1];
        this.satelliteCrashes.pop();
      }
    }
  }

  private doCrashImpact(x: number, y: number, worldMap: WorldMap): void {
    const tile = worldMap.tileAt(x, y);
    if (!tile) return;
    if (tile.zone !== "empty" && tile.zone !== "road") {
      if (tile.health === undefined || tile.health <= 0) {
        tile.health = tile.zone === "powerplant" ? 5 : 3;
      }
      tile.health -= 2;
      if (tile.health <= 0) {
        tile.zone = "empty";
        tile.level = 0;
        tile.health = 0;
      }
    } else if (tile.zone === "road") {
      if (tile.health === undefined || tile.health <= 0) tile.health = 2;
      tile.health -= 2;
      if (tile.health <= 0) {
        tile.zone = "empty";
        tile.level = 0;
        tile.health = 0;
      }
    }
    worldMap.recalculateConnectivity();
  }

  private startNextWave(time: number): void {
    this.waveNumber++;
    this.waveActive = true;
    this.inBuildPhase = false;
    this.waveStartTime = time;
    window.gameState.wave = this.waveNumber;
    window.gameState.waveActive = true;

    // Calculate composition
    const aCount = WAVE_CONFIG.baseEnemies + (this.waveNumber - 1) * WAVE_CONFIG.enemiesPerWave;
    const sCount =
      this.waveNumber >= WAVE_CONFIG.scoutsStartWave
        ? (this.waveNumber - WAVE_CONFIG.scoutsStartWave + 1) * WAVE_CONFIG.scoutsPerWave
        : 0;
    const hasMothership = this.waveNumber % WAVE_CONFIG.mothershipEvery === 0;

    // Build queue (batch enemies in groups)
    this.spawnQueue = [];
    let delay = 0;
    const groupSize = 5;

    for (let i = 0; i < aCount; i++) {
      this.spawnQueue.push({ type: "asteroid", delay });
      if ((i + 1) % groupSize === 0) {
        delay += ENEMY_TYPES.asteroid.spawnDelay + Math.random() * 300;
      }
    }
    for (let i = 0; i < sCount; i++) {
      this.spawnQueue.push({ type: "scout", delay });
      if ((i + 1) % groupSize === 0) {
        delay += ENEMY_TYPES.scout.spawnDelay + Math.random() * 200;
      }
    }
    if (hasMothership) {
      this.spawnQueue.push({ type: "mothership", delay });
    }

    this.spawnIndex = 0;
  }

  private completeWave(time: number): void {
    this.waveActive = false;
    this.inBuildPhase = true;
    this.closeSpawnDist = null;
    window.gameState.waveActive = false;
    window.gameState.enemiesRemaining = 0;
    this.enemies = [];
    this.enemyBullets = [];
    this.enemyBulletExplosions = [];
    this.satelliteCrashes = [];
    this.spawnQueue = [];
    this.spawnIndex = 0;

    // Reward
    this.waveClearReward = WAVE_CONFIG.waveReward + this.waveNumber * WAVE_CONFIG.waveRewardPerWave;
    window.gameState.money += this.waveClearReward;

    // Next build phase
    const interval = Math.max(
      WAVE_CONFIG.minInterval,
      WAVE_CONFIG.buildPhaseDuration - this.waveNumber * 500,
    );
    this.buildPhaseEnd = time + interval;
  }

  getWaveNumber(): number {
    return this.waveNumber;
  }
  isBuildPhase(): boolean {
    return this.inBuildPhase;
  }
  getWaveClearReward(): number {
    return this.waveClearReward;
  }

  forceStartWave(time: number): void {
    this.closeSpawnDist = null;
    if (this.waveActive) {
      const aCount = WAVE_CONFIG.baseEnemies;
      const sCount = this.waveNumber >= WAVE_CONFIG.scoutsStartWave ? WAVE_CONFIG.scoutsPerWave : 0;

      let delay =
        this.spawnQueue.length > 0
          ? this.spawnQueue[this.spawnQueue.length - 1].delay
          : time - this.waveStartTime;

      const groupSize = 10;
      for (let i = 0; i < aCount; i++) {
        this.spawnQueue.push({ type: "asteroid", delay });
        if ((i + 1) % groupSize === 0) {
          delay += ENEMY_TYPES.asteroid.spawnDelay + Math.random() * 200;
        }
      }
      for (let i = 0; i < sCount; i++) {
        this.spawnQueue.push({ type: "scout", delay });
        if ((i + 1) % groupSize === 0) {
          delay += ENEMY_TYPES.scout.spawnDelay + Math.random() * 150;
        }
      }
    } else {
      this.startNextWave(time);
    }
  }

  forceStartWaveCloser(time: number): void {
    if (!this.inBuildPhase) return;
    this.closeSpawnDist = 1200;
    this.startNextWave(time);
    // closeSpawnDist stays set until completeWave clears it
  }

  loadState(waveNumber: number, time: number): void {
    this.waveNumber = waveNumber;
    this.waveActive = false;
    this.inBuildPhase = true;
    this.waveStartTime = 0;
    this.spawnQueue = [];
    this.spawnIndex = 0;
    this.gameStarted = true;
    this.enemies = [];
    this.enemyBullets = [];
    this.enemyBulletExplosions = [];
    this.satelliteCrashes = [];
    window.gameState.wave = waveNumber;
    window.gameState.waveActive = false;
    window.gameState.enemiesRemaining = 0;
    const interval = Math.max(
      WAVE_CONFIG.minInterval,
      WAVE_CONFIG.buildPhaseDuration - waveNumber * 500,
    );
    this.buildPhaseEnd = time + interval;
  }
}
