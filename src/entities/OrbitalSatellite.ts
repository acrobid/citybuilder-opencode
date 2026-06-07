import {
  SatelliteType,
  OrbitRing,
  ORBIT_RINGS,
  SATELLITE_TYPES,
  PLANET_CENTER_X,
  PLANET_CENTER_Y,
  SHIELD_BARRIER,
} from "../config.js";

export class OrbitalSatellite {
  type: SatelliteType;
  ring: OrbitRing;
  angle: number; // radians, current angular position
  worldX: number;
  worldY: number;
  lastFireTime = 0; // scene time of last shot
  alive = true;
  health = 5;
  maxHealth = 5;
  // Ion beam state (only used for "ionBeam" type)
  ionFireTimer = 0;
  ionRechargeTimer = 0;
  // Shield barrier state (only used for "shield" type)
  barriers: number[] = [];
  barrierRegenTimer = 0;
  // Black hole state (only used for "gravity" type)
  blackholeTimer = 0;
  blackholeCooldownTimer = 0;
  blackholeWorldX = 0;
  blackholeWorldY = 0;

  get config() {
    return SATELLITE_TYPES[this.type];
  }
  get name() {
    return this.config.name;
  }
  get fireRate() {
    return this.config.fireRate;
  }
  get damage() {
    return this.config.damage;
  }
  get range() {
    return this.config.range;
  }

  get ringRadius() {
    return ORBIT_RINGS[this.ring].radius;
  }
  get orbitSpeed() {
    return ORBIT_RINGS[this.ring].speed;
  }

  constructor(type: SatelliteType, ring: OrbitRing, angle: number) {
    this.type = type;
    this.ring = ring;
    this.angle = angle;
    this.worldX = PLANET_CENTER_X + Math.cos(angle) * this.ringRadius;
    this.worldY = PLANET_CENTER_Y + Math.sin(angle) * this.ringRadius;
  }

  /** Move along orbit */
  orbit(delta: number): void {
    this.angle += this.orbitSpeed * (delta / 1000);
    // Normalize to [0, 2π)
    if (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
    if (this.angle < 0) this.angle += Math.PI * 2;
    this.worldX = PLANET_CENTER_X + Math.cos(this.angle) * this.ringRadius;
    this.worldY = PLANET_CENTER_Y + Math.sin(this.angle) * this.ringRadius;
  }

  /** Compute world position of a shield barrier segment */
  static getBarrierWorldPos(sat: OrbitalSatellite, index: number): { x: number; y: number } {
    const count = SHIELD_BARRIER.count;
    const arcRad = (SHIELD_BARRIER.arcDegrees / 180) * Math.PI;
    const angleOffset = count > 1 ? (index / (count - 1) - 0.5) * arcRad : 0;
    const barrierAngle = sat.angle + angleOffset;
    const dist = sat.ringRadius + SHIELD_BARRIER.distance;
    return {
      x: PLANET_CENTER_X + Math.cos(barrierAngle) * dist,
      y: PLANET_CENTER_Y + Math.sin(barrierAngle) * dist,
    };
  }
}
