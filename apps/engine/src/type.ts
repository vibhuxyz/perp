
export type OrderStatus = "resting" | "filled" | "cancelled";
export type Market = string;
export type Side = "LONG" | "SHORT";
export type OrderType = "LIMIT" | "MARKET"

export interface Order {
  userId: string;
  orderId: string;
  market: Market;
  side: Side;
  type: OrderType;
  quantity: bigint;
  price: bigint;
  leverage: bigint;
  status: OrderStatus;
  createdAt: Date;
}

export interface Fill {
  fillId: string;
  market: string;
  price: bigint;
  quantity: bigint;
  makerOrderId: string;
  makerUserId: string;
  takerOrderId: string;
  takerUserId: string;
  leverage: bigint;
  fee: number;
  createdAt: Date;
}

export interface Position {
  userId: string;
  market: Market;
  side: Side;
  quantity: bigint;
  margin: bigint;
  liquidationPrice: bigint;
  averagePrice: bigint;
}

export interface Collateral {
  userId: string;
  availableBalance: bigint;
  marginLocked: bigint;
}
