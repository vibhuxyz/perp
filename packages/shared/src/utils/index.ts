import type { PriceLevel } from "../type";

const PRICE_MULT = 100;
const QTY_MULT = 1000;

export function toIntPrice(p: number): number {
  return Math.round(p * PRICE_MULT);
}

export function toIntQty(q: number): number {
  return Math.round(q * QTY_MULT);
}

export function toFloatPrice(p: number): number {
  return p / PRICE_MULT;
}

export function getLevelAvailableQty(level: PriceLevel): number {
  return level.openOrders.reduce(
    (sum, order) => sum + (order.quantity - order.filledquantity),
    0,
  );
}
