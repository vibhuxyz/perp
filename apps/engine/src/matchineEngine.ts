type OrderStatus = "resting" | "filled" | "cancelled" | "partially_filled";
type Market = string;
type Side = "LONG" | "SHORT";
type OrderType = "LIMIT" | "MARKET";

// All financial values are integer cents unless noted
export interface Collateral {
  availableBalance: number;
  marginLocked: number;
}

export interface Orders {
  userId: number;
  orderId: string;
  type: Side;
  market: Market;
  quantity: number;
  filledquantity: number;
  margin: number;
  price: number;
  status: OrderStatus;
  orderType: OrderType;
  createdAt: Date;
}

export type PriceLevel = {
  openOrders: Orders[];
};

export type Orderbook = {
  bids: Map<number, PriceLevel>;
  asks: Map<number, PriceLevel>;
  lastTradedPrice: number;
  indexPrice: number;
};

// Change to Maps.Explain to me why Map is better than Record for this specific case (hint: iteration order and deletion performance).

export interface User {
  userId: number;
  username: string;
  hashPassword: string;
  collaternal: Collateral;
  position: Map<string, Position>;
  orders: Map<number, Orders>;
}

export interface Fill {
  fillId: string;
  symbol: string;
  price: number;
  quantity: number;
  makerOrderId: string;
  makerUserId: number;
  takerOrderId: string;
  takerUserId: number;
  fee: number;
  createdAt: number;
}
export interface Position {
  isOpen: boolean;
  market: Market;
  type: Side;
  quantity: number;
  margin: number;
  liquidationPrice: number;
  averagePrice: number;
}

export type EventEngine =
  | {
      type: "ORDER_UPDATED";
      orderId: number;
      userId: number;
      asset: Market;
      status: OrderStatus;
      filledquantity: number;
      remainingquantity: number;
    }
  | {
      type: "FILL_CREATED";
      price: number;
      asset: Market;
      quantity: number;
      makerOrderId: number;
      takerOrderId: number;
      makerUserId: number;
      takerUserId: number;
    };

interface MarketConfig {
  symbol: string;
  baseAssets: string;
  quoteAsset: string;
  maxLeverage: number;
  maintenanceMarginRate: number;
  tickSize: number;
  lotSize: number;
}

interface EngineState {
  orderbooks: Map<String, Orderbook>;
  users: Map<number, User>;
  markets: Map<string, MarketConfig>;
}

const state: EngineState = {
  orderbooks: new Map(),
  users: new Map(),
  markets: new Map(),
};

export const MAX_LEVERAGE = 10;
export const MAINTEN_MARGIN_RATIO = 0.1;


function getBestPrice(side:Side , orderbook:Orderbook) {
  
}

async function match(incomingOrder: Orders, orderbook: Orderbook) {

  const oppositeBook = incomingOrder.type === "LONG" ? orderbook.asks : orderbook.bids;

  //Find the best price level from oppositeBook.

  
  
  
    

  while (incomingOrder.quantity > 0) {

    // no liquidation
    
  }

}
