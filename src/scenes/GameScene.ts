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
import { drawEnemy } from "../graphics/EnemyGraphics.js";
import { drawSatellite } from "../graphics/SatelliteGraphics.js";

export class GameScene extends Phaser.Scene {
  worldMap: WorldMap;
  graphics: Phaser.GameObjects.Graphics;
  economy: EconomySystem;
  zoneSystem: ZoneSystem;
  powerSystem: PowerSystem;
  populationSystem: PopulationSystem;
  inputHandler: InputHandler;
  uiManager: UIManager;
  waveSystem: WaveSystem;
  defenseSystem: DefenseSystem;
  private _gameOver = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    console.log("GameScene: create");
    this.worldMap = new WorldMap();
    this.graphics = this.add.graphics();
    this.economy = new EconomySystem(window.gameState);
    this.zoneSystem = new ZoneSystem();
    this.powerSystem = new PowerSystem();
    this.populationSystem = new PopulationSystem(window.gameState);
    this.inputHandler = new InputHandler(this);
    this.uiManager = new UIManager(this);
    this.waveSystem = new WaveSystem();
    this.defenseSystem = new DefenseSystem();
    const worldW = MAP_COLS * TILE_SIZE;
    const worldH = MAP_ROWS * TILE_SIZE;
    const minZoom = 0.15;
    const padX = GAME_WIDTH / minZoom - worldW;
    const padY = GAME_HEIGHT / minZoom - worldH;
    this.cameras.main.setBounds(-padX / 2, -padY / 2, worldW + padX, worldH + padY);
    this.cameras.main.setBackgroundColor(SPACE_COLORS.SPACE_BG);
    this.cameras.main.centerOn(PLANET_CENTER_X, PLANET_CENTER_Y);
    this.cameras.main.setZoom(1);

    // Starter city: a pre-built tile so the game doesn't immediately end
    const tc = this.worldMap.tiles;
    const cx = 49,
      cy = 49; // near planet center
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

    this.worldMap.render(this.graphics);
  }

  update(time: number, delta: number): void {
    // Skip game logic if game over
    if (this._gameOver) {
      this.worldMap.render(this.graphics);
      for (const sat of this.defenseSystem.satellites) {
        drawSatellite(this.graphics, sat);
      }
      for (const enemy of this.waveSystem.enemies) {
        if (enemy.alive) drawEnemy(this.graphics, enemy);
      }
      this.defenseSystem.render(this.graphics);
      return;
    }

    this.inputHandler.update(time, delta);
    this.economy.update(time, this.worldMap);
    this.powerSystem.update(time, this.worldMap);
    this.zoneSystem.update(time, this.worldMap);
    this.populationSystem.update(time, this.worldMap);
    this.waveSystem.update(time, delta, this.worldMap);
    this.defenseSystem.update(time, delta, this.waveSystem.enemies);
    this.uiManager.update();

    // Game over check
    if (
      !this._gameOver &&
      window.gameState.population <= 0 &&
      this.waveSystem.getWaveNumber() > 0
    ) {
      this._gameOver = true;
      window.gameState.gameOver = true;
      this.uiManager.showGameOver(this.waveSystem.getWaveNumber());
    }

    // Render order: world -> satellites -> enemies -> projectiles
    this.worldMap.render(this.graphics);

    for (const sat of this.defenseSystem.satellites) {
      drawSatellite(this.graphics, sat);
    }

    for (const enemy of this.waveSystem.enemies) {
      if (enemy.alive) drawEnemy(this.graphics, enemy);
    }

    this.defenseSystem.render(this.graphics);
  }
}
