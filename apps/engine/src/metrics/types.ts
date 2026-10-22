export interface LatencyMetrics {
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  avgMs: number;
  sampleCount: number;
}

export interface ThroughputMetrics {
  totalOperations: number;
  opsPerSec: number;
  elapsedSec: number;
}

export interface AnomalyAlert {
  type: "LATENCY_SPIKE" | "THROUGHPUT_DROP";
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export interface MetricsSnapshot {
  timestamp: number;
  latency: LatencyMetrics;
  throughput: ThroughputMetrics;
  recentAnomalies: AnomalyAlert[];
}
