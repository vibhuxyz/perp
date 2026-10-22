import Decimal from "decimal.js";

import type { OrderSide } from "@/stores/ui.store";


export function notional(price: Decimal.Value, quantity: Decimal.Value): Decimal {
  return new Decimal(price).times(quantity);
}

export function initialMargin(
  price: Decimal.Value,
  quantity: Decimal.Value,
  leverage: Decimal.Value,
): Decimal {
  return notional(price, quantity).div(leverage);
}

export function unrealisedPnl(
  side: OrderSide,
  averagePrice: Decimal.Value,
  markPrice: Decimal.Value,
  quantity: Decimal.Value,
): Decimal {
  const move = side === "LONG"
    ? new Decimal(markPrice).minus(averagePrice)
    : new Decimal(averagePrice).minus(markPrice);

  return move.times(quantity);
}


export function liquidationPrice(
  side: OrderSide,
  averagePrice: Decimal.Value,
  margin: Decimal.Value,
  quantity: Decimal.Value,
): Decimal {
  const buffer = new Decimal(margin).div(quantity);

  return side === "LONG"
    ? new Decimal(averagePrice).minus(buffer)
    : new Decimal(averagePrice).plus(buffer);
}
