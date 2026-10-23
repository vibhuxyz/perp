import {
  ColorType,
  CrosshairMode,
  type DeepPartial,
  type ChartOptions,
  type CandlestickSeriesPartialOptions,
  type LineSeriesPartialOptions,
  type HistogramSeriesPartialOptions,
} from 'lightweight-charts';

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
    vertLine: { color: '#8492A6', width: 1, style: 3, labelBackgroundColor: '#182233' },
    horzLine: { color: '#8492A6', width: 1, style: 3, labelBackgroundColor: '#182233' },
  },
  rightPriceScale: { borderColor: '#1A2333', textColor: '#8492A6' },
  timeScale: { borderColor: '#1A2333', timeVisible: true, secondsVisible: false },
};

export const CANDLE_OPTIONS: CandlestickSeriesPartialOptions = {
  upColor: '#00F29D',
  downColor: '#FF4D5A',
  borderVisible: false,
  wickUpColor: '#00F29D',
  wickDownColor: '#FF4D5A',
  priceLineVisible: true,
  lastValueVisible: true,
};

export const LINE_OPTIONS: LineSeriesPartialOptions = {
  color: '#00F29D',
  lineWidth: 2,
  crosshairMarkerVisible: true,
  priceLineVisible: true,
  lastValueVisible: true,
};

export const VOLUME_OPTIONS: HistogramSeriesPartialOptions = {
  priceFormat: { type: 'volume' },
  priceScaleId: '',
};
