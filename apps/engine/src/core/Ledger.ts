import type { Collateral, Position, Side, Market } from "../types/index";

export class Ledger {
  public usersCollateral: Map<string, Collateral>;
  public userPositions: Map<string, Position[]>;

  constructor() {
    this.usersCollateral = new Map();
    this.userPositions = new Map();
  }

  public lockMargin(userId: string, amount: bigint): void {
    const user = this.usersCollateral.get(userId);

    if (!user) {
      throw new Error("User not found!");
    }

    if (user.availableBalance < amount) {
      throw new Error("Insufficient balance!");
    }

    user.availableBalance -= amount;
    user.marginLocked += amount;
  }

  public unlockMargin(userId: string, amount: bigint): void {
    const user = this.usersCollateral.get(userId);

    if (!user) {
      throw new Error("User not found!");
    }

    if (amount > user.marginLocked) {
      throw new Error("Unlocking more margin than is locked!");
    }

    user.marginLocked -= amount;
    user.availableBalance += amount;
  }

  public updatePosition(
    userId: string,
    market: Market,
    side: Side,
    fillQuantity: bigint,
    fillPrice: bigint,
    leverage: bigint,
  ): void {
    const positions = this.userPositions.get(userId) ?? [];
    const existing = positions.find(p => p.market === market);
    const margin = (fillPrice * fillQuantity) / leverage;

    if (!existing) {
      positions.push({
        userId,
        market,
        side,
        quantity: fillQuantity,
        averagePrice: fillPrice,
        margin,
        liquidationPrice: side === "LONG"
          ? fillPrice - (margin / fillQuantity)
          : fillPrice + (margin / fillQuantity),
      });

      this.userPositions.set(userId, positions);
      return;
    }

    existing.averagePrice =
      (existing.quantity * existing.averagePrice + fillQuantity * fillPrice) /
      (existing.quantity + fillQuantity);
    existing.quantity += fillQuantity;
    existing.margin += margin;
    existing.liquidationPrice = existing.side === "LONG"
      ? existing.averagePrice - (existing.margin / existing.quantity)
      : existing.averagePrice + (existing.margin / existing.quantity);
  }

  public getPosition(userId: string, market: Market): Position | undefined {
    return this.userPositions.get(userId)?.find(p => p.market === market);
  }

  public settlePnL(userId: string, pnl: bigint, marginFreed: bigint): void {
    const user = this.usersCollateral.get(userId);

    if (!user) {
      throw new Error("User not found!");
    }

    user.marginLocked -= marginFreed;
    user.availableBalance += marginFreed + pnl;
  }

  public closePosition(userId: string, market: Market): void {
    const positions = this.userPositions.get(userId);

    if (!positions) {
      return;
    }

    this.userPositions.set(userId, positions.filter(p => p.market !== market));
  }
}
