import * as Phaser from "phaser";
import { TILE_SIZE, COLORS } from "../config.js";
import type { Tile } from "../entities/Tile.js";

const S = TILE_SIZE;

function fillCircle(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number): void {
  for (let row = -r; row <= r; row++) {
    const w = Math.sqrt(r * r - row * row) | 0;
    g.fillRect(cx - w, cy + row, w * 2, 1);
  }
}

function drawRoof(
  g: Phaser.GameObjects.Graphics,
  px: number,
  py: number,
  w: number,
  h: number,
  color: number,
): void {
  const cx = px + w / 2;
  for (let row = 0; row < h; row++) {
    const lineW = ((w * (row + 1)) / h) | 0;
    g.fillStyle(color, 1);
    g.fillRect((cx - lineW / 2) | 0, py + row, lineW, 1);
  }
}

function grassShade(x: number, y: number): number {
  const h = (x * 7 + y * 13) & 7;
  if (h < 2) return 0.05;
  if (h < 4) return -0.03;
  return 0;
}

export function drawEmptyTile(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  px: number,
  py: number,
): void {
  const shade = grassShade(x, y);
  const r = ((COLORS.EMPTY >> 16) & 0xff) + shade * 255;
  const gr = ((COLORS.EMPTY >> 8) & 0xff) + shade * 255;
  const b = (COLORS.EMPTY & 0xff) + shade * 255;
  const color =
    (Math.min(255, Math.max(0, r | 0)) << 16) |
    (Math.min(255, Math.max(0, gr | 0)) << 8) |
    Math.min(255, Math.max(0, b | 0));
  g.fillStyle(color, 1);
  g.fillRect(px, py, S, S);

  if ((x * 3 + y * 7) % 5 === 0) {
    g.fillStyle(0x3a7a2e, 0.4);
    g.fillRect(px + 6, py + 10, 2, 5);
    g.fillRect(px + 20, py + 18, 2, 4);
    g.fillRect(px + 14, py + 8, 2, 6);
  }
  if ((x * 5 + y * 11) % 7 === 3) {
    g.fillStyle(0x4a8a3e, 0.3);
    g.fillRect(px + 10, py + 22, 2, 4);
    g.fillRect(px + 24, py + 6, 2, 5);
  }
}

export function drawRoadTile(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  px: number,
  py: number,
  tiles: Tile[][],
): void {
  g.fillStyle(COLORS.ROAD, 1);
  g.fillRect(px, py, S, S);

  const rows = tiles.length;
  const cols = tiles[0].length;
  const hasN = y > 0 && tiles[y - 1][x].zone === "road";
  const hasS = y < rows - 1 && tiles[y + 1][x].zone === "road";
  const hasW = x > 0 && tiles[y][x - 1].zone === "road";
  const hasE = x < cols - 1 && tiles[y][x + 1].zone === "road";

  const vert = hasN || hasS;
  const horiz = hasW || hasE;

  g.fillStyle(0xffffff, 0.3);
  if (vert) {
    g.fillRect(px + 1, py, 1, S);
    g.fillRect(px + S - 2, py, 1, S);
  }
  if (horiz) {
    g.fillRect(px, py + 1, S, 1);
    g.fillRect(px, py + S - 2, S, 1);
  }

  g.fillStyle(0xdddd00, 0.9);
  if (vert) {
    g.fillRect(px + 14, py + 1, 4, 6);
    g.fillRect(px + 14, py + 10, 4, 6);
    g.fillRect(px + 14, py + 19, 4, 6);
    g.fillRect(px + 14, py + 27, 4, 5);
  }
  if (horiz) {
    g.fillRect(px + 1, py + 14, 6, 4);
    g.fillRect(px + 10, py + 14, 6, 4);
    g.fillRect(px + 19, py + 14, 6, 4);
    g.fillRect(px + 27, py + 14, 5, 4);
  }
}

export function drawResidentialTile(
  g: Phaser.GameObjects.Graphics,
  _x: number,
  _y: number,
  px: number,
  py: number,
  level: number,
): void {
  const baseColor = level >= 3 ? 0x44bb44 : level >= 2 ? 0x3cb043 : 0x33aa33;
  g.fillStyle(baseColor, 1);
  g.fillRect(px, py, S, S);

  if (level === 0) return;

  const wallColor = level >= 3 ? 0xf5deb3 : level >= 2 ? 0xfaf0d7 : 0xfffacd;
  const windowColor = 0x87ceeb;
  const doorColor = 0x8b4513;

  if (level < 4) {
    const wallW = level >= 2 ? 20 : 16;
    const wallH = level >= 2 ? 14 : 12;
    const wallX = px + (S - wallW) / 2;
    const wallY = py + S - wallH - 4;

    drawRoof(g, px + 2, py + 2, S - 4, wallY - py - 1, doorColor);

    g.fillStyle(wallColor, 1);
    g.fillRect(wallX, wallY, wallW, wallH);

    g.fillStyle(windowColor, 1);
    if (level >= 2) {
      g.fillRect(wallX + 2, wallY + 2, 5, 5);
      g.fillRect(wallX + wallW - 7, wallY + 2, 5, 5);
    } else {
      g.fillRect(wallX + (wallW - 5) / 2, wallY + 2, 5, 5);
    }

    g.fillStyle(doorColor, 1);
    g.fillRect(wallX + (wallW - 4) / 2, wallY + wallH - 7, 4, 7);
  } else {
    g.fillStyle(0xcd853f, 1);
    g.fillRect(px + 2, py + 1, S - 4, 4);

    g.fillStyle(wallColor, 1);
    g.fillRect(px + 2, py + 5, S - 4, S - 8);

    g.fillStyle(windowColor, 1);
    g.fillRect(px + 4, py + 8, 5, 5);
    g.fillRect(px + 11, py + 8, 5, 5);
    g.fillRect(px + 18, py + 8, 5, 5);
    g.fillRect(px + 4, py + 17, 5, 5);
    g.fillRect(px + 11, py + 17, 5, 5);
    g.fillRect(px + 18, py + 17, 5, 5);

    g.fillStyle(doorColor, 1);
    g.fillRect(px + 13, py + S - 7, 4, 7);
  }
}

export function drawCommercialTile(
  g: Phaser.GameObjects.Graphics,
  _x: number,
  _y: number,
  px: number,
  py: number,
  level: number,
): void {
  const baseColor = level >= 3 ? 0x4488dd : level >= 2 ? 0x3b78cc : 0x3366cc;
  g.fillStyle(baseColor, 1);
  g.fillRect(px, py, S, S);

  if (level === 0) return;

  const wallColor = level >= 3 ? 0xd4e6f1 : 0xe8f0f8;
  const windowColor = 0x2ecc71;
  const awningColor = 0xcc3333;

  if (level < 4) {
    g.fillStyle(awningColor, 1);
    g.fillRect(px + 4, py + 2, S - 8, 3);

    g.fillStyle(wallColor, 1);
    g.fillRect(px + 2, py + 6, S - 4, S - 12);

    g.fillStyle(windowColor, 1);
    g.fillRect(px + 4, py + 9, 6, 5);
    g.fillRect(px + S - 10, py + 9, 6, 5);

    g.fillStyle(awningColor, 0.7);
    g.fillRect(px + 3, py + S - 5, S - 6, 3);
  } else {
    g.fillStyle(0x5dade2, 1);
    g.fillRect(px + 1, py + 1, S - 2, 3);

    g.fillStyle(wallColor, 1);
    g.fillRect(px + 1, py + 4, S - 2, S - 5);

    g.fillStyle(windowColor, 1);
    g.fillRect(px + 3, py + 7, 5, 5);
    g.fillRect(px + 10, py + 7, 5, 5);
    g.fillRect(px + 17, py + 7, 5, 5);
    g.fillRect(px + 3, py + 16, 5, 5);
    g.fillRect(px + 10, py + 16, 5, 5);
    g.fillRect(px + 17, py + 16, 5, 5);

    g.fillStyle(awningColor, 0.7);
    g.fillRect(px + 6, py + S - 4, S - 12, 2);
  }
}

export function drawIndustrialTile(
  g: Phaser.GameObjects.Graphics,
  _x: number,
  _y: number,
  px: number,
  py: number,
  level: number,
): void {
  const baseColor = level >= 3 ? 0xdd8844 : level >= 2 ? 0xd4a33a : 0xcc9933;
  g.fillStyle(baseColor, 1);
  g.fillRect(px, py, S, S);

  if (level === 0) return;

  const bldgColor = 0x808080;
  const roofColor = 0x606060;
  const chimneyColor = 0x555555;
  const smokeColor = 0xcccccc;

  if (level < 4) {
    const bldgW = level >= 2 ? 22 : 18;
    const bldgH = level >= 2 ? 14 : 12;
    const bldgX = px + (S - bldgW) / 2;
    const bldgY = py + S - bldgH - 3;

    g.fillStyle(bldgColor, 1);
    g.fillRect(bldgX, bldgY, bldgW, bldgH);

    g.fillStyle(roofColor, 1);
    g.fillRect(bldgX - 1, bldgY - 2, bldgW + 2, 3);

    g.fillStyle(chimneyColor, 1);
    g.fillRect(px + S - 9, bldgY - 10, 3, 10);

    g.fillStyle(smokeColor, 0.5);
    fillCircle(g, px + S - 7, bldgY - 13, 3);
    fillCircle(g, px + S - 5, bldgY - 17, 4);
  } else {
    g.fillStyle(bldgColor, 1);
    g.fillRect(px + 1, py + 6, S - 2, S - 8);

    g.fillStyle(roofColor, 1);
    g.fillRect(px + 1, py + 4, S - 2, 3);

    g.fillStyle(chimneyColor, 1);
    g.fillRect(px + 4, py + 1, 2, 7);
    g.fillRect(px + S - 8, py, 2, 10);

    g.fillStyle(smokeColor, 0.5);
    fillCircle(g, px + 5, py - 1, 3);
    fillCircle(g, px + S - 7, py - 3, 4);
    fillCircle(g, px + S - 5, py - 7, 3);
  }
}

export function drawPowerPlantTile(
  g: Phaser.GameObjects.Graphics,
  _x: number,
  _y: number,
  px: number,
  py: number,
  _tiles: Tile[][],
): void {
  g.fillStyle(COLORS.POWERPLANT, 1);
  g.fillRect(px, py, S, S);

  g.fillStyle(0xe8e8e8, 0.9);
  g.fillRect(px + 2, py + 4, S - 4, S - 7);

  g.fillStyle(0xcc3333, 1);
  g.fillRect(px + 2, py + 1, S - 4, 5);

  g.fillStyle(0x888888, 0.4);
  g.fillRect(px + 4, py + S - 5, S - 8, 2);

  g.fillStyle(0xdddddd, 0.3);
  fillCircle(g, px + S / 2, py + S / 2, 5);
}
