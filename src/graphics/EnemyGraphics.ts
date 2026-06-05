import * as Phaser from "phaser";
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

function drawAsteroid(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  const cx = Math.round(enemy.worldX);
  const cy = Math.round(enemy.worldY);
  const r = enemy.radius;

  fillCircle(g, cx, cy, r, SPACE_COLORS.ASTEROID, 1);

  // Craters
  fillCircle(g, cx - 3, cy - 1, 2, 0x664422, 0.6);
  fillCircle(g, cx + 2, cy + 2, 2, 0x664422, 0.5);
  fillCircle(g, cx + 1, cy - 3, 1, 0x664422, 0.5);

  // Highlight
  fillCircle(g, cx - 2, cy - 2, r - 4, 0xaa8844, 0.3);

  drawHealthBar(g, enemy);
}

function drawScout(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  const cx = Math.round(enemy.worldX);
  const cy = Math.round(enemy.worldY);

  // Body
  g.fillStyle(SPACE_COLORS.SCOUT_BODY, 1);
  g.fillRect(cx - 4, cy - 4, 8, 8);

  // Inner glow
  g.fillStyle(0x66ff99, 0.6);
  g.fillRect(cx - 2, cy - 2, 4, 4);

  // Engine trail
  g.fillStyle(0x33ff66, 0.4);
  g.fillRect(cx - 2, cy + 4, 4, 3);

  drawHealthBar(g, enemy);
}

function drawMothership(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  const cx = Math.round(enemy.worldX);
  const cy = Math.round(enemy.worldY);
  const r = enemy.radius;

  fillCircle(g, cx, cy, r, SPACE_COLORS.MOTHERSHIP_BODY, 1);
  fillCircle(g, cx, cy, r - 4, 0xcc2244, 0.7);
  fillCircle(g, cx, cy, r - 8, 0xff6688, 0.8);

  // Pulsing aura
  const pulse = r + 2 + Math.sin(Date.now() / 300) * 2;
  fillCircle(g, cx, cy, Math.round(pulse), 0xff3366, 0.12);

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
): void {
  const cx = Math.round(x);
  const cy = Math.round(y);
  fillCircle(g, cx, cy, 4, SPACE_COLORS.ENEMY_BULLET, alpha * 0.6);
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
