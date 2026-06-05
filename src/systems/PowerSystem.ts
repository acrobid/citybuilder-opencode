import { WorldMap } from "../map/WorldMap.js";

export class PowerSystem {
  powerRadius = 20;
  tickInterval = 3000;
  lastTick = 0;
  private _visited: Uint8Array = new Uint8Array(0);
  private _queue: number[] = [];

  recalculate(worldMap: WorldMap): void {
    const cols = worldMap.cols;
    const rows = worldMap.rows;
    const needed = cols * rows;

    // Reset power state
    for (const { x, y } of worldMap.planetTiles) {
      worldMap.tiles[y][x].isPowered = false;
    }

    // Pre-allocate or reuse visited array
    if (this._visited.length !== needed) {
      this._visited = new Uint8Array(needed);
    } else {
      this._visited.fill(0);
    }

    for (const { x, y } of worldMap.planetTiles) {
      if (worldMap.tiles[y][x].zone === "powerplant") {
        this.bfsPower(worldMap, x, y, cols);
      }
    }
  }

  bfsPower(worldMap: WorldMap, startX: number, startY: number, cols: number): void {
    const visited = this._visited;
    const queue = this._queue;
    queue.length = 0;
    queue.push((startY << 8) | startX); // dist=0 implicit
    let head = 0;
    const maxDist = this.powerRadius;

    while (head < queue.length) {
      const p = queue[head++];
      const x = p & 0xff;
      const y = (p >> 8) & 0xff;
      const dist = p >> 16;

      if (x >= cols || y >= worldMap.rows || dist > maxDist) continue;

      const idx = y * cols + x;
      if (visited[idx]) continue;
      visited[idx] = 1;

      worldMap.tiles[y][x].isPowered = true;

      const nd = dist + 1;
      queue.push((nd << 16) | (y << 8) | (x + 1));
      queue.push((nd << 16) | (y << 8) | (x - 1));
      queue.push((nd << 16) | ((y + 1) << 8) | x);
      queue.push((nd << 16) | ((y - 1) << 8) | x);
    }
  }

  update(time: number, worldMap: WorldMap): void {
    if (time - this.lastTick >= this.tickInterval) {
      this.lastTick = time;
      this.recalculate(worldMap);
      worldMap.markDirty();
    }
  }
}
