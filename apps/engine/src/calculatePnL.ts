import type { Position } from "./type";


export function calculatePnL(position: Position, currentMarkPrice: bigint):bigint {

  let pnl: bigint;

  if (position.side === "LONG") {
 pnl = (currentMarkPrice - position.averagePrice) * position.quantity;
  }
  else {
 pnl = (position.averagePrice - currentMarkPrice) * position.quantity
  }

  return pnl

}

