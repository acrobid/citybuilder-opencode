import * as Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TILE_SIZE,
  COLORS,
  PLANET_CENTER_X,
  PLANET_CENTER_Y,
} from "../config.js";
import type { WorldMap } from "../map/WorldMap.js";
import type { EconomySystem } from "../systems/EconomySystem.js";
import type { UIManager } from "../ui/UIManager.js";
import { canPlace, BUILDING_TYPES, getBuildingRefund } from "../buildings/Buildings.js";
import type { Tile, ZoneType } from "../entities/Tile.js";
import { nearestOrbitRing, angleFromCenter } from "../graphics/SpaceGraphics.js";
import { SATELLITE_TYPES, ORBIT_RINGS } from "../config.js";
import type { SatelliteType } from "../config.js";
import { drawRangeCircle } from "../graphics/SatelliteGraphics.js";
import type { DefenseSystem } from "../systems/DefenseSystem.js";

interface ToolScene {
  worldMap: WorldMap;
  graphics: Phaser.GameObjects.Graphics;
  economy: EconomySystem;
  uiManager?: UIManager;
  defenseSystem?: DefenseSystem;
  cameras: { main: Phaser.Cameras.Scene2D.Camera };
  input: Phaser.Input.InputPlugin;
  time: { now: number };
}

export class InputHandler {
  scene: ToolScene;
  dragging = false;
  dragStartX = 0;
  dragStartY = 0;
  pointerStartX = 0;
  pointerStartY = 0;
  edgeScrollSpeed = 300;
  edgeMargin = 20;
  hoveredTile: Tile | null = null;
  pointerOverCanvas = true;

  constructor(scene: ToolScene) {
    this.scene = scene;
    this.setupCamera();
    this.setupTools();
  }

  setupCamera(): void {
    const { scene } = this;
    const cam = scene.cameras.main;

    scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.dragging = false;
      this.dragStartX = cam.scrollX;
      this.dragStartY = cam.scrollY;
      this.pointerStartX = pointer.x;
      this.pointerStartY = pointer.y;
    });

    scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      const dx = pointer.x - this.pointerStartX;
      const dy = pointer.y - this.pointerStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.dragging = true;
        cam.scrollX = this.dragStartX - dx / cam.zoom;
        cam.scrollY = this.dragStartY - dy / cam.zoom;
      }
    });

    scene.input.on("pointerup", (_pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) {
        this.handleClick();
      }
    });

    const canvas = (scene as unknown as { game: Phaser.Game }).game.canvas as HTMLCanvasElement;

    canvas.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        e.preventDefault();
        const cam = this.scene.cameras.main;
        const newZoom = Phaser.Math.Clamp(cam.zoom - e.deltaY * 0.001, 0.15, 3);
        cam.zoom = newZoom;
        cam.centerOn(PLANET_CENTER_X, PLANET_CENTER_Y);
      },
      { passive: false },
    );
    canvas.addEventListener("mouseenter", () => {
      this.pointerOverCanvas = true;
    });
    canvas.addEventListener("mouseleave", () => {
      this.pointerOverCanvas = false;
    });
  }

  setupTools(): void {
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) return;
      const cam = this.scene.cameras.main;
      const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
      const tile = this.scene.worldMap.tileAt(worldPoint.x, worldPoint.y);
      this.hoveredTile = tile;
      if (this.scene.uiManager) {
        this.scene.uiManager.showTileInfo(tile);
      }
      this.drawPreview(tile);

      // Satellite preview
      const satType = window.gameState.selectedTool as SatelliteType;
      if (satType && SATELLITE_TYPES[satType as keyof typeof SATELLITE_TYPES]) {
        const ring = nearestOrbitRing(worldPoint.x, worldPoint.y);
        if (ring) {
          const angle = angleFromCenter(worldPoint.x, worldPoint.y);
          const satConfig = SATELLITE_TYPES[satType as keyof typeof SATELLITE_TYPES];
          const ringConfig = ORBIT_RINGS[ring as keyof typeof ORBIT_RINGS];
          const wx = PLANET_CENTER_X + Math.cos(angle) * ringConfig.radius;
          const wy = PLANET_CENTER_Y + Math.sin(angle) * ringConfig.radius;
          this.scene.graphics.fillStyle(0xffffff, 0.3);
          this.scene.graphics.fillRect(wx - 4, wy - 4, 8, 8);
          drawRangeCircle(this.scene.graphics, wx, wy, satConfig.range, 0x88ccff);
        }
      }
    });
  }

  drawPreview(tile: Tile | null): void {
    const { scene } = this;
    scene.worldMap.render(scene.graphics);

    if (!tile) return;
    const tool = window.gameState.selectedTool;
    if (!tool || tool === "bulldoze") return;

    const valid = canPlace(tile, tool, scene.worldMap, window.gameState);
    const color = valid ? COLORS.PREVIEW_VALID : COLORS.PREVIEW_INVALID;

    if (tool === "powerplant") {
      const previewColor = valid ? COLORS.PREVIEW_VALID : COLORS.PREVIEW_INVALID;
      scene.graphics.fillStyle(previewColor, 0.3);
      scene.graphics.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 2);
    } else {
      scene.graphics.fillStyle(color, 0.3);
      scene.graphics.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  handleClick(): void {
    const tool = window.gameState.selectedTool;
    if (!tool) return;

    const pointer = this.scene.input.activePointer;
    const cam = this.scene.cameras.main;
    const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
    const tile = this.scene.worldMap.tileAt(worldPoint.x, worldPoint.y);
    if (!tile) return;

    if (tool === "bulldoze") {
      // Try bulldozing a satellite first
      if (
        this.scene.defenseSystem &&
        this.scene.defenseSystem.removeSatellite(worldPoint.x, worldPoint.y)
      ) {
        this.scene.worldMap.render(this.scene.graphics);
        return;
      }
      this.doBulldoze(tile);
    } else {
      // Check if it's a satellite tool
      const satType = tool as SatelliteType;
      if (SATELLITE_TYPES[satType as keyof typeof SATELLITE_TYPES]) {
        const ring = nearestOrbitRing(worldPoint.x, worldPoint.y);
        if (ring && this.scene.defenseSystem) {
          const angle = angleFromCenter(worldPoint.x, worldPoint.y);
          this.scene.defenseSystem.placeSatellite(satType, angle, ring);
        }
        this.scene.worldMap.render(this.scene.graphics);
        return;
      }

      if (!canPlace(tile, tool, this.scene.worldMap, window.gameState)) return;
      this.doPlace(tile, tool);
    }

    this.scene.worldMap.recalculateConnectivity();
    this.scene.worldMap.render(this.scene.graphics);
  }

  doPlace(tile: Tile, tool: string): void {
    const building = BUILDING_TYPES[tool];
    if (!building) return;
    this.scene.economy.deduct(building.cost);

    if (tool === "powerplant") {
      this.scene.worldMap.tiles[tile.y][tile.x].zone = "powerplant";
      this.scene.worldMap.tiles[tile.y][tile.x + 1].zone = "powerplant";
      this.scene.worldMap.tiles[tile.y + 1][tile.x].zone = "powerplant";
      this.scene.worldMap.tiles[tile.y + 1][tile.x + 1].zone = "powerplant";
    } else {
      tile.zone = tool as ZoneType;
      tile.level = 0;
    }
  }

  doBulldoze(tile: Tile): void {
    if (tile.zone === "empty") return;

    const refund = getBuildingRefund(tile.zone, tile.level);
    this.scene.economy.refund(refund);

    if (tile.zone === "powerplant") {
      this.clearPowerPlant(tile);
    } else {
      tile.zone = "empty";
      tile.level = 0;
    }
  }

  clearPowerPlant(tile: Tile): void {
    const map = this.scene.worldMap;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = tile.x + dx;
        const ny = tile.y + dy;
        if (nx >= 0 && nx < map.cols && ny >= 0 && ny < map.rows) {
          if (map.tiles[ny][nx].zone === "powerplant") {
            map.tiles[ny][nx].zone = "empty";
            map.tiles[ny][nx].level = 0;
          }
        }
      }
    }
  }

  get input(): Phaser.Input.InputPlugin {
    return this.scene.input;
  }

  update(_time: number, _delta: number): void {
    const pointer = this.scene.input.activePointer;
    if (pointer.isDown) return;
    if (!this.pointerOverCanvas) return;

    const cam = this.scene.cameras.main;
    let scrollX = 0;
    let scrollY = 0;

    if (pointer.x > 0 && pointer.x <= this.edgeMargin) scrollX = -1;
    else if (pointer.x >= GAME_WIDTH - this.edgeMargin && pointer.x < GAME_WIDTH) scrollX = 1;

    if (pointer.y > 0 && pointer.y <= this.edgeMargin) scrollY = -1;
    else if (pointer.y >= GAME_HEIGHT - this.edgeMargin && pointer.y < GAME_HEIGHT) scrollY = 1;

    const speed = this.edgeScrollSpeed / cam.zoom;
    cam.scrollX += scrollX * speed * (_delta / 1000);
    cam.scrollY += scrollY * speed * (_delta / 1000);
  }
}
