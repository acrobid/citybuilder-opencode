import * as Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    console.log("BootScene: create");
    this.scene.start("GameScene");
  }
}
