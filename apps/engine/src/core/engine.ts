import type { Collateral, Fill, Market, Order, Position, Side } from "../types/index";
import { Orderbook } from "./orderbook";
import { calculatePnL } from "../risk/calculatePnL";
import { isLiquidatable } from "../risk/risk";

export { PriceLevel, Orderbook } from "./orderbook";

export class Engine {
  public orderbooks: Map<string, Orderbook>;
  public usersCollateral: Map<string, Collateral>;
  public userPositions: Map<string, Position[]>;

  constructor() {
    this.orderbooks = new Map();
    this.usersCollateral = new Map();
    this.userPositions = new Map();
  }

  public processOrder(order: Order) {
    const user = this.usersCollateral.get(order.userId);


    if (!user) {
      throw new Error("User not found!");
    }

    const totalCost = order.price * order.quantity;
    const initialMargin = totalCost / order.leverage;

    if (user.availableBalance < initialMargin) {
      throw new Error("Insufficient balance!");
    }

    user.availableBalance -= initialMargin;
    user.marginLocked += initialMargin;

    const book = this.orderbooks.get(order.market)!;
    const fills = book.processOrder(order);

    for (const fill of fills) {
      const fillCost = fill.price * fill.quantity;
      const initialMargin = fillCost / fill.leverage;
      user.marginLocked = user.marginLocked - initialMargin;

      const makerSide: Side = order.side === "LONG" ? "SHORT" : "LONG";


      this.updatePosition(fill.takerUserId, fill.market, order.side, fill.quantity, fill.price, fill.leverage);
      this.updatePosition(fill.makerUserId, fill.market, makerSide, fill.quantity, fill.price, fill.leverage);

    }

    return fills;
  }

  public updatePosition(userId: string, market: Market, side: Side, fillQuantity: bigint, fillPrice: bigint, leverage: bigint) {
    const positions = this.userPositions.get(userId) ?? [];
    const existing = positions.find(p => p.market === market);



    if (!existing) {

      const margin = (fillPrice * fillQuantity) / leverage;
      const liquidationPrice = side === "LONG"
        ? fillPrice - (margin / fillQuantity)
        : fillPrice + (margin / fillQuantity);

      const newPostion = {
        userId,
        market,
        side,
        quantity: fillQuantity,
        averagePrice: fillPrice,
        margin,
        liquidationPrice,
      }

      positions.push(newPostion);
      this.userPositions.set(userId, positions)
    } else {
      const newAveragePrice = (existing.quantity * existing.averagePrice + fillQuantity * fillPrice) / (existing.quantity + fillQuantity)

      existing.averagePrice = newAveragePrice;
      existing.quantity += fillQuantity
      existing.margin += (fillPrice * fillQuantity) / leverage;
      existing.liquidationPrice = existing.side === "LONG"
        ? existing.averagePrice - (existing.margin / existing.quantity)
        : existing.averagePrice + (existing.margin / existing.quantity);
    }

  }

  public liquidatePosition(position: Position, currentPrice: bigint) {
    const user = this.usersCollateral.get(position.userId)!;
// 1. Create MARKET order to close the full position
    const closingOrder: Order = {
      userId: position.userId,
      orderId: `liquidation-${Date.now()}`,
      market: position.market,
      side: position.side === "LONG" ? "SHORT" : "LONG",
      type: "MARKET",
      quantity: position.quantity,
      price: 0n,
      leverage: 1n,
      status: "resting",
      createdAt: new Date()
    };

    const book = this.orderbooks.get(position.market)!;
    const fills = book.processOrder(closingOrder);

    // 2. Settle realized PnL per fill
    let totalPnL = 0n;
    
    const pnl = calculatePnL(position, currentPrice)

    user.marginLocked -= position.margin;
    user.availableBalance += (position.margin + pnl);


    const existingPosition = this.userPositions.get(position.userId);

    const newPostion = existingPosition?.filter(a => a.market !== position.market)!;

    this.userPositions.set(position.userId, newPostion)

  }

  public liquidationChecks(market: Market, currentIndexPrice: bigint): Position[] {
    const toLiquidate: Position[] = [];

    for (const positions of this.userPositions.values()) {
      for (const position of positions) {
        if (position.market === market && isLiquidatable(position , currentIndexPrice)) {
          toLiquidate.push(position)
        }

      }
    }

    for (const position of toLiquidate) {
      this.liquidatePosition(position, currentIndexPrice);
    }

    return toLiquidate;
  }

}
