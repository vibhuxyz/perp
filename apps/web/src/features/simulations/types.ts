export type ScenarioId = 'covid-crash' | 'ftx-collapse' | 'god-candle' | 'scam-wick' | 'custom';

export type PlaybackStatus = 'catalog' | 'ready' | 'playing' | 'paused' | 'completed';

export interface PricePoint {
  timeSec: number;
  price: number;
  volume: number;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  title: string;
  subtitle: string;
  date: string;
  market: string;
  initialPrice: number;
  durationSeconds: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Hardcore';
  description: string;
  historicalContext: string;
  keyChallenge: string;
  points: PricePoint[];
}

export interface SandboxPosition {
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  unrealizedPnL: number;
}

export interface SandboxTrade {
  id: string;
  timeSec: number;
  side: 'LONG' | 'SHORT';
  price: number;
  quantity: number;
  pnl?: number;
}

export interface SimulationResult {
  scenarioId: ScenarioId;
  scenarioTitle: string;
  survived: boolean;
  liquidated: boolean;
  initialBalance: number;
  finalBalance: number;
  netPnL: number;
  roiPct: number;
  maxDrawdownPct: number;
  closestMarginRatioPct: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'F';
  feedback: string;
}
