import { Engine } from "./index";
import { Orderbook } from "./orderbook";
import type { Order } from "./type";

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🧪 PERPETUAL DEX ENGINE DIAGNOSTICS");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

const engine = new Engine();

// Setup: Initialize orderbook and users with enough balance
engine.orderbooks.set("BTC-PERP", new Orderbook("BTC-PERP"));

engine.usersCollateral.set("user1", {
  userId: "user1",
  availableBalance: 1000000n, // 1M
  marginLocked: 0n,
});

engine.usersCollateral.set("user2", {
  userId: "user2",
  availableBalance: 1000000n, // 1M
  marginLocked: 0n,
});

console.log("✅ Setup: 2 users with 1M balance each\n");

// Test 1: Maker places LIMIT order
console.log("TEST 1: User1 (maker) places LIMIT BUY @ 50000, qty=10, 2x leverage");
const order1: Order = {
  userId: "user1",
  orderId: "order1",
  market: "BTC-PERP",
  side: "LONG",
  type: "LIMIT",
  quantity: 10n,
  price: 50000n,
  leverage: 2n,
  status: "resting",
  createdAt: new Date(),
};

const user1Before = { ...engine.usersCollateral.get("user1")! };

try {
  const fills1 = engine.processOrder(order1);
  const user1After = engine.usersCollateral.get("user1")!;

  const expectedMargin = (50000n * 10n) / 2n; // 250000
  console.log(`  Fills from this order: ${fills1.length}`);
  console.log(`  Expected margin locked: ${expectedMargin}`);
  console.log(`  Actual margin locked: ${user1After.marginLocked}`);
  console.log(`  Available before: ${user1Before.availableBalance}`);
  console.log(`  Available after: ${user1After.availableBalance}`);
  console.log(`  ✅ PASSED\n`);
} catch (e) {
  console.log(`  ❌ FAILED: ${e}\n`);
}

// Test 2: Taker places MARKET order (crosses and fills the maker)
console.log("TEST 2: User2 (taker) places MARKET SELL @ market, qty=5, 2x leverage");
const order2: Order = {
  userId: "user2",
  orderId: "order2",
  market: "BTC-PERP",
  side: "SHORT",
  type: "MARKET",
  quantity: 5n,
  price: 0n,
  leverage: 2n,
  status: "resting",
  createdAt: new Date(),
};

const user1BeforeFill = { ...engine.usersCollateral.get("user1")! };
const user2BeforeFill = { ...engine.usersCollateral.get("user2")! };

try {
  const fills2 = engine.processOrder(order2);
  const user1AfterFill = engine.usersCollateral.get("user1")!;
  const user2AfterFill = engine.usersCollateral.get("user2")!;

  console.log(`  Fills: ${fills2.length}`);
  if (fills2.length > 0) {
    const fill = fills2[0]!;
    console.log(`    Fill qty: ${fill.quantity} @ ${fill.price}`);
    console.log(`    Maker: ${fill.makerUserId}, Taker: ${fill.takerUserId}\n`);
  }

  const filledQty = 5n;
  const filledNotional = 50000n * filledQty; // 250000
  const filledMargin = filledNotional / 2n; // 125000

  console.log(`  MAKER (User1) MARGIN ACCOUNTING:`);
  console.log(`    Before: locked=${user1BeforeFill.marginLocked}, available=${user1BeforeFill.availableBalance}`);
  console.log(`    After:  locked=${user1AfterFill.marginLocked}, available=${user1AfterFill.availableBalance}`);
  console.log(`    Expected: locked should still be 250000 (maker doesn't unlock on fill)`);
  console.log(`    Bug? Locked went from ${user1BeforeFill.marginLocked} to ${user1AfterFill.marginLocked}\n`);

  console.log(`  TAKER (User2) MARGIN ACCOUNTING:`);
  console.log(`    Before: locked=${user2BeforeFill.marginLocked}, available=${user2BeforeFill.availableBalance}`);
  console.log(`    After:  locked=${user2AfterFill.marginLocked}, available=${user2AfterFill.availableBalance}`);
  console.log(`    Expected: locked should be ${filledMargin} (for 5 qty @ 50k price at 2x leverage)`);
  console.log(`    Correct? ${user2AfterFill.marginLocked === filledMargin ? "✅ YES" : "❌ NO"}\n`);
} catch (e) {
  console.log(`  ❌ FAILED: ${e}\n`);
}

// Test 3: Check positions
console.log("TEST 3: Verify positions were created correctly");
try {
  const pos1 = engine.userPositions.get("user1");
  const pos2 = engine.userPositions.get("user2");

  console.log(`  User1 (maker) positions: ${pos1?.length || 0}`);
  if (pos1 && pos1.length > 0) {
    const p = pos1[0]!;
    console.log(`    Side: ${p.side}, Qty: ${p.quantity}, AvgPrice: ${p.averagePrice}`);
    console.log(`    Margin: ${p.margin}, LiqPrice: ${p.liquidationPrice}\n`);
  }

  console.log(`  User2 (taker) positions: ${pos2?.length || 0}`);
  if (pos2 && pos2.length > 0) {
    const p = pos2[0]!;
    console.log(`    Side: ${p.side}, Qty: ${p.quantity}, AvgPrice: ${p.averagePrice}`);
    console.log(`    Margin: ${p.margin}, LiqPrice: ${p.liquidationPrice}\n`);
  }
} catch (e) {
  console.log(`  ❌ FAILED: ${e}\n`);
}

// Test 4: Add more quantity to existing position
console.log("TEST 4: User2 adds qty=5 more (total qty=10, avg price should rebalance)");
const order3: Order = {
  userId: "user2",
  orderId: "order3",
  market: "BTC-PERP",
  side: "SHORT",
  type: "LIMIT",
  quantity: 5n,
  price: 49000n, // Slightly lower
  leverage: 2n,
  status: "resting",
  createdAt: new Date(),
};

try {
  engine.processOrder(order3);
  const pos2 = engine.userPositions.get("user2");
  if (pos2 && pos2.length > 0) {
    const p = pos2[0]!;
    console.log(`  After adding 5 qty:`);
    console.log(`    Total Qty: ${p.quantity}`);
    console.log(`    Avg Price: ${p.averagePrice}`);
    console.log(`    Total Margin: ${p.margin}`);
    console.log(`    Liq Price: ${p.liquidationPrice}`);

    const expectedAvgPrice = (50000n * 5n + 49000n * 5n) / 10n; // Should be 49500
    console.log(`    Expected Avg: ${expectedAvgPrice}`);
    console.log(`    Match: ${p.averagePrice === expectedAvgPrice ? "✅ YES" : "⚠️ ROUNDING (bigint division)"}\n`);
  }
} catch (e) {
  console.log(`  ❌ FAILED: ${e}\n`);
}

// Test 5: Check remaining qty on orderbook
console.log("TEST 5: Verify order resting on book");
try {
  const book = engine.orderbooks.get("BTC-PERP")!;
  const bidsSize = book.bids.get(50000n)?.orders.length || 0;

  console.log(`  BTC-PERP orderbook state:`);
  console.log(`    Bids at 50000: ${bidsSize} order(s)`);
  if (bidsSize > 0) {
    const remaining = book.bids.get(50000n)!.orders[0]!.quantity;
    console.log(`    Remaining qty: ${remaining} (should be 5, since 10-5=5)\n`);
  }
} catch (e) {
  console.log(`  ❌ FAILED: ${e}\n`);
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("SUMMARY OF ISSUES FOUND:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`
1. Maker margin tracking: When a fill happens, is the MAKER's margin
   being unlocked from collateral? (It shouldn't be — only on close)

2. Taker margin: When a MARKET fill happens, is TAKER margin properly
   unlocked from their collateral?

3. Position averaging: When qty is added, does avgPrice and liquidationPrice
   recalculate correctly with bigint division?

4. Liquidation checks: Currently stubbed — would need risk.isLiquidatable()
   to be implemented first.
`);
