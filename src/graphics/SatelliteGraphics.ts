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
    case "drone":
      drawDroneSat(g, cx, cy);
      break;
  }
}

// Type 1: Laser Turret — cyan diamond
function drawLaserSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x4488ff, 1);
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

// Type 5: Ion Beam — blue cross
function drawIonSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x6688cc, 1);
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

// Type 10: Drone Hub — orange hexagon (simplified as circle with dots)
function drawDroneSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  fillCircle(g, cx, cy, 5, 0x553300, 1);
  g.fillStyle(SPACE_COLORS.DRONE_BODY, 0.9);
  fillCircle(g, cx, cy, 3, 0xffaa00, 0.7);
  // Small drone dots
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

export function drawMissileProj(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  angle: number,
): void {
  // Trail
  const tx = Math.round(x - Math.cos(angle) * 6);
  const ty = Math.round(y - Math.sin(angle) * 6);
  g.fillStyle(SPACE_COLORS.MISSILE_TRAIL, 0.5);
  g.fillRect(tx - 2, ty - 2, 5, 5);
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

export function drawDroneProj(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(SPACE_COLORS.DRONE_BODY, 1);
  g.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6);
  g.fillStyle(0xffcc44, 0.7);
  g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
}
