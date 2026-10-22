import { Exchange } from "../src/core/Exchange";
import { MetricsCollector } from "../src/metrics/MetricsCollector";
import type { Order } from "../src/types/index";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}${pass ? "" : ` — got ${actual}, want ${expected}`}`);
}

function makeOrder(o: Partial<Order> & Pick<Order, "userId" | "orderId" | "side" | "type" | "quantity">): Order {
  return {
    market: "BTC-PERP",
    price: 0n,
    leverage: 10n,
    status: "resting",
    createdAt: new Date(),
    ...o,
  };
}

console.log("\nAudit Log & Metrics Integrity Suite");

const ex = new Exchange();
ex.createMarket("BTC-PERP");

ex.deposit("alice", 1_000_000n);
ex.deposit("bob", 1_000_000n);

ex.placeOrder(makeOrder({
  userId: "alice",
  orderId: "a_lim",
  side: "LONG",
  type: "LIMIT",
  price: 50_000n,
  quantity: 2n,
}));

ex.placeOrder(makeOrder({
  userId: "bob",
  orderId: "b_mkt",
  side: "SHORT",
  type: "MARKET",
  quantity: 2n,
}));

ex.placeOrder(makeOrder({
  userId: "alice",
  orderId: "a_cancel",
  side: "LONG",
  type: "LIMIT",
  price: 48_000n,
  quantity: 1n,
}));

ex.cancelOrder("BTC-PERP", "alice", "a_cancel");

const recordCount = ex.auditLog.getRecordCount();
check("audit log recorded all events", recordCount >= 6, true);

const initialReport = ex.auditLog.verifyIntegrity();
check("audit log cryptographic integrity valid", initialReport.valid, true);

const records = ex.auditLog.getRecords();
const first = records[0];
const second = records[1];
check("audit sequence numbers are strictly monotonic", (second?.sequenceNumber ?? 0n) > (first?.sequenceNumber ?? 0n), true);

if (records[2]) {
  const originalPayload = records[2].payload;
  records[2].payload = { ...originalPayload, hacked: true };
  const tamperedReport = ex.auditLog.verifyIntegrity();
  check("audit log detects tampering", tamperedReport.valid, false);
  check("audit log identifies corrupted sequence number", tamperedReport.corruptedAt, records[2].sequenceNumber);
  records[2].payload = originalPayload;
}

const metrics = ex.metrics.getSnapshot();
check("metrics recorded throughput", metrics.throughput.totalOperations > 0, true);
check("metrics recorded latency samples", metrics.latency.sampleCount > 0, true);

let anomalyTriggered = false;
const alertCollector = new MetricsCollector(1, 100, alert => {
  if (alert.type === "LATENCY_SPIKE") {
    anomalyTriggered = true;
  }
});
alertCollector.recordTiming(5_000_000n);
check("anomaly detector alerts on latency spike", anomalyTriggered, true);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("\nAudit Log & Metrics checks passed\n");
}
