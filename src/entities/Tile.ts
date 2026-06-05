export type ZoneType =
  | "empty"
  | "road"
  | "residential"
  | "commercial"
  | "industrial"
  | "powerplant";

export class Tile {
  x: number;
  y: number;
  zone: ZoneType = "empty";
  level = 0;
  isPowered = false;
  roadConnected = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
