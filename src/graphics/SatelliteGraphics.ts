import * as Phaser from "phaser";
import { SPACE_COLORS } from "../config.js";
import { OrbitalSatellite } from "../entities/OrbitalSatellite.js";
import { fillCircle } from "./SpaceGraphics.js";

// ── Satellite sprites ──

export function drawSatellite(g: Phaser.GameObjects.Graphics, sat: OrbitalSatellite): void {
  const cx = Math.round(sat.worldX);
  const cy = Math.round(sat.worldY);

  // Synergy glow (underneath)
  if (sat.hasTwinSynergy || sat.hasTrinitySynergy) {
    const glowAlpha = sat.hasTrinitySynergy ? 0.4 : 0.25;
    fillCircle(g, cx, cy, 8, 0xffffff, glowAlpha);
  }
  if (sat.hasCrossRingSynergy) {
    fillCircle(g, cx, cy, 9, 0x88aacc, 0.2);
  }

  // Draw type-specific shape
  switch (sat.type) {
    case "laser":
      drawLaserSat(g, cx, cy);
      break;
    case "missile":
      drawMissileSat(g, cx, cy);
      break;
    case "plasma":
      drawPlasmaSat(g, cx, cy);
      break;
    case "railgun":
      drawRailgunSat(g, cx, cy);
      break;
    case "ion":
      drawIonSat(g, cx, cy);
      break;
    case "tesla":
      drawTeslaSat(g, cx, cy);
      break;
    case "gravity":
      drawGravitySat(g, cx, cy);
      break;
    case "emp":
      drawEmpSat(g, cx, cy);
      break;
    case "shield":
      drawShieldSat(g, cx, cy);
      break;
    case "shrapnel":
      drawShrapnelSat(g, cx, cy);
      break;
  }
}

// Type 1: Laser Turret — red diamond
function drawLaserSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x882222, 1);
  g.fillRect(cx - 3, cy - 3, 6, 6);
  g.fillStyle(SPACE_COLORS.LASER_BEAM, 1);
  g.fillRect(cx - 1, cy - 1, 2, 2);
}

// Type 2: Missile Battery — orange triangle
function drawMissileSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0xff6644, 1);
  g.fillRect(cx - 3, cy - 2, 6, 5);
  g.fillStyle(SPACE_COLORS.MISSILE_TRAIL, 0.8);
  g.fillRect(cx - 1, cy - 3, 2, 2);
}

// Type 3: Plasma Cannon — green circle
function drawPlasmaSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  fillCircle(g, cx, cy, 4, 0x00ff66, 1);
  fillCircle(g, cx, cy, 2, 0x88ffbb, 0.8);
}

// Type 4: Railgun — long red rectangle
function drawRailgunSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0xff4444, 1);
  g.fillRect(cx - 5, cy - 2, 10, 4);
  g.fillStyle(0xff8888, 0.6);
  g.fillRect(cx - 3, cy - 1, 6, 2);
}

// Type 5: Ion Beam — gold/yellow cross
function drawIonSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x886633, 1);
  g.fillRect(cx - 4, cy - 1, 8, 2);
  g.fillRect(cx - 1, cy - 4, 2, 8);
  g.fillStyle(SPACE_COLORS.ION_BEAM, 0.8);
  g.fillRect(cx - 1, cy - 1, 2, 2);
}

// Type 6: Tesla Coil — cyan spark
function drawTeslaSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  fillCircle(g, cx, cy, 4, 0x003344, 1);
  g.fillStyle(SPACE_COLORS.TESLA_ARC, 1);
  g.fillRect(cx - 1, cy - 4, 2, 8);
  g.fillRect(cx - 4, cy - 1, 8, 2);
  fillCircle(g, cx, cy, 2, 0xffffff, 0.9);
}

// Type 7: Gravity Well — purple swirl (simplified as ring)
function drawGravitySat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  fillCircle(g, cx, cy, 5, 0x663388, 1);
  fillCircle(g, cx, cy, 3, 0x9966cc, 0.7);
  fillCircle(g, cx, cy, 1, 0xcc99ff, 1);
}

// Type 8: EMP Launcher — yellow lightning bolt
function drawEmpSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0xcccc44, 1);
  g.fillRect(cx - 3, cy - 2, 6, 4);
  g.fillStyle(0xffff66, 0.9);
  // Lightning shape: zigzag
  g.fillRect(cx, cy - 3, 1, 2);
  g.fillRect(cx + 1, cy - 2, 1, 2);
  g.fillRect(cx - 1, cy - 1, 3, 1);
  g.fillRect(cx - 1, cy + 1, 1, 2);
}

// Type 9: Shield Projector — blue arc indicator
function drawShieldSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  fillCircle(g, cx, cy, 5, 0x334466, 1);
  g.fillStyle(SPACE_COLORS.SHIELD_ARC, 0.8);
  fillCircle(g, cx, cy, 3, 0x6699cc, 0.6);
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(cx - 1, cy - 1, 2, 2);
}

// Type 10: Shrapnel Hub — orange hexagon (simplified as circle with dots)
function drawShrapnelSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  fillCircle(g, cx, cy, 5, 0x553300, 1);
  g.fillStyle(SPACE_COLORS.SHRAPNEL_BODY, 0.9);
  fillCircle(g, cx, cy, 3, 0xffaa00, 0.7);
  // Small shrapnel dots
  g.fillStyle(0xffcc44, 0.8);
  g.fillRect(cx - 5, cy - 2, 2, 2);
  g.fillRect(cx + 3, cy + 2, 2, 2);
}

// ── Range circle (shown on hover) ──
export function drawRangeCircle(
  g: Phaser.GameObjects.Graphics,
  wx: number,
  wy: number,
  range: number,
  color: number,
): void {
  const steps = Math.floor((2 * Math.PI * range) / 6);
  for (let s = 0; s < steps; s++) {
    const a = (s / steps) * Math.PI * 2;
    const rx = wx + Math.cos(a) * range;
    const ry = wy + Math.sin(a) * range;
    g.fillStyle(color, 0.2);
    g.fillRect(Math.round(rx), Math.round(ry), 2, 2);
  }
}

// ── Projectiles ──

export function drawLaserBeam(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(SPACE_COLORS.LASER_BEAM, 1);
  g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
}

export function drawLaserBeamLine(
  g: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  // Outer glow
  g.lineStyle(10, 0xff2200, 0.08);
  g.lineBetween(x1, y1, x2, y2);
  // Mid glow
  g.lineStyle(6, 0xff3300, 0.25);
  g.lineBetween(x1, y1, x2, y2);
  // Core
  g.lineStyle(3, 0xff4444, 0.75);
  g.lineBetween(x1, y1, x2, y2);
  // White-hot center
  g.lineStyle(1, 0xffaa88, 0.9);
  g.lineBetween(x1, y1, x2, y2);
}

export function drawIonBeamLine(
  g: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
): void {
  const outer = Math.max(2, Math.round(width * 0.5));
  const mid = Math.max(1, Math.round(width * 0.28));
  const core = Math.max(1, Math.round(width * 0.14));
  const center = Math.max(1, Math.round(width * 0.05));
  g.lineStyle(outer, 0xffdd44, 0.06);
  g.lineBetween(x1, y1, x2, y2);
  g.lineStyle(mid, 0xffdd44, 0.18);
  g.lineBetween(x1, y1, x2, y2);
  g.lineStyle(core, 0xffff44, 0.55);
  g.lineBetween(x1, y1, x2, y2);
  g.lineStyle(center, 0xffffaa, 0.9);
  g.lineBetween(x1, y1, x2, y2);
}

export function drawMissileProj(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  angle: number,
): void {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  // Big smoke trail — expanding puffs
  for (let i = 0; i < 6; i++) {
    const t = (i + 1) / 7;
    const dist = t * 30 + 2;
    const size = 8 + t * 14;
    const alpha = (1 - t) * 0.25;
    const perp = ((i & 1) * 2 - 1) * t * 3;
    const tx = Math.round(x - cosA * dist - sinA * perp);
    const ty = Math.round(y - sinA * dist + cosA * perp);
    g.fillStyle(SPACE_COLORS.MISSILE_TRAIL, alpha);
    g.fillRect(tx - size / 2, ty - size / 2, size, size);
  }
  // Body
  g.fillStyle(SPACE_COLORS.MISSILE_TRAIL, 1);
  g.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6);
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
}

export function drawPlasmaBlob(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  fillCircle(g, Math.round(x), Math.round(y), 5, SPACE_COLORS.PLASMA_BLOB, 1);
  fillCircle(g, Math.round(x), Math.round(y), 2, 0xffffff, 0.8);
}

export function drawRailgunTracer(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(SPACE_COLORS.RAILGUN_TRACER, 1);
  g.fillRect(Math.round(x) - 5, Math.round(y) - 2, 10, 4);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 2);
}

export function drawIonBolt(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(SPACE_COLORS.ION_BEAM, 1);
  g.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6);
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
}

export function drawTeslaBolt(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(SPACE_COLORS.TESLA_ARC, 1);
  g.fillRect(Math.round(x) - 3, Math.round(y) - 1, 6, 3);
  g.fillRect(Math.round(x) - 1, Math.round(y) - 3, 3, 6);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
}

export function drawEMPWave(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  fillCircle(g, Math.round(x), Math.round(y), 5, 0xffff44, 0.8);
  fillCircle(g, Math.round(x), Math.round(y), 8, 0xffff44, 0.3);
}

export function drawShieldWave(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  fillCircle(g, Math.round(x), Math.round(y), 6, SPACE_COLORS.SHIELD_ARC, 0.6);
  fillCircle(g, Math.round(x), Math.round(y), 10, SPACE_COLORS.SHIELD_ARC, 0.2);
}

export function drawShieldBarrier(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  hits: number,
  maxHits: number,
): void {
  const cx = Math.round(x);
  const cy = Math.round(y);
  const alpha = 0.3 + (hits / maxHits) * 0.7;
  // Outer glow
  fillCircle(g, cx, cy, 14, SPACE_COLORS.SHIELD_ARC, alpha * 0.2);
  fillCircle(g, cx, cy, 11, SPACE_COLORS.SHIELD_ARC, alpha * 0.15);
  // Wider panel body (longer along the arc, shorter radially)
  g.fillStyle(SPACE_COLORS.SHIELD_ARC, alpha * 0.7);
  g.fillRect(cx - 10, cy - 5, 20, 10);
  // Inner bright core
  g.fillStyle(0xaaddff, alpha * 0.8);
  g.fillRect(cx - 6, cy - 2, 12, 4);
  // Bright edge highlights
  g.fillStyle(0xffffff, alpha * 0.4);
  g.fillRect(cx - 10, cy - 5, 20, 1);
  g.fillRect(cx - 10, cy + 4, 20, 1);
}

export function drawShrapnelProj(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  angle: number,
): void {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const perpCos = Math.cos(angle + Math.PI / 2);
  const perpSin = Math.sin(angle + Math.PI / 2);

  // Engine glow (trailing)
  const glowX = x - cosA * 6;
  const glowY = y - sinA * 6;
  fillCircle(g, Math.round(glowX), Math.round(glowY), 4, 0xff8800, 0.25);
  fillCircle(g, Math.round(glowX - cosA * 3), Math.round(glowY - sinA * 3), 3, 0xff6600, 0.12);

  // Small triangular body
  const tipX = x + cosA * 4;
  const tipY = y + sinA * 4;
  const leftX = x + perpCos * 3 - cosA * 2;
  const leftY = y + perpSin * 3 - sinA * 2;
  const rightX = x - perpCos * 3 - cosA * 2;
  const rightY = y - perpSin * 3 - sinA * 2;

  g.fillStyle(SPACE_COLORS.SHRAPNEL_BODY, 1);
  g.fillTriangle(tipX, tipY, leftX, leftY, rightX, rightY);

  // Bright core
  g.fillStyle(0xffcc44, 0.8);
  g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
}
