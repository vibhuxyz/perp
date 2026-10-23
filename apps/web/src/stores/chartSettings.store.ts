import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface IndicatorState {
  ma7: boolean;
  ma25: boolean;
  ma99: boolean;
  ema20: boolean;
  bollinger: boolean;
  volume: boolean;
}

export interface PriceAlert {
  id: string;
  market: string;
  price: number;
  condition: 'ABOVE' | 'BELOW';
  triggered: boolean;
  createdAt: string;
}

interface ChartSettingsState {
  indicators: IndicatorState;
  alerts: PriceAlert[];
  toggleIndicator: (key: keyof IndicatorState) => void;
  addAlert: (alert: { market: string; price: number; condition: 'ABOVE' | 'BELOW' }) => PriceAlert;
  removeAlert: (id: string) => void;
  markAlertTriggered: (id: string) => void;
}

const DEFAULT_INDICATORS: IndicatorState = {
  ma7: true,
  ma25: false,
  ma99: false,
  ema20: false,
  bollinger: false,
  volume: true,
};

export const useChartSettingsStore = create<ChartSettingsState>()(
  persist(
    (set, get) => ({
      indicators: DEFAULT_INDICATORS,
      alerts: [],
      toggleIndicator: key =>
        set(state => ({
          indicators: {
            ...state.indicators,
            [key]: !state.indicators[key],
          },
        })),
      addAlert: data => {
        const newAlert: PriceAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          market: data.market,
          price: data.price,
          condition: data.condition,
          triggered: false,
          createdAt: new Date().toISOString(),
        };
        set({ alerts: [newAlert, ...get().alerts] });
        return newAlert;
      },
      removeAlert: id =>
        set(state => ({
          alerts: state.alerts.filter(a => a.id !== id),
        })),
      markAlertTriggered: id =>
        set(state => ({
          alerts: state.alerts.map(a => (a.id === id ? { ...a, triggered: true } : a)),
        })),
    }),
    {
      name: 'perp-chart-settings',
    },
  ),
);
