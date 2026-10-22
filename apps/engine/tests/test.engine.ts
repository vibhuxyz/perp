import { Exchange } from "../src/core/Exchange";
import type { Order } from "../src/types/index";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}${pass ? "" : ` — got ${actual}, want ${expected}`}`);
}

function order(o: Partial<Order> & Pick<Order, "userId" | "orderId" | "side" | "type" | "quantity">): Order {
  return {
    market: "BTC-PERP",
    price: 0n,
    leverage: 1n,
    status: "resting",
    createdAt: new Date(),
    ...o,
  };
}

function assertNoNegativeBalances(exchange: Exchange, label: string) {
  for (const user of exchange.ledger.usersCollateral.values()) {
    check(`${label}: ${user.userId} availableBalance >= 0`, user.availableBalance >= 0n, true);
    check(`${label}: ${user.userId} marginLocked >= 0`, user.marginLocked >= 0n, true);
  }
}

console.log("\nMatching and margin");

const exchange = new Exchange();
exchange.createMarket("BTC-PERP");
exchange.deposit("alice", 1_000_000n);
exchange.deposit("bob", 1_000_000n);

exchange.placeOrder(order({
  userId: "alice", orderId: "a1", side: "LONG", type: "LIMIT",
  quantity: 10n, price: 50_000n, leverage: 2n,
}));

check("alice locks initial margin", exchange.ledger.usersCollateral.get("alice")?.marginLocked, 250_000n);
check("alice available drops", exchange.ledger.usersCollateral.get("alice")?.availableBalance, 750_000n);

const bobOrder = order({
  userId: "bob", orderId: "b1", side: "SHORT", type: "MARKET",
  quantity: 5n, leverage: 2n,
});
const fills = exchange.placeOrder(bobOrder);

check("one fill", fills.length, 1);
check("bob order filled status", bobOrder.status, "filled");
check("fill price is the maker's", fills[0]?.price, 50_000n);
check("bob locks margin from the fill", exchange.ledger.usersCollateral.get("bob")?.marginLocked, 125_000n);
check("alice holds a LONG", exchange.ledger.getPosition("alice", "BTC-PERP")?.side, "LONG");
check("bob holds a SHORT", exchange.ledger.getPosition("bob", "BTC-PERP")?.side, "SHORT");
check("alice position size", exchange.ledger.getPosition("alice", "BTC-PERP")?.quantity, 5n);
check("alice resting orders count before cancel", exchange.getRestingOrders("alice").length, 1);
check("alice resting order is partially filled", exchange.getRestingOrders("alice")[0]?.status, "partially_filled");
const cancelled = exchange.cancelOrder("BTC-PERP", "alice", "a1");
check("cancelled status", cancelled?.status, "cancelled");
check("cancelled remaining quantity", cancelled?.quantity, 5n);
check("alice margin unlocked after cancel", exchange.ledger.usersCollateral.get("alice")?.marginLocked, 125_000n);
check("alice available balance restored after cancel", exchange.ledger.usersCollateral.get("alice")?.availableBalance, 875_000n);
check("alice resting orders count after cancel", exchange.getRestingOrders("alice").length, 0);
assertNoNegativeBalances(exchange, "after match and cancel");

console.log("\nLiquidation");

const liq = new Exchange();
liq.createMarket("BTC-PERP");
liq.deposit("victim", 1_000_000n);
liq.deposit("maker", 10_000_000n);

liq.placeOrder(order({
  userId: "maker", orderId: "m1", side: "SHORT", type: "LIMIT",
  quantity: 10n, price: 50_000n, leverage: 10n,
}));
liq.placeOrder(order({
  userId: "victim", orderId: "v1", side: "LONG", type: "MARKET",
  quantity: 10n, leverage: 10n,
}));

check("victim is long", liq.ledger.getPosition("victim", "BTC-PERP")?.side, "LONG");
check("victim margin", liq.ledger.getPosition("victim", "BTC-PERP")?.margin, 50_000n);
check("safe at 50000", liq.riskManager.checkLiquidations("BTC-PERP", 50_000n).length, 0);

liq.placeOrder(order({
  userId: "maker", orderId: "m2", side: "LONG", type: "LIMIT",
  quantity: 10n, price: 44_000n, leverage: 10n,
}));

const liquidated = liq.riskManager.checkLiquidations("BTC-PERP", 44_000n);

check("liquidated one position", liquidated.length, 1);
check("victim position is gone", liq.ledger.getPosition("victim", "BTC-PERP"), undefined);
check("victim margin released", liq.ledger.usersCollateral.get("victim")?.marginLocked, 0n);
check("victim ate the loss", liq.ledger.usersCollateral.get("victim")?.availableBalance, 940_000n);
check("counterparty position updated", liq.ledger.getPosition("maker", "BTC-PERP") !== undefined, true);
assertNoNegativeBalances(liq, "after liquidation");

console.log("\nPartial Liquidation");

const partialExchange = new Exchange();
partialExchange.createMarket("BTC-PERP");
partialExchange.deposit("victim2", 1_000_000n);
partialExchange.deposit("maker2", 10_000_000n);

partialExchange.placeOrder(order({
  userId: "maker2", orderId: "pm1", side: "SHORT", type: "LIMIT",
  quantity: 10n, price: 50_000n, leverage: 10n,
}));
partialExchange.placeOrder(order({
  userId: "victim2", orderId: "pv1", side: "LONG", type: "MARKET",
  quantity: 10n, leverage: 10n,
}));

partialExchange.placeOrder(order({
  userId: "maker2", orderId: "pm2", side: "LONG", type: "LIMIT",
  quantity: 4n, price: 44_000n, leverage: 10n,
}));

const partialLiq = partialExchange.riskManager.checkLiquidations("BTC-PERP", 44_000n);
check("partial liquidation triggered", partialLiq.length, 1);
const remainingPos = partialExchange.ledger.getPosition("victim2", "BTC-PERP");
check("partial liquidation shrinks quantity", remainingPos?.quantity, 6n);
check("partial liquidation shrinks margin", remainingPos?.margin, 30_000n);
check("partial liquidation victim margin locked", partialExchange.ledger.usersCollateral.get("victim2")?.marginLocked, 30_000n);
check("partial liquidation victim ate partial loss", partialExchange.ledger.usersCollateral.get("victim2")?.availableBalance, 946_000n);
check("partial liquidation maker position exists", partialExchange.ledger.getPosition("maker2", "BTC-PERP") !== undefined, true);
assertNoNegativeBalances(partialExchange, "after partial liquidation");

partialExchange.placeOrder(order({
  userId: "maker2", orderId: "pm3", side: "LONG", type: "LIMIT",
  quantity: 6n, price: 44_000n, leverage: 10n,
}));

partialExchange.riskManager.checkLiquidations("BTC-PERP", 44_000n);
check("full close after remaining liquidity", partialExchange.ledger.getPosition("victim2", "BTC-PERP"), undefined);
check("full margin released", partialExchange.ledger.usersCollateral.get("victim2")?.marginLocked, 0n);
check("final victim available balance", partialExchange.ledger.usersCollateral.get("victim2")?.availableBalance, 940_000n);
assertNoNegativeBalances(partialExchange, "after full liquidation");

console.log(`\n${failures === 0 ? "all checks passed" : `${failures} check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);
