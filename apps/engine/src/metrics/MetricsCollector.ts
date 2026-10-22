import type {
  AnomalyAlert,
  LatencyMetrics,
  MetricsSnapshot,
  ThroughputMetrics,
} from "./types";

export class MetricsCollector {
  private samplesNs: bigint[];
  private maxSamples: number;
  private totalOps: number;
  private startTimeNs: bigint;
  private p99ThresholdMs: number;
  private anomalies: AnomalyAlert[];
  private onAlert?: (alert: AnomalyAlert) => void;

  constructor(p99ThresholdMs = 10, maxSamples = 10_000, onAlert?: (alert: AnomalyAlert) => void) {
    this.samplesNs = [];
    this.maxSamples = maxSamples;
    this.totalOps = 0;
    this.startTimeNs = process.hrtime.bigint();
    this.p99ThresholdMs = p99ThresholdMs;
    this.anomalies = [];
    this.onAlert = onAlert;
  }

  public recordTiming(durationNs: bigint): void {
    this.totalOps += 1;
    if (this.samplesNs.length >= this.maxSamples) {
      this.samplesNs.shift();
    }
    this.samplesNs.push(durationNs);

    const durationMs = Number(durationNs) / 1_000_000;
    if (durationMs > this.p99ThresholdMs) {
      const alert: AnomalyAlert = {
        type: "LATENCY_SPIKE",
        message: `Latency spike detected: ${durationMs.toFixed(3)} ms exceeded threshold of ${this.p99ThresholdMs} ms`,
        value: Math.round(durationMs * 1000) / 1000,
        threshold: this.p99ThresholdMs,
        timestamp: Date.now(),
      };
      this.anomalies.push(alert);
      if (this.anomalies.length > 50) {
        this.anomalies.shift();
      }
      this.onAlert?.(alert);
    }
  }

  private calculatePercentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1);
    return sorted[idx] ?? 0;
  }

  public getLatencyMetrics(): LatencyMetrics {
    if (this.samplesNs.length === 0) {
      return { p50Ms: 0, p90Ms: 0, p95Ms: 0, p99Ms: 0, maxMs: 0, avgMs: 0, sampleCount: 0 };
    }

    const sortedMs = this.samplesNs.map(ns => Number(ns) / 1_000_000).sort((a, b) => a - b);
    const sum = sortedMs.reduce((acc, v) => acc + v, 0);

    return {
      p50Ms: Math.round(this.calculatePercentile(sortedMs, 50) * 1000) / 1000,
      p90Ms: Math.round(this.calculatePercentile(sortedMs, 90) * 1000) / 1000,
      p95Ms: Math.round(this.calculatePercentile(sortedMs, 95) * 1000) / 1000,
      p99Ms: Math.round(this.calculatePercentile(sortedMs, 99) * 1000) / 1000,
      maxMs: Math.round((sortedMs[sortedMs.length - 1] ?? 0) * 1000) / 1000,
      avgMs: Math.round((sum / sortedMs.length) * 1000) / 1000,
      sampleCount: sortedMs.length,
    };
  }

  public getThroughputMetrics(): ThroughputMetrics {
    const elapsedNs = Number(process.hrtime.bigint() - this.startTimeNs);
    const elapsedSec = Math.max(elapsedNs / 1_000_000_000, 0.0001);
    const opsPerSec = Math.round((this.totalOps / elapsedSec) * 100) / 100;

    return {
      totalOperations: this.totalOps,
      opsPerSec,
      elapsedSec: Math.round(elapsedSec * 100) / 100,
    };
  }

  public getSnapshot(): MetricsSnapshot {
    return {
      timestamp: Date.now(),
      latency: this.getLatencyMetrics(),
      throughput: this.getThroughputMetrics(),
      recentAnomalies: [...this.anomalies],
    };
  }
}
