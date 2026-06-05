import { WorldMap } from "../map/WorldMap.js";

export class PowerSystem {
  powerRadius = 20;
  tickInterval = 3000;
  lastTick = 0;

  recalculate(worldMap: WorldMap): void {
    for (let y = 0; y < worldMap.rows; y++) {
      for (let x = 0; x < worldMap.cols; x++) {
        worldMap.tiles[y][x].isPowered = false;
      }
    }

    const plants: { x: number; y: number }[] = [];
    for (let y = 0; y < worldMap.rows; y++) {
      for (let x = 0; x < worldMap.cols; x++) {
        if (worldMap.tiles[y][x].zone === "powerplant") {
          plants.push({ x, y });
        }
      }
    }

    for (const plant of plants) {
      this.bfsPower(worldMap, plant.x, plant.y);
    }
  }

  bfsPower(worldMap: WorldMap, startX: number, startY: number): void {
    interface QueueItem {
      x: number;
      y: number;
      dist: number;
    }
    const queue: QueueItem[] = [{ x: startX, y: startY, dist: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { x, y, dist } = queue.shift()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (x < 0 || x >= worldMap.cols || y < 0 || y >= worldMap.rows) continue;
      if (dist > this.powerRadius) continue;

      visited.add(key);
      worldMap.tiles[y][x].isPowered = true;

      queue.push({ x: x + 1, y, dist: dist + 1 });
      queue.push({ x: x - 1, y, dist: dist + 1 });
      queue.push({ x, y: y + 1, dist: dist + 1 });
      queue.push({ x, y: y - 1, dist: dist + 1 });
    }
  }

  update(time: number, worldMap: WorldMap): void {
    if (time - this.lastTick >= this.tickInterval) {
      this.lastTick = time;
      this.recalculate(worldMap);
    }
  }
}
