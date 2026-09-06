import type { Position } from "./type";
import { calculatePnL } from "./calculatePnL";
import { MAINTENANCE_MARGIN_RATIO, MMR_SCALE } from "./config";

/**
 * equity = the money currently backing this position.
 * It is the locked margin plus the unrealised PnL at the given price.
 * When equity hits 0 the position is bankrupt.
 */
export function positionEquity(position: Position, indexPrice: bigint): bigint {
  // TODO: position.margin + calculatePnL(position, indexPrice)

  return position.margin + calculatePnL(position , indexPrice)
}

/**
 * The minimum equity the exchange allows before it force-closes.
 * A fraction (MMR) of the position notional. Notional = indexPrice * quantity.
 */
export function maintenanceMargin(position: Position, indexPrice: bigint): bigint {
  // TODO: notional = indexPrice * position.quantity
  const notional = indexPrice * position.quantity;
  // TODO: return notional * MAINTENANCE_MARGIN_RATIO / MMR_SCALE
  return notional * MAINTENANCE_MARGIN_RATIO / MMR_SCALE
}

/**
 * true when the position must be liquidated right now at this index price.
 */
export function isLiquidatable(position: Position, indexPrice: bigint): boolean {
  // TODO: positionEquity(...) <= maintenanceMargin(...)
  
}
