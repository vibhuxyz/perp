import type { ScenarioDefinition, PricePoint } from './types';

function findSegment(
  keyFrames: Array<[number, number]>,
  t: number,
  fallback: [number, number],
): [[number, number], [number, number]] {
  for (let i = 0; i < keyFrames.length - 1; i++) {
    const cur = keyFrames[i];
    const next = keyFrames[i + 1];
    if (cur && next && t >= cur[0] && t <= next[0]) {
      return [cur, next];
    }
  }
  return [keyFrames[0] ?? fallback, keyFrames[keyFrames.length - 1] ?? fallback];
}

function buildCurve(
  basePrice: number,
  keyFrames: Array<[number, number]>,
  totalDuration: number,
  noisePct = 0.003,
): PricePoint[] {
  const points: PricePoint[] = [];
  const fallback: [number, number] = [0, basePrice];

  for (let t = 0; t <= totalDuration; t += 2) {
    const [lower, upper] = findSegment(keyFrames, t, fallback);
    const span = upper[0] - lower[0];
    const progress = span > 0 ? (t - lower[0]) / span : 0;
    const smoothProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI);
    const interp = lower[1] + (upper[1] - lower[1]) * smoothProgress;
    const wave = Math.sin(t * 0.7) * (interp * noisePct);
    const price = Math.round((interp + wave) * 10) / 10;
    const volume = Math.round((10 + Math.abs(Math.sin(t * 1.3)) * 40) * 10) / 10;

    points.push({ timeSec: t, price, volume });
  }
  return points;
}

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'covid-crash',
    title: 'Black Thursday Flash Crash',
    subtitle: 'March 12, 2020: The largest liquidation cascade in crypto history',
    date: 'March 12, 2020',
    market: 'BTC-PERP',
    initialPrice: 7950,
    durationSeconds: 120,
    difficulty: 'Hardcore',
    description: 'Bitcoin plunged 50% in hours as global liquidity dried up and BitMEX cascading liquidations caused order books to vanish.',
    historicalContext: 'Over $1.2B in longs were liquidated in 24 hours. The BitMEX matching engine came within seconds of total deficit absorption.',
    keyChallenge: 'Avoid getting wiped out by the initial dip and manage leverage before the terminal $3,800 wick.',
    points: buildCurve(
      7950,
      [
        [0, 7950],
        [15, 7500],
        [25, 7680],
        [45, 6200],
        [65, 5400],
        [80, 5600],
        [95, 3850],
        [105, 4600],
        [120, 4820],
      ],
      120,
      0.005,
    ),
  },
  {
    id: 'ftx-collapse',
    title: 'The FTX Bank Run Collapse',
    subtitle: 'November 8, 2022: Multi-day structural insolvency panic',
    date: 'November 8, 2022',
    market: 'BTC-PERP',
    initialPrice: 20600,
    durationSeconds: 120,
    difficulty: 'Intermediate',
    description: 'Rumors of Alameda Research balance sheet insolvency sparked a bank run on FTX, triggering massive selling and negative funding.',
    historicalContext: 'The crisis culminated in Binance walking away from a buyout, freezing exchange withdrawals, and dropping BTC to cyclical lows.',
    keyChallenge: 'Recognize the bear flag breakdowns and resist the urge to knife-catch early bounces.',
    points: buildCurve(
      20600,
      [
        [0, 20600],
        [20, 19800],
        [35, 20200],
        [55, 17500],
        [75, 18200],
        [95, 15500],
        [110, 16100],
        [120, 16400],
      ],
      120,
      0.004,
    ),
  },
  {
    id: 'god-candle',
    title: 'The ETF "God Candle" Squeeze',
    subtitle: 'October 24, 2023: An 18% parabolic short squeeze',
    date: 'October 24, 2023',
    market: 'BTC-PERP',
    initialPrice: 29800,
    durationSeconds: 90,
    difficulty: 'Intermediate',
    description: 'Speculation regarding the iShares Bitcoin Trust listing triggered an explosive short squeeze piercing multi-month resistance.',
    historicalContext: 'Heavy short open interest was forcefully liquidated in sequential waves, sending BTC from $30k to $35k in minutes.',
    keyChallenge: 'Protect short positions from catastrophic liquidation or catch the momentum breakout safely.',
    points: buildCurve(
      29800,
      [
        [0, 29800],
        [15, 30200],
        [30, 31200],
        [45, 33400],
        [60, 35200],
        [75, 34400],
        [90, 34100],
      ],
      90,
      0.003,
    ),
  },
  {
    id: 'scam-wick',
    title: 'Flash Scam Wick & Hunt',
    subtitle: 'Synthetic Test: 10% wick with instant recovery',
    date: 'Synthetic Stress Test',
    market: 'BTC-PERP',
    initialPrice: 65000,
    durationSeconds: 60,
    difficulty: 'Beginner',
    description: 'A sudden liquidity vacuum triggers a -10% needle wick on local order books before market makers snap back to the index price.',
    historicalContext: 'Simulates exchange-level local book manipulation and tests whether your risk engine relies on Mark Price vs Last Trade Price.',
    keyChallenge: 'Observe how paper perpetual contracts with Mark Price protection shield accounts from local scam wicks.',
    points: buildCurve(
      65000,
      [
        [0, 65000],
        [20, 64900],
        [26, 61200],
        [30, 58500],
        [34, 63800],
        [45, 64800],
        [60, 65000],
      ],
      60,
      0.002,
    ),
  },
];
