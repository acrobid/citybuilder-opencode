import { Enemy, EnemyTypeName } from "../entities/Enemy.js";
import { ENEMY_TYPES, WAVE_CONFIG, PLANET_CENTER_X, PLANET_CENTER_Y } from "../config.js";
import type { WorldMap } from "../map/WorldMap.js";

function randomSpawnPos(): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  const spawnDist = 2500;
  return {
    x: PLANET_CENTER_X + Math.cos(angle) * spawnDist,
    y: PLANET_CENTER_Y + Math.sin(angle) * spawnDist,
  };
}

interface QueuedSpawn {
  type: EnemyTypeName;
  delay: number; // ms from wave start
}

export class WaveSystem {
  enemies: Enemy[] = [];
  private waveNumber = 0;
  private waveActive = false;
  private inBuildPhase = true;
  private gameStarted = false;
  private buildPhaseEnd = 0;
  private waveStartTime = 0;
  private spawnQueue: QueuedSpawn[] = [];
  private spawnIndex = 0;
  private waveClearReward = 0;

  update(time: number, delta: number, worldMap: WorldMap): void {
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
      this.updateEnemies(delta, worldMap);
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
    this.updateEnemies(delta, worldMap);

    // Check wave complete
    if (this.spawnIndex >= this.spawnQueue.length && this.enemies.length === 0 && this.waveActive) {
      this.completeWave(time);
    }

    window.gameState.enemiesRemaining =
      this.enemies.length + (this.spawnQueue.length - this.spawnIndex);
  }

  private updateEnemies(delta: number, worldMap: WorldMap): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.alive) {
        this.enemies.splice(i, 1);
        continue;
      }

      const hitSurface = enemy.update(delta);
      if (hitSurface) {
        this.doImpact(enemy, worldMap);
        this.enemies.splice(i, 1);
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
    }
  }

  private spawnEnemy(type: EnemyTypeName): void {
    const cfg = ENEMY_TYPES[type];
    const pos = randomSpawnPos();
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
    window.gameState.waveActive = false;
    window.gameState.enemiesRemaining = 0;
    this.enemies = [];
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

  loadState(waveNumber: number, time: number): void {
    this.waveNumber = waveNumber;
    this.waveActive = false;
    this.inBuildPhase = true;
    this.waveStartTime = 0;
    this.spawnQueue = [];
    this.spawnIndex = 0;
    this.gameStarted = true;
    this.enemies = [];
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
