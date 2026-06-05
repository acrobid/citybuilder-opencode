export interface BuildingConfig {
  type: string;
  name: string;
  cost: number;
  maintenance: number;
  size: number;
  refundRatio?: number;
}

export class Building {
  type: string;
  name: string;
  cost: number;
  maintenance: number;
  size: number;
  refundRatio: number;

  constructor(config: BuildingConfig) {
    this.type = config.type;
    this.name = config.name;
    this.cost = config.cost;
    this.maintenance = config.maintenance;
    this.size = config.size;
    this.refundRatio = config.refundRatio || 0.5;
  }
}
