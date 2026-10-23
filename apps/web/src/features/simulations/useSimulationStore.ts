import { create } from 'zustand';
import type { ScenarioDefinition, PlaybackStatus, SandboxPosition, SandboxTrade, SimulationResult } from './types';
import {
  getInterpolatedPoint,
  calculateLiquidationPrice,
  calculateUnrealizedPnL,
  evaluateScorecard,
} from './simulationEngine';

const DEFAULT_SANDBOX_BALANCE = 10000;

interface SimulationState {
  status: PlaybackStatus;
  activeScenario: ScenarioDefinition | null;
  currentTimeSec: number;
  playbackSpeed: number;
  balance: number;
  initialBalance: number;
  position: SandboxPosition | null;
  trades: SandboxTrade[];
  peakBalance: number;
  maxDrawdown: number;
  result: SimulationResult | null;
  baseTimestamp: number;
  selectScenario: (scenario: ScenarioDefinition) => void;
  play: () => void; pause: () => void; togglePlay: () => void;
  setSpeed: (speed: number) => void; seek: (timeSec: number) => void; tick: (deltaSec: number) => void;
  openPosition: (side: 'LONG' | 'SHORT', leverage: number, margin: number) => void;
  closePosition: () => void; resetSimulation: () => void; exitToCatalog: () => void;
}

function evaluatePositionTick(pos: SandboxPosition | null, price: number) {
  if (!pos) return { updatedPos: null, wasLiquidated: false };

  const pnl = calculateUnrealizedPnL(pos.side, pos.entryPrice, price, pos.quantity);
  const isLiqLong = pos.side === 'LONG' && price <= pos.liquidationPrice;
  const isLiqShort = pos.side === 'SHORT' && price >= pos.liquidationPrice;

  if (isLiqLong || isLiqShort) {
    return { updatedPos: null, wasLiquidated: true };
  }
  return { updatedPos: { ...pos, unrealizedPnL: pnl }, wasLiquidated: false };
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  status: 'catalog',
  activeScenario: null,
  currentTimeSec: 0,
  playbackSpeed: 1,
  balance: DEFAULT_SANDBOX_BALANCE,
  initialBalance: DEFAULT_SANDBOX_BALANCE,
  position: null,
  trades: [],
  peakBalance: DEFAULT_SANDBOX_BALANCE,
  maxDrawdown: 0,
  result: null,
  baseTimestamp: Math.floor(Date.now() / 1000) - 3600,

  selectScenario: scenario =>
    set({
      status: 'ready', activeScenario: scenario, currentTimeSec: 0, playbackSpeed: 1,
      balance: DEFAULT_SANDBOX_BALANCE, initialBalance: DEFAULT_SANDBOX_BALANCE,
      position: null, trades: [], peakBalance: DEFAULT_SANDBOX_BALANCE, maxDrawdown: 0,
      result: null, baseTimestamp: Math.floor(Date.now() / 1000) - scenario.durationSeconds * 10,
    }),

  play: () => set({ status: 'playing' }),
  pause: () => set({ status: 'paused' }),
  togglePlay: () => set(s => ({ status: s.status === 'playing' ? 'paused' : 'playing' })),
  setSpeed: speed => set({ playbackSpeed: speed }),
  seek: timeSec => set({ currentTimeSec: Math.max(0, timeSec) }),

  tick: deltaSec => {
    const s = get();
    if (s.status !== 'playing' || !s.activeScenario) return;

    const nextTime = s.currentTimeSec + deltaSec;
    const pt = getInterpolatedPoint(s.activeScenario.points, nextTime);
    const { updatedPos, wasLiquidated } = evaluatePositionTick(s.position, pt.price);

    const currentEquity = s.balance + (updatedPos?.unrealizedPnL ?? 0);
    const newPeak = Math.max(s.peakBalance, currentEquity);
    const dd = newPeak > 0 ? ((newPeak - currentEquity) / newPeak) * 100 : 0;
    const newMaxDd = Math.max(s.maxDrawdown, dd);

    if (wasLiquidated || nextTime >= s.activeScenario.durationSeconds) {
      const res = evaluateScorecard(
        s.activeScenario.id,
        s.activeScenario.title,
        s.initialBalance,
        currentEquity,
        newMaxDd,
        wasLiquidated,
      );
      set({
        status: 'completed',
        currentTimeSec: Math.min(nextTime, s.activeScenario.durationSeconds),
        position: null,
        balance: wasLiquidated ? 0 : s.balance,
        peakBalance: newPeak,
        maxDrawdown: newMaxDd,
        result: res,
      });
      return;
    }

    set({
      currentTimeSec: nextTime,
      position: updatedPos,
      peakBalance: newPeak,
      maxDrawdown: newMaxDd,
    });
  },

  openPosition: (side, leverage, margin) => {
    const s = get();
    if (!s.activeScenario || margin <= 0 || margin > s.balance) return;

    const pt = getInterpolatedPoint(s.activeScenario.points, s.currentTimeSec);
    const notional = margin * leverage;
    const quantity = parseFloat((notional / pt.price).toFixed(4));
    const liqPrice = calculateLiquidationPrice(side, pt.price, leverage);

    const newPos: SandboxPosition = {
      side,
      entryPrice: pt.price,
      quantity,
      leverage,
      margin,
      liquidationPrice: liqPrice,
      unrealizedPnL: 0,
    };

    const newTrade: SandboxTrade = {
      id: `trade_${Date.now()}`,
      timeSec: s.currentTimeSec,
      side,
      price: pt.price,
      quantity,
    };

    set({
      position: newPos,
      balance: s.balance - margin,
      trades: [newTrade, ...s.trades],
    });
  },

  closePosition: () => {
    const s = get();
    if (!s.position || !s.activeScenario) return;

    const pt = getInterpolatedPoint(s.activeScenario.points, s.currentTimeSec);
    const pnl = calculateUnrealizedPnL(s.position.side, s.position.entryPrice, pt.price, s.position.quantity);
    const recovered = Math.max(0, s.position.margin + pnl);

    const closeTrade: SandboxTrade = {
      id: `trade_close_${Date.now()}`,
      timeSec: s.currentTimeSec,
      side: s.position.side === 'LONG' ? 'SHORT' : 'LONG',
      price: pt.price,
      quantity: s.position.quantity,
      pnl,
    };

    set({
      position: null,
      balance: s.balance + recovered,
      trades: [closeTrade, ...s.trades],
    });
  },

  resetSimulation: () => {
    const s = get();
    if (!s.activeScenario) return;
    s.selectScenario(s.activeScenario);
  },

  exitToCatalog: () =>
    set({
      status: 'catalog',
      activeScenario: null,
      result: null,
      position: null,
      currentTimeSec: 0,
    }),
}));
