import { ColorType, CrosshairMode, type DeepPartial, type ChartOptions } from 'lightweight-charts';

export const CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: '#0E121B' },
    textColor: '#8492A6',
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
  },
  grid: {
    vertLines: { color: 'rgba(26, 35, 51, 0.45)', style: 1 },
    horzLines: { color: 'rgba(26, 35, 51, 0.45)', style: 1 },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: '#8492A6',
      width: 1,
      style: 3,
      labelBackgroundColor: '#182233',
    },
    horzLine: {
      color: '#8492A6',
      width: 1,
      style: 3,
      labelBackgroundColor: '#182233',
    },
  },
  rightPriceScale: {
    borderColor: '#1A2333',
    textColor: '#8492A6',
  },
  timeScale: {
    borderColor: '#1A2333',
    timeVisible: true,
    secondsVisible: false,
  },
};
