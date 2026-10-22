export interface BenchmarkResult {
  name: string;
  operations: number;
  durationMs: number;
  opsPerSec: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  heapUsedMb: number;
}

export function calculatePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1);
  return sorted[index] ?? 0;
}

export async function runBenchmark(
  name: string,
  iterations: number,
  fn: (i: number) => void | Promise<void>,
): Promise<BenchmarkResult> {
  const latenciesNs: bigint[] = new Array(iterations);
  const memBefore = process.memoryUsage().heapUsed;

  const startTotal = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    const t0 = process.hrtime.bigint();
    const res = fn(i);
    if (res instanceof Promise) {
      await res;
    }
    const t1 = process.hrtime.bigint();
    latenciesNs[i] = t1 - t0;
  }

  const endTotal = process.hrtime.bigint();
  const totalDurationNs = Number(endTotal - startTotal);
  const durationMs = totalDurationNs / 1_000_000;
  const opsPerSec = Math.round((iterations / (durationMs / 1000)) * 100) / 100;

  const latenciesMs = latenciesNs.map(ns => Number(ns) / 1_000_000).sort((a, b) => a - b);
  const memAfter = process.memoryUsage().heapUsed;
  const heapUsedMb = Math.round(((memAfter - memBefore) / (1024 * 1024)) * 100) / 100;

  const result: BenchmarkResult = {
    name,
    operations: iterations,
    durationMs: Math.round(durationMs * 100) / 100,
    opsPerSec,
    p50Ms: Math.round(calculatePercentile(latenciesMs, 50) * 1000) / 1000,
    p90Ms: Math.round(calculatePercentile(latenciesMs, 90) * 1000) / 1000,
    p95Ms: Math.round(calculatePercentile(latenciesMs, 95) * 1000) / 1000,
    p99Ms: Math.round(calculatePercentile(latenciesMs, 99) * 1000) / 1000,
    maxMs: Math.round((latenciesMs[latenciesMs.length - 1] ?? 0) * 1000) / 1000,
    heapUsedMb,
  };

  console.log(`\n=== Benchmark: ${result.name} ===`);
  console.log(`  Operations:  ${result.operations.toLocaleString()}`);
  console.log(`  Duration:    ${result.durationMs.toFixed(2)} ms`);
  console.log(`  Throughput:  ${result.opsPerSec.toLocaleString()} ops/sec`);
  console.log(`  p50 latency: ${result.p50Ms.toFixed(3)} ms`);
  console.log(`  p90 latency: ${result.p90Ms.toFixed(3)} ms`);
  console.log(`  p95 latency: ${result.p95Ms.toFixed(3)} ms`);
  console.log(`  p99 latency: ${result.p99Ms.toFixed(3)} ms`);
  console.log(`  Max latency: ${result.maxMs.toFixed(3)} ms`);
  console.log(`  Heap delta:  ${result.heapUsedMb} MB`);

  return result;
}
