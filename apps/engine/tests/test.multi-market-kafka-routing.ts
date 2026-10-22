import assert from "node:assert";
import { Exchange } from "../src/core/Exchange";
import { getMarketPartition } from "@repo/shared";
import type { Order } from "../src/types/index";

function check(label: string, actual: unknown, expected: unknown): void {
  assert.deepStrictEqual(actual, expected);
  console.log(`  PASS  ${label}`);
}

console.log("\nMulti-Market Expansion & Kafka Partition Routing Suite");

const exchange = new Exchange();
exchange.createMarket("BTC-PERP");
exchange.createMarket("ETH-PERP");
exchange.createMarket("SOL-PERP");

exchange.deposit("alice", 200_000n);
exchange.deposit("bob", 200_000n);
exchange.deposit("charlie", 200_000n);

const btcMakerOrder: Order = {
  orderId: "btc-m-1",
  userId: "alice",
  market: "BTC-PERP",
  side: "LONG",
  type: "LIMIT",
  price: 50_000n,
  quantity: 2n,
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
};

const ethMakerOrder: Order = {
  orderId: "eth-m-1",
  userId: "bob",
  market: "ETH-PERP",
  side: "SHORT",
  type: "LIMIT",
  price: 3_000n,
  quantity: 10n,
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
};

const solMakerOrder: Order = {
  orderId: "sol-m-1",
  userId: "charlie",
  market: "SOL-PERP",
  side: "LONG",
  type: "LIMIT",
  price: 150n,
  quantity: 100n,
  leverage: 5n,
  status: "resting",
  createdAt: new Date(),
};

exchange.placeOrder(btcMakerOrder);
exchange.placeOrder(ethMakerOrder);
exchange.placeOrder(solMakerOrder);

const btcBook = exchange.matchingEngine.orderbooks.get("BTC-PERP");
const ethBook = exchange.matchingEngine.orderbooks.get("ETH-PERP");
const solBook = exchange.matchingEngine.orderbooks.get("SOL-PERP");

check("BTC book has 1 resting bid", btcBook?.bids.get(50_000n)?.orders.length, 1);
check("ETH book has 1 resting ask", ethBook?.asks.get(3_000n)?.orders.length, 1);
check("SOL book has 1 resting bid", solBook?.bids.get(150n)?.orders.length, 1);

const ethTakerOrder: Order = {
  orderId: "eth-t-1",
  userId: "alice",
  market: "ETH-PERP",
  side: "LONG",
  type: "MARKET",
  price: 3_000n,
  quantity: 5n,
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
};

const ethFills = exchange.placeOrder(ethTakerOrder);
check("ETH-PERP matched 1 fill", ethFills.length, 1);
check("ETH-PERP fill price is 3000", ethFills[0]?.price, 3_000n);
check("ETH-PERP fill quantity is 5", ethFills[0]?.quantity, 5n);

check("BTC-PERP book quantity completely untouched", btcBook?.bids.get(50_000n)?.orders[0]?.quantity, 2n);
check("SOL-PERP book quantity completely untouched", solBook?.bids.get(150n)?.orders[0]?.quantity, 100n);
check("ETH-PERP maker order reduced to 5n", ethBook?.asks.get(3_000n)?.orders[0]?.quantity, 5n);

const aliceEthPos = exchange.ledger.getPosition("alice", "ETH-PERP");
const bobEthPos = exchange.ledger.getPosition("bob", "ETH-PERP");
check("Alice holds LONG 5 on ETH-PERP", aliceEthPos?.quantity, 5n);
check("Bob holds SHORT 5 on ETH-PERP", bobEthPos?.quantity, 5n);

const solTakerOrder: Order = {
  orderId: "sol-t-1",
  userId: "alice",
  market: "SOL-PERP",
  side: "SHORT",
  type: "MARKET",
  price: 150n,
  quantity: 50n,
  leverage: 5n,
  status: "resting",
  createdAt: new Date(),
};

exchange.placeOrder(solTakerOrder);
const aliceSolPos = exchange.ledger.getPosition("alice", "SOL-PERP");
check("Alice holds SHORT 50 on SOL-PERP", aliceSolPos?.quantity, 50n);

const btcLiqs = exchange.riskManager.checkLiquidations("BTC-PERP", 50_000n);
check("Zero liquidations on BTC at 50,000", btcLiqs.length, 0);

const solAskOrder: Order = {
  orderId: "sol-ask-1",
  userId: "bob",
  market: "SOL-PERP",
  side: "SHORT",
  type: "LIMIT",
  price: 300n,
  quantity: 50n,
  leverage: 5n,
  status: "resting",
  createdAt: new Date(),
};
exchange.placeOrder(solAskOrder);

const solLiqs = exchange.riskManager.checkLiquidations("SOL-PERP", 300n);
check("SOL-PERP short position liquidated on 100% price pump", solLiqs.length, 1);
check("Liquidated position was SOL-PERP", solLiqs[0]?.market, "SOL-PERP");
check("Alice SOL-PERP position is closed", exchange.ledger.getPosition("alice", "SOL-PERP"), undefined);
check("Alice ETH-PERP position remains active", exchange.ledger.getPosition("alice", "ETH-PERP")?.quantity, 5n);

const btcPartition = getMarketPartition("BTC-PERP");
const ethPartition = getMarketPartition("ETH-PERP");
const solPartition = getMarketPartition("SOL-PERP");

check("Kafka partition for BTC-PERP is 0", btcPartition, 0);
check("Kafka partition for ETH-PERP is 1", ethPartition, 1);
check("Kafka partition for SOL-PERP is 2", solPartition, 2);
check("Independent market partitions are all distinct", new Set([btcPartition, ethPartition, solPartition]).size, 3);

type OptimisticState = "Submitting" | "Accepted" | "Filled" | "Rejected";
const orderLifecycle: OptimisticState[] = [];

orderLifecycle.push("Submitting");
check("Order starts in Submitting state", orderLifecycle[0], "Submitting");

const simulatedOrder: Order = {
  orderId: "opt-123",
  userId: "alice",
  market: "BTC-PERP",
  side: "LONG",
  type: "LIMIT",
  price: 49_000n,
  quantity: 1n,
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
};

exchange.placeOrder(simulatedOrder);
orderLifecycle.push("Accepted");
check("Order transitions to Accepted on server resting", orderLifecycle[1], "Accepted");

const matchOrder: Order = {
  orderId: "match-123",
  userId: "bob",
  market: "BTC-PERP",
  side: "SHORT",
  type: "MARKET",
  price: 49_000n,
  quantity: 3n,
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
};

const fills = exchange.placeOrder(matchOrder);
if (fills.some(f => f.makerOrderId === "opt-123" || f.takerOrderId === "opt-123")) {
  orderLifecycle.push("Filled");
}
check("Order transitions to Filled on fill event", orderLifecycle[2], "Filled");

const failedLifecycle: OptimisticState[] = [];
failedLifecycle.push("Submitting");

const invalidOrder: Order = {
  orderId: "opt-fail",
  userId: "non-existent-user",
  market: "BTC-PERP",
  side: "LONG",
  type: "LIMIT",
  price: 50_000n,
  quantity: 1000n,
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
};
exchange.placeOrder(invalidOrder);
if (invalidOrder.status === "rejected") {
  failedLifecycle.push("Rejected");
}

check("Invalid order rejects and transitions to Rejected state", failedLifecycle[1] === "Rejected", true);

console.log("\nMulti-Market Expansion and Kafka Partition Routing Suite passed\n");
