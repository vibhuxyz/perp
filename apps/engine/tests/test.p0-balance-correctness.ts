import assert from "node:assert";
import { Exchange } from "../src/core/Exchange";
import {
  transitionOrderState,
  canTransitionOrder,
  isTerminalOrderState,
} from "../src/core/order-state";
import { validatePreTradeRisk } from "../src/risk/pre-trade";
import type { Order } from "../src/types/index";

function pass(name: string): void {
  console.log(`  PASS  ${name}`);
}

console.log("\nP0 Risk & Balance Correctness Suite");

assert.strictEqual(canTransitionOrder("NEW", "RESTING"), true);
assert.strictEqual(canTransitionOrder("RESTING", "PARTIALLY_FILLED"), true);
assert.strictEqual(canTransitionOrder("PARTIALLY_FILLED", "FILLED"), true);
assert.strictEqual(canTransitionOrder("NEW", "REJECTED"), true);
assert.strictEqual(canTransitionOrder("RESTING", "CANCELLED"), true);
pass("Valid order lifecycle transitions allowed");

assert.strictEqual(canTransitionOrder("FILLED", "RESTING"), false);
assert.strictEqual(canTransitionOrder("CANCELLED", "RESTING"), false);
assert.strictEqual(canTransitionOrder("REJECTED", "NEW"), false);
assert.strictEqual(isTerminalOrderState("FILLED"), true);
assert.strictEqual(isTerminalOrderState("CANCELLED"), true);
assert.strictEqual(isTerminalOrderState("REJECTED"), true);
assert.strictEqual(isTerminalOrderState("RESTING"), false);

assert.throws(() => {
  transitionOrderState("FILLED", "CANCELLED");
}, /Illegal order state transition/);
pass("Terminal order states cannot be mutated (fail-closed)");

const exchange = new Exchange();
exchange.createMarket("BTC-PERP");
exchange.deposit("trader_solvency", 10_000n);

const invalidQtyOrder: Order = {
  orderId: "ord-fail-qty",
  userId: "trader_solvency",
  market: "BTC-PERP",
  side: "LONG",
  type: "LIMIT",
  price: 50_000n,
  quantity: 0n,
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
};

const resZeroQty = validatePreTradeRisk(invalidQtyOrder, exchange.ledger);
assert.strictEqual(resZeroQty.valid, false);
assert.strictEqual(resZeroQty.reason, "Quantity must be greater than zero");
pass("Pre-trade check: zero quantity rejected");

const excessiveLevOrder: Order = {
  orderId: "ord-fail-lev",
  userId: "trader_solvency",
  market: "BTC-PERP",
  side: "LONG",
  type: "LIMIT",
  price: 50_000n,
  quantity: 1n,
  leverage: 100n,
  status: "resting",
  createdAt: new Date(),
};

const resLev = validatePreTradeRisk(excessiveLevOrder, exchange.ledger);
assert.strictEqual(resLev.valid, false);
assert.strictEqual(resLev.reason, "Leverage must be between 1 and 50");
pass("Pre-trade check: excessive leverage rejected");

const ghostUserOrder: Order = {
  orderId: "ord-fail-ghost",
  userId: "non_existent_trader",
  market: "BTC-PERP",
  side: "LONG",
  type: "LIMIT",
  price: 50_000n,
  quantity: 1n,
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
};

const resGhost = validatePreTradeRisk(ghostUserOrder, exchange.ledger);
assert.strictEqual(resGhost.valid, false);
assert.strictEqual(resGhost.reason, "User collateral account not found");
pass("Pre-trade check: non-existent account rejected without creating state");

const insufficientMarginOrder: Order = {
  orderId: "ord-fail-margin",
  userId: "trader_solvency",
  market: "BTC-PERP",
  side: "LONG",
  type: "LIMIT",
  price: 50_000n,
  quantity: 5n,
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
};

const resMargin = validatePreTradeRisk(insufficientMarginOrder, exchange.ledger);
assert.strictEqual(resMargin.valid, false);
assert.strictEqual(resMargin.requiredMargin, 25_000n);

const fills = exchange.placeOrder(insufficientMarginOrder);
assert.strictEqual(fills.length, 0);
assert.strictEqual(insufficientMarginOrder.status, "rejected");

const userCol = exchange.ledger.usersCollateral.get("trader_solvency");
assert(userCol !== undefined);
assert.strictEqual(userCol.availableBalance, 10_000n);
assert.strictEqual(userCol.marginLocked, 0n);
pass("Pre-trade check: insufficient balance fails closed, locking 0 margin");

const validOrder: Order = {
  orderId: "ord-valid-limit",
  userId: "trader_solvency",
  market: "BTC-PERP",
  side: "LONG",
  type: "LIMIT",
  price: 50_000n,
  quantity: 1n,
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
};

const validFills = exchange.placeOrder(validOrder);
assert.strictEqual(validFills.length, 0);
assert.strictEqual(validOrder.status, "resting");
assert.strictEqual(userCol.availableBalance, 5_000n);
assert.strictEqual(userCol.marginLocked, 5_000n);
pass("Valid order transitions cleanly and locks exact initial margin");

console.log("\nRisk and balance correctness suite passed\n");
