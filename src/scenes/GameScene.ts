import * as Phaser from "phaser";
import {
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
  GAME_WIDTH,
  GAME_HEIGHT,
  PLANET_CENTER_X,
  PLANET_CENTER_Y,
  SPACE_COLORS,
} from "../config.js";
import { WorldMap } from "../map/WorldMap.js";
import { InputHandler } from "../input/InputHandler.js";
import { EconomySystem } from "../systems/EconomySystem.js";
import { ZoneSystem } from "../systems/ZoneSystem.js";
import { PowerSystem } from "../systems/PowerSystem.js";
import { PopulationSystem } from "../systems/PopulationSystem.js";
import { UIManager } from "../ui/UIManager.js";
import { WaveSystem } from "../systems/WaveSystem.js";
import { DefenseSystem } from "../systems/DefenseSystem.js";
import {
  drawEnemy,
  drawEnemyBullet,
  drawEnemyBulletExplosion,
  drawSatelliteCrash,
  drawMothershipSpawnBurst,
} from "../graphics/EnemyGraphics.js";
import { drawSatellite } from "../graphics/SatelliteGraphics.js";

export class GameScene extends Phaser.Scene {
  worldMap: WorldMap;
  bgGraphics: Phaser.GameObjects.Graphics;
  mapGraphics: Phaser.GameObjects.Graphics;
  graphics: Phaser.GameObjects.Graphics;
  overlayGraphics: Phaser.GameObjects.Graphics;
  economy: EconomySystem;
  zoneSystem: ZoneSystem;
  powerSystem: PowerSystem;
  populationSystem: PopulationSystem;
  inputHandler: InputHandler;
  uiManager: UIManager;
  waveSystem: WaveSystem;
  defenseSystem: DefenseSystem;
  private _gameOver = false;
  private _fpsFrames = 0;
  private _fpsLastTime = 0;
  private _fps = 0;
  private _vx1 = 0;
  private _vx2 = 0;
  private _vy1 = 0;
  private _vy2 = 0;

  private _updateViewport(): void {
    const view = this.cameras.main.worldView;
    const buffer = 64;
    this._vx1 = view.x - buffer;
    this._vy1 = view.y - buffer;
    this._vx2 = view.x + view.width + buffer;
    this._vy2 = view.y + view.height + buffer;
  }

  _isInView(x: number, y: number): boolean {
    return x >= this._vx1 && x <= this._vx2 && y >= this._vy1 && y <= this._vy2;
  }

  constructor() {
    super("GameScene");
  }

  create(): void {
    console.log("GameScene: create");
    const worldW = MAP_COLS * TILE_SIZE;
    const worldH = MAP_ROWS * TILE_SIZE;

    this.worldMap = new WorldMap();
    this.economy = new EconomySystem(window.gameState);
    this.zoneSystem = new ZoneSystem();
    this.powerSystem = new PowerSystem();
    this.populationSystem = new PopulationSystem(window.gameState);
    this.waveSystem = new WaveSystem();
    this.defenseSystem = new DefenseSystem();

    this.bgGraphics = this.add.graphics();
    this.mapGraphics = this.add.graphics();
    this.graphics = this.add.graphics();
    this.overlayGraphics = this.add.graphics();

    this.inputHandler = new InputHandler(this);
    this.uiManager = new UIManager(this);

    const minZoom = 0.15;
    const padX = GAME_WIDTH / minZoom - worldW;
    const padY = GAME_HEIGHT / minZoom - worldH;
    this.cameras.main.setBounds(-padX / 2, -padY / 2, worldW + padX, worldH + padY);
    this.cameras.main.setBackgroundColor(SPACE_COLORS.SPACE_BG);
    this.cameras.main.centerOn(PLANET_CENTER_X, PLANET_CENTER_Y);
    this.cameras.main.setZoom(1);

    const tc = this.worldMap.tiles;
    const cx = 49,
      cy = 49;
    tc[cy][cx].zone = "powerplant";
    tc[cy][cx + 1].zone = "powerplant";
    tc[cy + 1][cx].zone = "powerplant";
    tc[cy + 1][cx + 1].zone = "powerplant";
    tc[cy][cx + 2].zone = "road";
    tc[cy][cx + 3].zone = "road";
    tc[cy][cx + 4].zone = "residential";
    tc[cy][cx + 4].level = 1;
    this.worldMap.recalculateConnectivity();
    window.gameState.population = 50;

    // Static space background / starfield / rings — render once.
    this.worldMap.renderBackground(this.bgGraphics);
    this.worldMap.render(this.mapGraphics);
    this.worldMap.dirty = false;
  }

  update(time: number, delta: number): void {
    this._fpsFrames++;
    if (time - this._fpsLastTime >= 500) {
      this._fps = Math.round((this._fpsFrames / (time - this._fpsLastTime)) * 1000);
      this._fpsFrames = 0;
      this._fpsLastTime = time;
    }

    if (this._gameOver) {
      if (this.worldMap.dirty) {
        this.worldMap.render(this.mapGraphics);
        this.worldMap.dirty = false;
      }
      this._drawEntities(time);
      return;
    }

    if (window.gameState.paused) {
      return;
    }

    this.inputHandler.update(time, delta);
    this.economy.update(time, this.worldMap);
    this.powerSystem.update(time, this.worldMap);
    this.zoneSystem.update(time, this.worldMap);
    this.populationSystem.update(time, this.worldMap);
    this.waveSystem.update(time, delta, this.worldMap, this.defenseSystem.satellites);
    this.defenseSystem.update(time, delta, this.waveSystem.enemies, this.waveSystem.enemyBullets);
    this.uiManager.update(this._fps);

    if (
      !this._gameOver &&
      window.gameState.population <= 0 &&
      this.waveSystem.getWaveNumber() > 0
    ) {
      this._gameOver = true;
      window.gameState.gameOver = true;
      this.uiManager.showGameOver(this.waveSystem.getWaveNumber());
    }

    if (this.worldMap.dirty) {
      this.worldMap.render(this.mapGraphics);
      this.worldMap.dirty = false;
    }

    this._drawEntities(time);
  }

  private _drawEntities(time: number): void {
    this._updateViewport();
    const gfx = this.graphics;
    gfx.clear();

    for (const sat of this.defenseSystem.satellites) {
      if (this._isInView(sat.worldX, sat.worldY)) {
        drawSatellite(gfx, sat);
      }
    }

    for (const enemy of this.waveSystem.enemies) {
      if (enemy.alive && this._isInView(enemy.worldX, enemy.worldY)) {
        drawEnemy(gfx, enemy, time);
      }
    }

    for (const b of this.waveSystem.enemyBullets) {
      if (b.alive && this._isInView(b.worldX, b.worldY)) {
        drawEnemyBullet(gfx, b.worldX, b.worldY, b.vx, b.vy);
      }
    }

    for (const ex of this.waveSystem.enemyBulletExplosions) {
      if (this._isInView(ex.x, ex.y)) {
        drawEnemyBulletExplosion(
          gfx,
          ex.x,
          ex.y,
          ex.time / 200,
          ex.color ?? 0xff4444,
          ex.radius ?? 4,
        );
      }
    }

    for (const burst of this.waveSystem.spawnBurstEffects) {
      if (this._isInView(burst.x, burst.y)) {
        drawMothershipSpawnBurst(gfx, burst);
      }
    }

    for (const crash of this.waveSystem.satelliteCrashes) {
      if (this._isInView(crash.worldX, crash.worldY)) {
        drawSatelliteCrash(gfx, crash);
      }
    }

    this.defenseSystem.render(gfx, this._vx1, this._vy1, this._vx2, this._vy2);
  }
}
