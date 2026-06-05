import * as Phaser from "phaser";
import { MAP_COLS, MAP_ROWS, TILE_SIZE } from "../config.js";
import { WorldMap } from "../map/WorldMap.js";
import { InputHandler } from "../input/InputHandler.js";
import { EconomySystem } from "../systems/EconomySystem.js";
import { ZoneSystem } from "../systems/ZoneSystem.js";
import { PowerSystem } from "../systems/PowerSystem.js";
import { PopulationSystem } from "../systems/PopulationSystem.js";
import { UIManager } from "../ui/UIManager.js";

export class GameScene extends Phaser.Scene {
  worldMap: WorldMap;
  graphics: Phaser.GameObjects.Graphics;
  economy: EconomySystem;
  zoneSystem: ZoneSystem;
  powerSystem: PowerSystem;
  populationSystem: PopulationSystem;
  inputHandler: InputHandler;
  uiManager: UIManager;

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
    this.cameras.main.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    this.cameras.main.setZoom(1);
    this.worldMap.render(this.graphics);
  }

  update(time: number, delta: number): void {
    this.inputHandler.update(time, delta);
    this.economy.update(time, this.worldMap);
    this.powerSystem.update(time, this.worldMap);
    this.zoneSystem.update(time, this.worldMap);
    this.populationSystem.update(time, this.worldMap);
    this.uiManager.update();
    this.worldMap.render(this.graphics);
  }
}
