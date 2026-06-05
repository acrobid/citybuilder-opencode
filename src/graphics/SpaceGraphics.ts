import * as Phaser from "phaser";
import {
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  PLANET_CENTER_X,
  PLANET_CENTER_Y,
  PLANET_RADIUS,
  ORBIT_RINGS,
  SPACE_COLORS,
} from "../config.js";

// ── Helpers ──

/** Deterministic hash for star positions */
function starHash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) & 0x7fffffff;
  h = ((h >> 13) ^ h) * 1274126177;
  return (h >> 16) & 0xffff;
}

/** Fill a circle using horizontal scanlines */
export function fillCircle(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  r: number,
  color: number,
  alpha: number,
): void {
  g.fillStyle(color, alpha);
  const ir = Math.round(r);
  for (let row = -ir; row <= ir; row++) {
    const w = Math.sqrt(ir * ir - row * row) | 0;
    g.fillRect(Math.round(cx - w), Math.round(cy + row), w * 2, 1);
  }
}

// ── Main rendering ──

/** Draw deep space background + starfield across the entire map, but only on tiles outside the planet */
export function drawSpaceBackground(g: Phaser.GameObjects.Graphics): void {
  const mapW = MAP_COLS * TILE_SIZE;
  const mapH = MAP_ROWS * TILE_SIZE;

  g.fillStyle(SPACE_COLORS.SPACE_BG, 1);
  g.fillRect(0, 0, mapW, mapH);

  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      const cx = x * TILE_SIZE + TILE_SIZE / 2;
      const cy = y * TILE_SIZE + TILE_SIZE / 2;
      const dx = cx - PLANET_CENTER_X;
      const dy = cy - PLANET_CENTER_Y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= PLANET_RADIUS) continue; // planet surface — drawn by WorldMap

      const hash = starHash(x, y);
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      // 15% chance of a star in this tile
      if (hash % 100 < 15) {
        const brightness = hash % 100 < 5 ? 0.8 : 0.3;
        const color = hash % 3 === 0 ? SPACE_COLORS.STAR_BRIGHT : SPACE_COLORS.STAR_DIM;
        const sx = px + (hash % TILE_SIZE);
        const sy = py + ((hash >> 8) % TILE_SIZE);
        const size = hash % 4 === 0 ? 2 : 1;
        g.fillStyle(color, brightness);
        g.fillRect(sx, sy, size, size);
      }
    }
  }
}

/** Draw blue atmospheric rim around the planet edge */
export function drawPlanetRim(g: Phaser.GameObjects.Graphics): void {
  const centerX = PLANET_CENTER_X;
  const centerY = PLANET_CENTER_Y;
  const radius = PLANET_RADIUS;

  // 6 rings of dots fading outward
  for (let i = 0; i < 6; i++) {
    const alpha = 0.18 - i * 0.025;
    const r = radius + i;
    const steps = Math.floor((2 * Math.PI * r) / 5); // dot every ~5px
    g.fillStyle(SPACE_COLORS.PLANET_RIM, alpha);
    for (let s = 0; s < steps; s++) {
      const angle = (s / steps) * Math.PI * 2;
      const rx = centerX + Math.cos(angle) * r;
      const ry = centerY + Math.sin(angle) * r;
      g.fillRect(Math.round(rx), Math.round(ry), 2, 2);
    }
  }
}

/** Draw dashed orbit rings */
export function drawOrbitRings(g: Phaser.GameObjects.Graphics): void {
  const centerX = PLANET_CENTER_X;
  const centerY = PLANET_CENTER_Y;

  for (const [, ring] of Object.entries(ORBIT_RINGS)) {
    const r = ring.radius;
    const steps = Math.floor((2 * Math.PI * r) / 4); // dash every ~4px
    for (let s = 0; s < steps; s++) {
      // Dashed: only draw every other segment
      if (s % 3 === 0) continue;
      const angle = (s / steps) * Math.PI * 2;
      const rx = centerX + Math.cos(angle) * r;
      const ry = centerY + Math.sin(angle) * r;
      g.fillStyle(SPACE_COLORS.ORBIT_RING, 0.5);
      g.fillRect(Math.round(rx) - 1, Math.round(ry) - 1, 3, 3);
    }
  }
}

// ── Planet surface check ──

/** Check if world coordinates are on the planet surface */
export function isOnPlanet(worldX: number, worldY: number): boolean {
  const dx = worldX - PLANET_CENTER_X;
  const dy = worldY - PLANET_CENTER_Y;
  return Math.sqrt(dx * dx + dy * dy) <= PLANET_RADIUS;
}

/** Check if a tile (by grid col,row) is on the planet surface (uses tile center) */
export function isTileOnPlanet(tileX: number, tileY: number): boolean {
  const cx = tileX * TILE_SIZE + TILE_SIZE / 2;
  const cy = tileY * TILE_SIZE + TILE_SIZE / 2;
  return isOnPlanet(cx, cy);
}

/** Return the nearest orbit ring for a world position, or null if too far away */
export function nearestOrbitRing(worldX: number, worldY: number): keyof typeof ORBIT_RINGS | null {
  const dx = worldX - PLANET_CENTER_X;
  const dy = worldY - PLANET_CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const rings = Object.entries(ORBIT_RINGS) as [
    keyof typeof ORBIT_RINGS,
    (typeof ORBIT_RINGS)[keyof typeof ORBIT_RINGS],
  ][];
  let best: keyof typeof ORBIT_RINGS | null = null;
  let bestDist = Infinity;

  for (const [key, ring] of rings) {
    const d = Math.abs(dist - ring.radius);
    if (d < bestDist) {
      bestDist = d;
      best = key;
    }
  }

  // Only snap if within 50px of a ring
  if (bestDist > 50) return null;
  return best;
}

/** Get angle from planet center to world position (radians, 0 = right) */
export function angleFromCenter(worldX: number, worldY: number): number {
  return Math.atan2(worldY - PLANET_CENTER_Y, worldX - PLANET_CENTER_X);
}
