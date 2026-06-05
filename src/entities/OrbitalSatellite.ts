import {
  SatelliteType,
  OrbitRing,
  ORBIT_RINGS,
  SATELLITE_TYPES,
  PLANET_CENTER_X,
  PLANET_CENTER_Y,
  SYNERGY,
} from "../config.js";

export class OrbitalSatellite {
  type: SatelliteType;
  ring: OrbitRing;
  angle: number; // radians, current angular position
  lastFireTime = 0; // scene time of last shot
  alive = true;
  health = 5;
  maxHealth = 5;
  // Synergy bonuses (recalculated each frame)
  hasTwinSynergy = false;
  hasTrinitySynergy = false;
  hasCrossRingSynergy = false;

  get config() {
    return SATELLITE_TYPES[this.type];
  }
  get name() {
    return this.config.name;
  }
  get fireRate() {
    let rate = this.config.fireRate;
    if (this.hasTwinSynergy) rate *= 1 - SYNERGY.twinFireRateBonus;
    return rate;
  }
  get damage() {
    let dmg = this.config.damage;
    if (this.hasTwinSynergy) dmg *= 1 + SYNERGY.twinDamageBonus;
    if (this.hasTrinitySynergy) dmg *= 1 + SYNERGY.trinityDamageBonus;
    return Math.round(dmg);
  }
  get range() {
    let rng = this.config.range;
    if (this.hasCrossRingSynergy) rng *= 1 + SYNERGY.crossRingRangeBonus;
    return rng;
  }

  get ringRadius() {
    return ORBIT_RINGS[this.ring].radius;
  }
  get orbitSpeed() {
    return ORBIT_RINGS[this.ring].speed;
  }

  get worldX() {
    return PLANET_CENTER_X + Math.cos(this.angle) * this.ringRadius;
  }
  get worldY() {
    return PLANET_CENTER_Y + Math.sin(this.angle) * this.ringRadius;
  }

  constructor(type: SatelliteType, ring: OrbitRing, angle: number) {
    this.type = type;
    this.ring = ring;
    this.angle = angle;
  }

  /** Move along orbit */
  orbit(delta: number): void {
    this.angle += this.orbitSpeed * (delta / 1000);
    // Normalize to [0, 2π)
    if (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
    if (this.angle < 0) this.angle += Math.PI * 2;
  }

  /** Angular distance to another satellite (0 to π) */
  angularDistanceTo(other: OrbitalSatellite): number {
    let diff = Math.abs(this.angle - other.angle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    return diff;
  }
}
