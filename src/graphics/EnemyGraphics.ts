import Phaser, { Math as PhaserMath } from "phaser";
import { SPACE_COLORS } from "../config.js";
import { Enemy } from "../entities/Enemy.js";
import { fillCircle } from "./SpaceGraphics.js";

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

  // Stable seed based on coarse position so the shape doesn't flicker
  const seed = (Math.floor(cx / 6) * 73856093 + Math.floor(cy / 6) * 19349663) | 0;
  const numVerts = 10;
  const verts: PhaserMath.Vector2[] = [];

  for (let i = 0; i < numVerts; i++) {
    const angle = (i / numVerts) * Math.PI * 2;
    const jitter = 0.65 + prng(seed + i * 7 + 1) * 0.35;
    const vr = r * jitter;
    verts.push(new PhaserMath.Vector2(cx + Math.cos(angle) * vr, cy + Math.sin(angle) * vr));
  }

  // Shadow
  g.fillStyle(0x332211, 0.5);
  g.fillPoints(verts, true);

  // Body
  const bodyColor = seed & 1 ? 0x997755 : seed & 2 ? 0x886644 : 0x775533;
  g.fillStyle(bodyColor, 1);
  g.fillPoints(
    verts.map((v) => new PhaserMath.Vector2(v.x - 1, v.y - 1)),
    true,
  );

  // Outline
  g.lineStyle(1, 0x443322, 0.7);
  g.strokePoints(verts, true);

  // Craters — small dark circles at deterministic positions
  for (let i = 0; i < 4; i++) {
    const angle = prng(seed + i * 13 + 5) * Math.PI * 2;
    const dist = prng(seed + i * 17 + 9) * (r - 6) + 2;
    const cr = 1 + prng(seed + i * 19 + 3) * 3;
    const crx = cx + Math.cos(angle) * dist;
    const cry = cy + Math.sin(angle) * dist;
    fillCircle(g, Math.round(crx), Math.round(cry), Math.round(cr), 0x332211, 0.6);
    // Rim highlight
    fillCircle(
      g,
      Math.round(crx + cr * 0.4),
      Math.round(cry - cr * 0.4),
      Math.round(cr * 0.5),
      0x997744,
      0.3,
    );
  }

  // Highlight — lighter patch on upper-left (light from top-left)
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

function drawMothership(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  const cx = Math.round(enemy.worldX);
  const cy = Math.round(enemy.worldY);
  const r = enemy.radius;

  const t = Date.now();

  // Outer hull — hexagonal/saucer shape
  const hullVerts: PhaserMath.Vector2[] = [];
  const hullSegments = 8;
  for (let i = 0; i < hullSegments; i++) {
    const angle = (i / hullSegments) * Math.PI * 2;
    const squeeze = i % 2 === 0 ? 1 : 0.82;
    hullVerts.push(
      new PhaserMath.Vector2(
        cx + Math.cos(angle) * r * squeeze,
        cy + Math.sin(angle) * r * squeeze,
      ),
    );
  }
  g.fillStyle(0x661133, 1);
  g.fillPoints(hullVerts, true);
  g.lineStyle(1, 0xaa2255, 0.6);
  g.strokePoints(hullVerts, true);

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

export function drawEnemy(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  switch (enemy.type) {
    case "asteroid":
      drawAsteroid(g, enemy);
      break;
    case "scout":
      drawScout(g, enemy);
      break;
    case "mothership":
      drawMothership(g, enemy);
      break;
  }
}

export function drawEnemyBullet(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  const cx = Math.round(x);
  const cy = Math.round(y);
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
): void {
  const cx = Math.round(x);
  const cy = Math.round(y);
  fillCircle(g, cx, cy, 4, color, alpha * 0.6);
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
