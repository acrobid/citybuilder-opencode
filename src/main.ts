import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "./config.js";
import { BootScene } from "./scenes/BootScene.js";
import { GameScene } from "./scenes/GameScene.js";

window.gameState = {
  selectedTool: null,
  money: 0,
  population: 0,
  date: 0,
  income: 0,
  expenses: 0,
  wave: 0,
  waveActive: false,
  enemiesRemaining: 0,
  gameOver: false,
};

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game-container",
  backgroundColor: "#1a1a2e",
  scene: [BootScene, GameScene],
});
