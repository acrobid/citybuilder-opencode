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
  time: number,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return;
  const nx = dx / len;
  const ny = dy / len;

  // Base beam glow
  g.lineStyle(Math.max(2, Math.round(width * 0.5)), 0xffdd44, 0.06);
  g.lineBetween(x1, y1, x2, y2);
  g.lineStyle(Math.max(1, Math.round(width * 0.28)), 0xffdd44, 0.18);
  g.lineBetween(x1, y1, x2, y2);
  g.lineStyle(Math.max(1, Math.round(width * 0.14)), 0xffff44, 0.55);
  g.lineBetween(x1, y1, x2, y2);
  g.lineStyle(Math.max(1, Math.round(width * 0.05)), 0xffffaa, 0.9);
  g.lineBetween(x1, y1, x2, y2);

  // Traveling energy pulses — large bright bands moving from sat → target
  const t = time * 0.001;
  const pulseCount = 3;
  for (let i = 0; i < pulseCount; i++) {
    const phase = i / pulseCount;
    const p = (t * 0.25 + phase) % 1;
    const px = x1 + nx * len * p;
    const py = y1 + ny * len * p;
    const pr = width * 0.6;
    g.fillStyle(0xffff88, 0.35);
    g.fillCircle(Math.round(px), Math.round(py), Math.round(pr * 1.5));
    g.fillStyle(0xffffee, 0.6);
    g.fillCircle(Math.round(px), Math.round(py), Math.round(pr));
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(Math.round(px), Math.round(py), Math.round(pr * 0.4));
  }
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
  const rx = Math.round(x);
  const ry = Math.round(y);
  g.fillStyle(SPACE_COLORS.TESLA_ARC, 1);
  g.fillRect(rx - 5, ry - 2, 10, 4);
  g.fillRect(rx - 2, ry - 5, 4, 10);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(rx - 2, ry - 2, 4, 4);
  g.fillStyle(SPACE_COLORS.TESLA_ARC, 0.25);
  g.fillRect(rx - 9, ry - 4, 18, 8);
  g.fillRect(rx - 4, ry - 9, 8, 18);
}

export function drawTeslaChain(
  g: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number,
): void {
  const segments = 14;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return;
  const nx = dx / len;
  const ny = dy / len;
  const px = -ny;
  const py = nx;
  const maxJitter = Math.min(len * 0.3, 80);

  // Pseudo-random jitter per segment (seeded for consistent frame look)
  let r = seed * 7.3;
  const jx: number[] = [];
  const jy: number[] = [];
  for (let i = 1; i < segments; i++) {
    r = (r * 9301 + 49297) % 233280;
    const j = (r / 233280) * 2 - 1;
    const s = Math.sin(i * 1.7 + seed * 0.1) * 0.5;
    jx.push(px * maxJitter * (j + s));
    jy.push(py * maxJitter * (j + s));
  }

  // Outer glow pass (wide)
  g.lineStyle(24, 0x44ddff, 0.25);
  g.beginPath();
  g.moveTo(x1, y1);
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const x = x1 + dx * t + jx[i - 1];
    const y = y1 + dy * t + jy[i - 1];
    g.lineTo(x, y);
  }
  g.lineTo(x2, y2);
  g.strokePath();

  // Mid glow
  g.lineStyle(12, 0x88eeff, 0.5);
  g.beginPath();
  g.moveTo(x1, y1);
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const x = x1 + dx * t + jx[i - 1];
    const y = y1 + dy * t + jy[i - 1];
    g.lineTo(x, y);
  }
  g.lineTo(x2, y2);
  g.strokePath();

  // Core arc
  g.lineStyle(5, 0xffffff, 1);
  g.beginPath();
  g.moveTo(x1, y1);
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const x = x1 + dx * t + jx[i - 1];
    const y = y1 + dy * t + jy[i - 1];
    g.lineTo(x, y);
  }
  g.lineTo(x2, y2);
  g.strokePath();

  // Inner bright line
  g.lineStyle(2, SPACE_COLORS.TESLA_ARC, 1);
  g.beginPath();
  g.moveTo(x1, y1);
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const x = x1 + dx * t + jx[i - 1];
    const y = y1 + dy * t + jy[i - 1];
    g.lineTo(x, y);
  }
  g.lineTo(x2, y2);
  g.strokePath();
}

export function drawTeslaRemnant(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  t: number,
): void {
  const alpha = Math.max(0, 1 - t);
  const spread = 10 + t * 40;
  for (let b = 0; b < 3; b++) {
    const bx = x + (Math.random() - 0.5) * spread;
    const by = y + (Math.random() - 0.5) * spread;
    g.lineStyle(3 + t * 6, SPACE_COLORS.TESLA_ARC, alpha * 0.4);
    g.beginPath();
    g.moveTo(x, y);
    const steps = 4;
    for (let i = 1; i <= steps; i++) {
      const frac = i / steps;
      const jx = (Math.random() - 0.5) * spread * 0.6;
      const jy = (Math.random() - 0.5) * spread * 0.6;
      g.lineTo(x + (bx - x) * frac + jx, y + (by - y) * frac + jy);
    }
    g.strokePath();
  }
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

// ── Black Hole Effect ──
const RING_DEFS = [
  { radius: 0.44, width: 5, color: 0xffffff, alpha: 0.55 },
  { radius: 0.44, width: 4, color: 0xffddaa, alpha: 0.7 },
  { radius: 0.44, width: 3, color: 0xffcc88, alpha: 0.8 },
  { radius: 0.44, width: 2, color: 0xffaa44, alpha: 0.9 },
  { radius: 0.44, width: 1, color: 0xffffff, alpha: 0.6 },
  { radius: 0.52, width: 6, color: 0xffaa44, alpha: 0.5 },
  { radius: 0.52, width: 4, color: 0xffcc66, alpha: 0.6 },
  { radius: 0.52, width: 2, color: 0xffddaa, alpha: 0.45 },
  { radius: 0.6, width: 7, color: 0xff8833, alpha: 0.4 },
  { radius: 0.6, width: 5, color: 0xffaa44, alpha: 0.5 },
  { radius: 0.6, width: 3, color: 0xffcc66, alpha: 0.4 },
  { radius: 0.7, width: 6, color: 0xee7722, alpha: 0.3 },
  { radius: 0.7, width: 4, color: 0xff8833, alpha: 0.35 },
  { radius: 0.81, width: 4, color: 0xdd6622, alpha: 0.2 },
  { radius: 0.81, width: 2, color: 0xff8833, alpha: 0.25 },
  { radius: 0.92, width: 3, color: 0x4466bb, alpha: 0.1 },
];

const SPOT_DEFS = [
  { speed: 0.65, rFraction: 0.38, color: 0xffffff, size: 3 },
  { speed: 0.5, rFraction: 0.5, color: 0xffddaa, size: 4 },
  { speed: 0.35, rFraction: 0.56, color: 0xffcc88, size: 3 },
  { speed: 0.22, rFraction: 0.66, color: 0xffaa44, size: 3 },
  { speed: 0.14, rFraction: 0.76, color: 0xff8833, size: 2 },
];

export function drawBlackHoleEffect(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  pullRadius: number,
  time: number,
): void {
  const cx = Math.round(x);
  const cy = Math.round(y);
  const r = Math.max(8, Math.round(pullRadius * 0.4));
  const t = time * 0.001;

  // ── Event horizon (solid black center) ──
  fillCircle(g, cx, cy, Math.round(r * 0.25), 0x000000, 1);

  // ── Photon ring edge (very bright, thin ring right around event horizon) ──
  const photonR = Math.round(r * 0.32);
  const photonGlow = 0.6 + 0.25 * Math.sin(t * 0.4);
  g.lineStyle(4, 0xffffff, photonGlow * 0.3);
  g.strokeCircle(cx, cy, photonR);
  g.lineStyle(2, 0xffffff, photonGlow * 0.6);
  g.strokeCircle(cx, cy, photonR);
  g.lineStyle(1, 0xffffff, photonGlow);
  g.strokeCircle(cx, cy, photonR);

  // ── Bright accretion disk ──
  // Thick overlapping rings from hot inner to cooler outer
  for (const ring of RING_DEFS) {
    const rr = Math.round(r * ring.radius);
    g.lineStyle(ring.width, ring.color, ring.alpha);
    g.strokeCircle(cx, cy, rr);
  }

  // ── Doppler-shifted bright arcs (overlay in 4 clusters) ──
  const clusterCount = 4;
  for (let c = 0; c < clusterCount; c++) {
    const clusterAngle = (c / clusterCount) * Math.PI * 2 + t * 0.25;
    const doppler = 0.4 + 0.6 * Math.max(0, Math.cos(clusterAngle - t * 0.1));
    for (let s = 0; s < 3; s++) {
      const a = clusterAngle - 0.15 + s * 0.08;
      const len = 0.06 + s * 0.03;
      g.lineStyle(2, 0xffffff, doppler * (0.5 + s * 0.2));
      g.beginPath();
      g.arc(cx, cy, Math.round(r * 0.48), a, a + len, false);
      g.strokePath();
    }
  }

  // ── Orbiting hot spots ──
  for (const spot of SPOT_DEFS) {
    const ang = t * spot.speed;
    const sr = r * spot.rFraction;
    const sx = Math.round(cx + Math.cos(ang) * sr);
    const sy = Math.round(cy + Math.sin(ang) * sr);
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + ang);
    fillCircle(g, sx, sy, spot.size, spot.color, 0.7 + pulse * 0.3);
    fillCircle(g, sx, sy, Math.round(spot.size * 0.5), 0xffffff, 0.6);
  }

  // ── Pull radius ──
  g.lineStyle(1, 0x6688cc, 0.05);
  g.strokeCircle(cx, cy, Math.max(r, Math.round(pullRadius)));
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
