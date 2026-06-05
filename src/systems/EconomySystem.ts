import type { WorldMap } from "../map/WorldMap.js";

export class EconomySystem {
  gameState: Window["gameState"];
  lastTickTime = 0;
  tickInterval = 10000;

  constructor(gameState: Window["gameState"]) {
    this.gameState = gameState;
    this.gameState.money = 10000;
    this.gameState.income = 0;
    this.gameState.expenses = 0;
    this.gameState.date = 0;
  }

  tick(worldMap: WorldMap): void {
    let income = 0;
    let expenses = 0;

    for (let y = 0; y < worldMap.rows; y++) {
      for (let x = 0; x < worldMap.cols; x++) {
        const tile = worldMap.tiles[y][x];
        switch (tile.zone) {
          case "road":
            expenses += 1;
            break;
          case "residential":
            income += 10 * tile.level;
            break;
          case "commercial":
            income += 20 * tile.level;
            break;
          case "industrial":
            income += 15 * tile.level;
            break;
          case "powerplant":
            expenses += 25;
            break;
        }
      }
    }

    this.gameState.income = income;
    this.gameState.expenses = expenses;
    this.gameState.money += income - expenses;
    this.gameState.date++;
  }

  update(time: number, worldMap: WorldMap): void {
    if (time - this.lastTickTime >= this.tickInterval) {
      this.lastTickTime = time;
      this.tick(worldMap);
    }
  }

  canAfford(cost: number): boolean {
    return this.gameState.money >= cost;
  }

  deduct(cost: number): void {
    this.gameState.money -= cost;
  }

  refund(amount: number): void {
    this.gameState.money += amount;
  }
}
