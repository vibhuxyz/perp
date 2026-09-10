import type { Collateral, Position, Side, Market } from "../types/index";

export class Ledger {
  public usersCollateral: Map<string, Collateral>;
  public userPositions: Map<string, Position[]>;

  constructor() {
    this.usersCollateral = new Map();
    this.userPositions = new Map();
  }

  // TODO: Lock margin when a user places an order.
  // Throws if insufficient balance.
  public lockMargin(userId: string, amount: bigint): void {
  }

  // TODO: Unlock margin if an order is cancelled or filled (and position closed).
  public unlockMargin(userId: string, amount: bigint): void {
  }

  // TODO: Update a user's position after a fill.
  // Handle average price calculation and adding/reducing size.
  // DO NOT handle orderbook logic here.
  public updatePosition(
    userId: string, 
    market: Market, 
    side: Side, 
    fillQuantity: bigint, 
    fillPrice: bigint, 
    leverage: bigint
  ): void {
  }

  // TODO: Realize PnL and free up margin when a position is reduced or closed.
  public settlePnL(userId: string, pnl: bigint, marginFreed: bigint): void {
  }
}
