import { Exchange } from "../src/core/Exchange";
import { MarketMakerBot } from "../src/bots/MarketMakerBot";
import { NoiseTraderBot } from "../src/bots/NoiseTraderBot";
import {
  calculateAccountEquity,
  calculateTotalMaintenanceMargin,
  isAccountLiquidatable,
} from "../src/risk/margin";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}${pass ? "" : ` — got ${actual}, want ${expected}`}`);
}

console.log("\nRung 5 (BEST): Autonomous Bots & Cross Margin Solvency");

const ex = new Exchange();
ex.createMarket("BTC-PERP");
ex.createMarket("ETH-PERP");

ex.deposit("mm_bot", 50_000_000n);
for (let i = 1; i <= 5; i++) {
  ex.deposit(`trader_bot_${i}`, 5_000_000n);
}

const mmBtc = new MarketMakerBot(ex, {
  userId: "mm_bot",
  market: "BTC-PERP",
  spreadBps: 10n,
  orderSize: 2n,
  levels: 5,
});

const traders: NoiseTraderBot[] = [];
for (let i = 1; i <= 5; i++) {
  traders.push(new NoiseTraderBot(ex, `trader_bot_${i}`, "BTC-PERP"));
}

let simulatedPrice = 50_000n;
for (let cycle = 1; cycle <= 50; cycle++) {
  simulatedPrice += BigInt((cycle % 5 === 0 ? -1 : 1) * 20);
  mmBtc.quote(simulatedPrice);

  for (let t = 0; t < traders.length; t++) {
    traders[t]?.step(cycle * 13 + t);
  }
}

let negativeBalances = 0;
let negativeMargins = 0;
for (const col of ex.ledger.usersCollateral.values()) {
  if (col.availableBalance < 0n) negativeBalances++;
  if (col.marginLocked < 0n) negativeMargins++;
}

check("L1: zero negative balances across 50 bot trading cycles", negativeBalances, 0);
check("L1: zero negative margins across 50 bot trading cycles", negativeMargins, 0);

const markPrices = new Map<string, bigint>([
  ["BTC-PERP", simulatedPrice],
  ["ETH-PERP", 3_000n],
]);

ex.deposit("cross_user", 2_000_000n);
ex.placeOrder({
  userId: "cross_user",
  orderId: "cross_btc",
  market: "BTC-PERP",
  side: "LONG",
  type: "MARKET",
  price: 0n,
  quantity: 1n,
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
});

const crossEquity = calculateAccountEquity(ex.ledger, "cross_user", markPrices);
const crossMM = calculateTotalMaintenanceMargin(ex.ledger, "cross_user", markPrices);
const isLiq = isAccountLiquidatable(ex.ledger, "cross_user", markPrices);

check("Cross margin: equity computed across account", crossEquity > 0n, true);
check("Cross margin: maintenance margin computed", crossMM > 0n, true);
check("Cross margin: safe account is not liquidatable", isLiq, false);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("\nAutonomous bots and cross margin checks passed\n");
}
