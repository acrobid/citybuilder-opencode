import { WorldMap } from "../map/WorldMap.js";

export class PopulationSystem {
  gameState: Window["gameState"];
  tickInterval = 10000;
  lastTick = 0;

  constructor(gameState: Window["gameState"]) {
    this.gameState = gameState;
    gameState.population = 0;
  }

  calculate(worldMap: WorldMap): void {
    let pop = 0;
    for (let y = 0; y < worldMap.rows; y++) {
      for (let x = 0; x < worldMap.cols; x++) {
        const tile = worldMap.tiles[y][x];
        if (tile.zone === "residential" && tile.roadConnected && tile.isPowered) {
          pop += 50 * tile.level;
        }
      }
    }
    this.gameState.population = pop;
  }

  update(time: number, worldMap: WorldMap): void {
    if (time - this.lastTick >= this.tickInterval) {
      this.lastTick = time;
      this.calculate(worldMap);
    }
  }
}
