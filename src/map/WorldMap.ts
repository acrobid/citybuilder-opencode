import { TILE_SIZE, MAP_COLS, MAP_ROWS, COLORS } from "../config.js";
import { Tile } from "../entities/Tile.js";
import * as Phaser from "phaser";
import {
  drawEmptyTile,
  drawRoadTile,
  drawResidentialTile,
  drawCommercialTile,
  drawIndustrialTile,
  drawPowerPlantTile,
} from "../graphics/TileGraphics.js";
import {
  drawSpaceBackground,
  drawPlanetRim,
  drawOrbitRings,
  isTileOnPlanet,
} from "../graphics/SpaceGraphics.js";

export class WorldMap {
  cols: number;
  rows: number;
  width: number;
  height: number;
  tiles: Tile[][];
  dirty = true;
  planetTiles: { x: number; y: number }[] = [];
  spaceTiles: { x: number; y: number }[] = [];

  markDirty(): void {
    this.dirty = true;
  }

  constructor() {
    this.cols = MAP_COLS;
    this.rows = MAP_ROWS;
    this.width = MAP_COLS * TILE_SIZE;
    this.height = MAP_ROWS * TILE_SIZE;

    this.tiles = [];
    this.planetTiles = [];
    this.spaceTiles = [];
    for (let y = 0; y < MAP_ROWS; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < MAP_COLS; x++) {
        this.tiles[y][x] = new Tile(x, y);
        if (isTileOnPlanet(x, y)) {
          this.planetTiles.push({ x, y });
        } else {
          this.spaceTiles.push({ x, y });
        }
      }
    }
  }

  tileAt(worldX: number, worldY: number): Tile | null {
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) {
      return null;
    }
    return this.tiles[ty][tx];
  }

  getNeighbors(tile: Tile): Tile[] {
    const neighbors: Tile[] = [];
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];
    for (const { dx, dy } of dirs) {
      const nx = tile.x + dx;
      const ny = tile.y + dy;
      if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
        neighbors.push(this.tiles[ny][nx]);
      }
    }
    return neighbors;
  }

  isRoadAdjacent(tile: Tile): boolean {
    return this.getNeighbors(tile).some((n) => n.zone === "road");
  }

  isOnPlanetSurface(tileX: number, tileY: number): boolean {
    return isTileOnPlanet(tileX, tileY);
  }

  canPlace2x2(tile: Tile): boolean {
    const { x, y } = tile;
    if (x + 1 >= this.cols || y + 1 >= this.rows) return false;
    if (
      !this.isOnPlanetSurface(x, y) ||
      !this.isOnPlanetSurface(x + 1, y) ||
      !this.isOnPlanetSurface(x, y + 1) ||
      !this.isOnPlanetSurface(x + 1, y + 1)
    )
      return false;
    const tiles = [
      this.tiles[y][x],
      this.tiles[y][x + 1],
      this.tiles[y + 1][x],
      this.tiles[y + 1][x + 1],
    ];
    return tiles.every((t) => t.zone === "empty");
  }

  recalculateConnectivity(): void {
    // Only planet tiles can hold zones, so skip the ~8,600 space tiles.
    for (const { x, y } of this.planetTiles) {
      const tile = this.tiles[y][x];
      if (tile.zone !== "empty" && tile.zone !== "road") {
        tile.roadConnected = this.isRoadAdjacentAt(x, y);
      } else {
        tile.roadConnected = false;
      }
    }
    this.dirty = true;
  }

  /** Allocation-free road-adjacency check (avoids getNeighbors array churn). */
  private isRoadAdjacentAt(x: number, y: number): boolean {
    const t = this.tiles;
    if (y > 0 && t[y - 1][x].zone === "road") return true;
    if (y < this.rows - 1 && t[y + 1][x].zone === "road") return true;
    if (x > 0 && t[y][x - 1].zone === "road") return true;
    if (x < this.cols - 1 && t[y][x + 1].zone === "road") return true;
    return false;
  }

  /**
   * Draw the static space background, starfield, planet rim and orbit rings.
   * These never change, so this should be rendered once into a dedicated layer
   * rather than on every dirty re-render.
   */
  renderBackground(graphics: Phaser.GameObjects.Graphics): void {
    graphics.clear();
    drawSpaceBackground(graphics, this.spaceTiles);
    drawPlanetRim(graphics);
    drawOrbitRings(graphics);
  }

  render(graphics: Phaser.GameObjects.Graphics): void {
    graphics.clear();

    for (const { x, y } of this.planetTiles) {
      const tile = this.tiles[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      switch (tile.zone) {
        case "road":
          drawRoadTile(graphics, x, y, px, py, this.tiles);
          break;
        case "residential":
          drawResidentialTile(graphics, x, y, px, py, tile.level);
          break;
        case "commercial":
          drawCommercialTile(graphics, x, y, px, py, tile.level);
          break;
        case "industrial":
          drawIndustrialTile(graphics, x, y, px, py, tile.level);
          break;
        case "powerplant":
          drawPowerPlantTile(graphics, x, y, px, py, this.tiles);
          break;
        default:
          drawEmptyTile(graphics, x, y, px, py);
          break;
      }

      // Power overlay
      if (tile.zone !== "empty" && tile.zone !== "road" && !tile.isPowered) {
        graphics.fillStyle(0x000000, 0.35);
        graphics.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }

      if (
        tile.isPowered &&
        (tile.zone === "residential" || tile.zone === "commercial" || tile.zone === "industrial")
      ) {
        graphics.fillStyle(0xffdd00, 0.08);
        graphics.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }

      // Grid lines
      graphics.fillStyle(COLORS.GRID_LINE, 0.1);
      graphics.fillRect(px, py, TILE_SIZE, 1);
      graphics.fillRect(px, py, 1, TILE_SIZE);
    }
  }

  save(satellites?: { type: string; ring: string; angle: number }[]): void {
    const data = {
      tiles: this.tiles.map((row) =>
        row.map((tile) => ({
          zone: tile.zone,
          level: tile.level,
          isPowered: tile.isPowered,
          roadConnected: tile.roadConnected,
        })),
      ),
      gameState: {
        money: window.gameState.money,
        population: window.gameState.population,
        date: window.gameState.date,
        income: window.gameState.income,
        expenses: window.gameState.expenses,
        selectedTool: window.gameState.selectedTool,
        wave: window.gameState.wave,
        waveActive: window.gameState.waveActive,
        enemiesRemaining: window.gameState.enemiesRemaining,
        gameOver: window.gameState.gameOver,
      },
      satellites: satellites ?? [],
    };
    localStorage.setItem("citybuilder-save", JSON.stringify(data));
  }

  static load(): {
    map: WorldMap;
    satellites: { type: string; ring: string; angle: number }[];
  } | null {
    const raw = localStorage.getItem("citybuilder-save");
    if (!raw) return null;

    const data = JSON.parse(raw);

    if (data.gameState) {
      Object.assign(window.gameState, data.gameState);
    }

    const map = new WorldMap();

    if (data.tiles) {
      for (let y = 0; y < Math.min(data.tiles.length, map.rows); y++) {
        for (let x = 0; x < Math.min(data.tiles[y].length, map.cols); x++) {
          const saved = data.tiles[y][x];
          if (saved) {
            map.tiles[y][x].zone = saved.zone;
            map.tiles[y][x].level = saved.level;
            map.tiles[y][x].isPowered = saved.isPowered;
            map.tiles[y][x].roadConnected = saved.roadConnected;
          }
        }
      }
    }

    return { map, satellites: data.satellites ?? [] };
  }
}
