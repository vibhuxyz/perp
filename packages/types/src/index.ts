type OrderStatus = "resting" | "filled" | "cancelled";
type Market = string;
type Side = "LONG" | "SHORT";
type OrderType = "LIMIT"


export interface Order {
  userId: string;
  orderId: string;
  market: Market;
  side: Side;
  type: OrderType;
  quantity: string;
  price: string;
  status: OrderStatus;
  createdAt: Date;
}


export interface Fill {
  fillId: string;
  market: Market;
  price: string;
  quantity: string;
  makerOrderId: string;
  makerUserId: string;
  takerOrderId: string;
  takerUserId: string;
  fee: string;
  createdAt: Date;
}


export interface Position {
   userId: string;
  market: Market;
  side: Side;
  quantity: string;
  margin: string;
  liquidationPrice: string;
  averagePrice: string;
}

export interface Collateral {
   userId: string;
  availableBalance: string;
  marginLocked: string;
}

export type PriceLevel = {
  openOrders: Order[];
};
