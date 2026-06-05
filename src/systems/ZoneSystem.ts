import { WorldMap } from "../map/WorldMap.js";

export class ZoneSystem {
  tickInterval = 15000;
  lastTick = 0;
  growthChance = 0.15;

  tick(worldMap: WorldMap): void {
    for (let y = 0; y < worldMap.rows; y++) {
      for (let x = 0; x < worldMap.cols; x++) {
        const tile = worldMap.tiles[y][x];
        if (!this.isZoneType(tile.zone)) continue;
        if (tile.level >= 4) continue;
        if (!tile.roadConnected) continue;
        if (!tile.isPowered) continue;

        if (Math.random() < this.growthChance) {
          tile.level++;
        }
      }
    }
  }

  isZoneType(zone: string): boolean {
    return zone === "residential" || zone === "commercial" || zone === "industrial";
  }

  update(time: number, worldMap: WorldMap): void {
    if (time - this.lastTick >= this.tickInterval) {
      this.lastTick = time;
      this.tick(worldMap);
    }
  }
}
