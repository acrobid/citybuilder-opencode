import Phaser, { Math as PhaserMath } from "phaser";
import { SPACE_COLORS, PLANET_CENTER_X, PLANET_CENTER_Y, PLANET_RADIUS } from "../config.js";
import { Enemy } from "../entities/Enemy.js";
import { fillCircle } from "./SpaceGraphics.js";

const _asteroidVerts = Array.from({ length: 10 }, () => new PhaserMath.Vector2());
const _asteroidShadow = Array.from({ length: 10 }, () => new PhaserMath.Vector2());
const _hullVerts = Array.from({ length: 8 }, () => new PhaserMath.Vector2());

function drawHealthBar(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  const bw = enemy.radius * 2 + 4;
  const bh = 3;
  const bx = Math.round(enemy.worldX - bw / 2);
  const by = Math.round(enemy.worldY - enemy.radius - 10);

  g.fillStyle(0x333333, 0.8);
  g.fillRect(bx, by, bw, bh);

  const ratio = enemy.health / enemy.maxHealth;
  const fillColor = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xcccc44 : 0xcc4444;
  g.fillStyle(fillColor, 1);
  g.fillRect(bx, by, Math.round(bw * ratio), bh);
}

/** Deterministic pseudo-random from a seed, returns 0..1 */
function prng(seed: number): number {
  let h = ((seed << 13) ^ seed) & 0x7fffffff;
  h = ((h >> 17) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) & 0x7fffffff;
  return (h & 0xffff) / 0xffff;
}

function drawAsteroid(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  const cx = Math.round(enemy.worldX);
  const cy = Math.round(enemy.worldY);
  const r = enemy.radius;

  const seed = (Math.floor(cx / 6) * 73856093 + Math.floor(cy / 6) * 19349663) | 0;
  const numVerts = 10;

  for (let i = 0; i < numVerts; i++) {
    const angle = (i / numVerts) * Math.PI * 2;
    const jitter = 0.65 + prng(seed + i * 7 + 1) * 0.35;
    const vr = r * jitter;
    _asteroidVerts[i].x = cx + Math.cos(angle) * vr;
    _asteroidVerts[i].y = cy + Math.sin(angle) * vr;
    _asteroidShadow[i].x = _asteroidVerts[i].x - 1;
    _asteroidShadow[i].y = _asteroidVerts[i].y - 1;
  }

  g.fillStyle(0x332211, 0.5);
  g.fillPoints(_asteroidVerts, true);

  const bodyColor = seed & 1 ? 0x997755 : seed & 2 ? 0x886644 : 0x775533;
  g.fillStyle(bodyColor, 1);
  g.fillPoints(_asteroidShadow, true);

  g.lineStyle(1, 0x443322, 0.7);
  g.strokePoints(_asteroidVerts, true);

  for (let i = 0; i < 4; i++) {
    const angle = prng(seed + i * 13 + 5) * Math.PI * 2;
    const dist = prng(seed + i * 17 + 9) * (r - 6) + 2;
    const cr = 1 + prng(seed + i * 19 + 3) * 3;
    const crx = cx + Math.cos(angle) * dist;
    const cry = cy + Math.sin(angle) * dist;
    fillCircle(g, Math.round(crx), Math.round(cry), Math.round(cr), 0x332211, 0.6);
    fillCircle(
      g,
      Math.round(crx + cr * 0.4),
      Math.round(cry - cr * 0.4),
      Math.round(cr * 0.5),
      0x997744,
      0.3,
    );
  }

  fillCircle(
    g,
    Math.round(cx - r * 0.25),
    Math.round(cy - r * 0.25),
    Math.round(r * 0.45),
    0xaa8844,
    0.2,
  );

  drawHealthBar(g, enemy);
}

function drawScout(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  const cx = Math.round(enemy.worldX);
  const cy = Math.round(enemy.worldY);

  // Angular arrow-shaped ship pointing right (toward center-ish)
  // Nose
  g.fillStyle(0x226633, 1);
  g.fillTriangle(cx + 10, cy, cx, cy - 7, cx + 2, cy);
  g.fillTriangle(cx + 10, cy, cx, cy + 7, cx + 2, cy);

  // Fuselage
  g.fillStyle(SPACE_COLORS.SCOUT_BODY, 1);
  g.fillRect(cx - 4, cy - 4, 8, 8);

  // Cockpit
  g.fillStyle(0x88ffcc, 0.8);
  g.fillRect(cx + 2, cy - 2, 5, 4);

  // Wing top
  g.fillStyle(0x228833, 1);
  g.fillTriangle(cx - 4, cy - 4, cx - 1, cy - 4, cx - 6, cy - 10);
  // Wing bottom
  g.fillTriangle(cx - 4, cy + 4, cx - 1, cy + 4, cx - 6, cy + 10);

  // Engine glow
  g.fillStyle(0x44ff66, 0.5);
  g.fillRect(cx - 5, cy - 2, 3, 4);
  g.fillStyle(0xaaffcc, 0.8);
  g.fillRect(cx - 6, cy - 1, 2, 2);

  // Wing edge highlights
  g.fillStyle(0x55ff88, 0.4);
  g.fillRect(cx - 6, cy - 10, 2, 2);
  g.fillRect(cx - 6, cy + 8, 2, 2);

  drawHealthBar(g, enemy);
}

function drawMothership(g: Phaser.GameObjects.Graphics, enemy: Enemy, time: number): void {
  const cx = Math.round(enemy.worldX);
  const cy = Math.round(enemy.worldY);
  const r = enemy.radius;

  const t = time;

  // Outer hull — hexagonal/saucer shape
  const hullSegments = 8;
  for (let i = 0; i < hullSegments; i++) {
    const angle = (i / hullSegments) * Math.PI * 2;
    const squeeze = i % 2 === 0 ? 1 : 0.82;
    _hullVerts[i].x = cx + Math.cos(angle) * r * squeeze;
    _hullVerts[i].y = cy + Math.sin(angle) * r * squeeze;
  }
  g.fillStyle(0x661133, 1);
  g.fillPoints(_hullVerts, true);
  g.lineStyle(1, 0xaa2255, 0.6);
  g.strokePoints(_hullVerts, true);

  // Mid ring
  fillCircle(g, cx, cy, r - 6, 0x881144, 0.9);
  fillCircle(g, cx, cy, r - 10, 0xcc2255, 0.8);

  // Energy core
  const corePulse = 0.7 + 0.3 * Math.sin(t / 400);
  fillCircle(g, cx, cy, r - 16, 0xff4477, corePulse);
  fillCircle(g, cx, cy, Math.round((r - 20) * corePulse), 0xff88aa, corePulse * 0.9);

  // Spinning inner detail
  const spinAngle = t / 800;
  for (let i = 0; i < 4; i++) {
    const a = spinAngle + (i / 4) * Math.PI * 2;
    const sx = cx + Math.cos(a) * (r - 24);
    const sy = cy + Math.sin(a) * (r - 24);
    fillCircle(g, Math.round(sx), Math.round(sy), 3, 0xffaacc, 0.7);
  }

  // Hull plating lines radiating from center
  g.lineStyle(1, 0x440022, 0.4);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.lineBetween(
      Math.round(cx + Math.cos(a) * (r - 20)),
      Math.round(cy + Math.sin(a) * (r - 20)),
      Math.round(cx + Math.cos(a) * r),
      Math.round(cy + Math.sin(a) * r),
    );
  }

  // Weapon ports around the rim
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + spinAngle * 0.3;
    const px = cx + Math.cos(a) * (r - 2);
    const py = cy + Math.sin(a) * (r - 2);
    g.fillStyle(0xff2244, 0.6 + 0.4 * Math.sin(t / 300 + i));
    g.fillRect(Math.round(px) - 2, Math.round(py) - 2, 4, 4);
  }

  // Outer pulsing aura
  const auraR = r + 4 + Math.sin(t / 250) * 3;
  fillCircle(g, cx, cy, Math.round(auraR), 0xff3366, 0.08);

  drawHealthBar(g, enemy);
}

export function drawEnemy(g: Phaser.GameObjects.Graphics, enemy: Enemy, time: number): void {
  switch (enemy.type) {
    case "asteroid":
      drawAsteroid(g, enemy);
      break;
    case "scout":
      drawScout(g, enemy);
      break;
    case "mothership":
      drawMothership(g, enemy, time);
      break;
  }
}

export function drawEnemyBullet(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  vx?: number,
  vy?: number,
): void {
  const cx = Math.round(x);
  const cy = Math.round(y);

  if (vx != null && vy != null) {
    const speed = Math.sqrt(vx * vx + vy * vy) || 1;
    const nx = -vx / speed;
    const ny = -vy / speed;
    for (let t = 1; t <= 3; t++) {
      const alpha = 0.5 - t * 0.12;
      const s = 3 - t;
      const px = cx + nx * t * 3;
      const py = cy + ny * t * 3;
      g.fillStyle(0xff6644, alpha);
      g.fillRect(Math.round(px - s / 2), Math.round(py - s / 2), s, s);
    }
  }

  g.fillStyle(SPACE_COLORS.ENEMY_BULLET, 1);
  g.fillRect(cx - 2, cy - 2, 4, 4);
  g.fillStyle(0xffaa44, 0.7);
  g.fillRect(cx - 1, cy - 1, 2, 2);
}

export function drawEnemyBulletExplosion(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  alpha: number,
  color: number = SPACE_COLORS.ENEMY_BULLET,
  radius: number = 4,
): void {
  const cx = Math.round(x);
  const cy = Math.round(y);
  fillCircle(g, cx, cy, radius, color, alpha * 0.6);
  if (radius > 4) {
    fillCircle(g, cx, cy, Math.round(radius * 0.6), 0xffdd44, alpha * 0.5);
  }
}

/** Short-lived explosion effect */
export function drawExplosion(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  alpha: number,
  color: number = SPACE_COLORS.EXPLOSION,
): void {
  fillCircle(g, Math.round(x), Math.round(y), r, color, alpha);
  fillCircle(g, Math.round(x), Math.round(y), Math.round(r * 0.6), 0xffdd44, alpha * 0.7);
}

export function drawSatelliteCrash(
  g: Phaser.GameObjects.Graphics,
  crash: {
    worldX: number;
    worldY: number;
    angle: number;
    startDist: number;
    elapsed: number;
    duration: number;
  },
): void {
  const t = Math.min(crash.elapsed / crash.duration, 1);
  const startX = PLANET_CENTER_X + Math.cos(crash.angle) * crash.startDist;
  const startY = PLANET_CENTER_Y + Math.sin(crash.angle) * crash.startDist;

  // Altitude ratio (1 = orbit, 0 = surface) for atmospheric effects
  const altitude = Math.max(
    0,
    1 -
      (crash.startDist - PLANET_RADIUS > 0
        ? Math.hypot(crash.worldX - PLANET_CENTER_X, crash.worldY - PLANET_CENTER_Y) - PLANET_RADIUS
        : 0) /
        (crash.startDist - PLANET_RADIUS),
  );

  // ── Atmosphere entry glow ──
  if (altitude > 0.3) {
    const glowR = 16 + altitude * 20;
    const glowAlpha = altitude * 0.2 * (1 - t * 0.3);
    g.fillStyle(0xff4400, glowAlpha);
    g.fillCircle(Math.round(crash.worldX), Math.round(crash.worldY), Math.round(glowR));
    g.fillStyle(0xff8800, glowAlpha * 0.6);
    g.fillCircle(Math.round(crash.worldX), Math.round(crash.worldY), Math.round(glowR * 0.6));
  }

  // ── Smoke trail ──
  const numSmoke = 8;
  for (let i = 0; i < numSmoke; i++) {
    const p = i / numSmoke;
    const px = startX + (crash.worldX - startX) * p;
    const py = startY + (crash.worldY - startY) * p;
    const age = (1 - p) * t;
    if (age <= 0) continue;
    const drift = ((i * 7 + t * 50) % 12) - 6;
    const smokeAlpha = age * 0.25;
    const smokeSize = 4 + age * 8 + (1 - p) * 6;
    g.fillStyle(0x555555, smokeAlpha);
    g.fillCircle(Math.round(px + drift), Math.round(py + drift - age * 4), Math.round(smokeSize));
    g.fillStyle(0x888888, smokeAlpha * 0.5);
    g.fillCircle(
      Math.round(px + drift - 3),
      Math.round(py + drift - 2),
      Math.round(smokeSize * 0.6),
    );
  }

  // ── Fire trail ──
  const numFire = 14;
  for (let i = 0; i < numFire; i++) {
    const p = i / numFire;
    const px = startX + (crash.worldX - startX) * p;
    const py = startY + (crash.worldY - startY) * p;
    const fade = (1 - p) * (1 - t * 0.4);
    if (fade <= 0) continue;
    const flicker = Math.sin(i * 2.3 + t * 30) * 0.3 + 0.7;
    const fireAlpha = fade * 0.6 * flicker;
    const fireSize = 2 + (1 - p) * 5;
    g.fillStyle(0xff4400, fireAlpha);
    g.fillCircle(Math.round(px + ((i % 3) - 1) * 2), Math.round(py), Math.round(fireSize));
    g.fillStyle(0xff8800, fireAlpha * 0.8);
    g.fillCircle(Math.round(px + ((i % 3) - 1) * 2), Math.round(py), Math.round(fireSize * 0.6));
    g.fillStyle(0xffcc44, fireAlpha * 0.5);
    g.fillCircle(Math.round(px + ((i % 3) - 1) * 2), Math.round(py), Math.round(fireSize * 0.3));
  }

  // ── Sparks / debris ──
  for (let i = 0; i < 10; i++) {
    const p = i / 9;
    const px = startX + (crash.worldX - startX) * p;
    const py = startY + (crash.worldY - startY) * p;
    const alpha = (1 - t) * (1 - p * 0.5);
    if (alpha <= 0) continue;
    const offsetX = Math.sin(i * 5.1 + t * 20) * 8 * (1 - p + 0.2);
    const offsetY = Math.cos(i * 3.7 + t * 15) * 6 * (1 - p + 0.2);
    const size = 1 + (1 - p) * 2;
    g.fillStyle(0xff6600, alpha * 0.8);
    g.fillRect(
      Math.round(px + offsetX - size / 2),
      Math.round(py + offsetY - size / 2),
      size,
      size,
    );
    if (i % 3 === 0) {
      g.fillStyle(0xffffff, alpha * 0.5);
      g.fillRect(Math.round(px + offsetX), Math.round(py + offsetY), 1, 1);
    }
  }

  // ── Core fireball ──
  const corePulse = 0.8 + Math.sin(t * 20) * 0.2;
  const coreSize = 6 + (1 - t) * 4 * corePulse;
  const coreAlpha = 0.6 + (1 - t) * 0.4;
  g.fillStyle(0xff2200, coreAlpha * 0.6);
  g.fillCircle(Math.round(crash.worldX), Math.round(crash.worldY), Math.round(coreSize * 1.4));
  g.fillStyle(0xff8800, coreAlpha * 0.8);
  g.fillCircle(Math.round(crash.worldX), Math.round(crash.worldY), Math.round(coreSize));
  g.fillStyle(0xffcc44, coreAlpha);
  g.fillCircle(Math.round(crash.worldX), Math.round(crash.worldY), Math.round(coreSize * 0.5));
  g.fillStyle(0xffffff, coreAlpha * 0.7);
  g.fillCircle(Math.round(crash.worldX), Math.round(crash.worldY), 2);
}
