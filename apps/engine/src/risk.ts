import type { Position } from "./type";
import { calculatePnL } from "./calculatePnL";
import { MAINTENANCE_MARGIN_RATIO, MMR_SCALE } from "./config";

export function positionEquity(position: Position, indexPrice: bigint): bigint {
  return position.margin + calculatePnL(position, indexPrice);
}

export function maintenanceMargin(position: Position, indexPrice: bigint): bigint {
  const notional = indexPrice * position.quantity;
  return (notional * MAINTENANCE_MARGIN_RATIO) / MMR_SCALE;
}

export function isLiquidatable(position: Position, indexPrice: bigint): boolean {
  return positionEquity(position, indexPrice) <= maintenanceMargin(position, indexPrice);
}
