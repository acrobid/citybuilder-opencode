import { Building } from "./Building.js";
import type { Tile } from "../entities/Tile.js";
import type { WorldMap } from "../map/WorldMap.js";

export const BUILDING_TYPES: Record<string, Building> = {
  road: new Building({
    type: "road",
    name: "Road",
    cost: 10,
    maintenance: 1,
    size: 1,
    refundRatio: 0.5,
  }),
  residential: new Building({
    type: "residential",
    name: "Residential Zone",
    cost: 50,
    maintenance: 0,
    size: 1,
    refundRatio: 0.5,
  }),
  commercial: new Building({
    type: "commercial",
    name: "Commercial Zone",
    cost: 75,
    maintenance: 0,
    size: 1,
    refundRatio: 0.5,
  }),
  industrial: new Building({
    type: "industrial",
    name: "Industrial Zone",
    cost: 100,
    maintenance: 0,
    size: 1,
    refundRatio: 0.5,
  }),
  powerplant: new Building({
    type: "powerplant",
    name: "Power Plant",
    cost: 500,
    maintenance: 25,
    size: 2,
    refundRatio: 0.5,
  }),
};

export function canPlace(
  tile: Tile | null,
  buildingType: string,
  worldMap: WorldMap,
  gameState: Window["gameState"],
): boolean {
  if (!tile) return false;
  if (tile.zone !== "empty") return false;

  const building = BUILDING_TYPES[buildingType];
  if (!building) return false;

  if (gameState.money < building.cost) return false;

  if (buildingType === "road") return true;

  if (buildingType === "powerplant") {
    return worldMap.canPlace2x2(tile);
  }

  return true;
}

export function getBuildingCost(zone: string, _level: number): number {
  const building = BUILDING_TYPES[zone];
  if (!building) return 0;
  return building.cost;
}

export function getBuildingRefund(zone: string, _level: number): number {
  const building = BUILDING_TYPES[zone];
  if (!building) return 0;
  return Math.floor(building.cost * building.refundRatio);
}
