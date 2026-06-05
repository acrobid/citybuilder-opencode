import { WorldMap } from "../map/WorldMap.js";

export class ZoneSystem {
  tickInterval = 15000;
  lastTick = 0;
  growthChance = 0.15;

  tick(worldMap: WorldMap): void {
    let changed = false;
    for (const { x, y } of worldMap.planetTiles) {
      const tile = worldMap.tiles[y][x];
      if (!this.isZoneType(tile.zone)) continue;
      if (tile.level >= 4) continue;
      if (!tile.roadConnected) continue;
      if (!tile.isPowered) continue;

      if (Math.random() < this.growthChance) {
        tile.level++;
        changed = true;
      }
    }
    if (changed) worldMap.markDirty();
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
