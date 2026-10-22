import type { Order } from "../types/index";
import type { Ledger } from "../core/Ledger";
import { MAX_LEVERAGE } from "./config";

export interface RiskCheckResult {
  valid: boolean;
  reason?: string;
  requiredMargin: bigint;
}

export function validatePreTradeRisk(order: Order, ledger: Ledger): RiskCheckResult {
  if (order.quantity <= 0n) {
    return { valid: false, reason: "Quantity must be greater than zero", requiredMargin: 0n };
  }

  if (order.type === "LIMIT" && order.price <= 0n) {
    return { valid: false, reason: "Limit price must be greater than zero", requiredMargin: 0n };
  }

  if (order.leverage < 1n || order.leverage > MAX_LEVERAGE) {
    return {
      valid: false,
      reason: `Leverage must be between 1 and ${MAX_LEVERAGE.toString()}`,
      requiredMargin: 0n,
    };
  }

  const user = ledger.usersCollateral.get(order.userId);
  if (!user) {
    return { valid: false, reason: "User collateral account not found", requiredMargin: 0n };
  }

  if (order.type === "LIMIT") {
    const requiredMargin = (order.price * order.quantity) / order.leverage;
    if (user.availableBalance < requiredMargin) {
      return {
        valid: false,
        reason: `Insufficient balance: available ${user.availableBalance.toString()} < required ${requiredMargin.toString()}`,
        requiredMargin,
      };
    }
    return { valid: true, requiredMargin };
  }

  if (user.availableBalance <= 0n) {
    return {
      valid: false,
      reason: "Market order requires non-zero available balance",
      requiredMargin: 0n,
    };
  }

  return { valid: true, requiredMargin: 0n };
}
