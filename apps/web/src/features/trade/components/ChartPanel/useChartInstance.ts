import { useEffect, useRef, useState, type RefObject } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { Trade } from '@/stores/market.store';
import {
  TIMEFRAME_SECONDS,
  formatChartTimestamp,
  generateInitialCandles,
  type HoverData,
  type CandlestickData,
  type VolumeData,
} from '../chartData';
import { CHART_OPTIONS } from './chartOptions';
import { hasCrosshairPoint, extractOhlc } from './chartCrosshair';

export function useChartInstance({
  chartContainerRef,
  chartType,
  activeTimeframe,
  effectivePrice,
  lastTradePrice,
  indexPrice,
  trades,
}: {
  chartContainerRef: RefObject<HTMLDivElement | null>;
  chartType: 'candles' | 'line';
  activeTimeframe: string;
  effectivePrice: number;
  lastTradePrice: string | null;
  indexPrice: string | null;
  trades: Trade[];
}) {
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);
  const lastVolumeRef = useRef<VolumeData | null>(null);

  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const [latestCandle, setLatestCandle] = useState<CandlestickData | null>(null);

  // Main Chart Initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;

    const chart = createChart(container, CHART_OPTIONS);

    chartRef.current = chart;

    // Generate initial history anchored to real effective market price
    const interval = TIMEFRAME_SECONDS[activeTimeframe] || 3600;
    const { candles, volumes } = generateInitialCandles(effectivePrice, 60, interval);

    lastCandleRef.current = candles[candles.length - 1] ?? null;
    lastVolumeRef.current = volumes[volumes.length - 1] ?? null;
    setLatestCandle(candles[candles.length - 1] ?? null);

    // Candlestick / Line Series
    let candleSeries: ISeriesApi<'Candlestick'> | null = null;
    let lineSeries: ISeriesApi<'Line'> | null = null;

    if (chartType === 'candles') {
      candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00F29D',
        downColor: '#FF4D5A',
        borderVisible: false,
        wickUpColor: '#00F29D',
        wickDownColor: '#FF4D5A',
        priceLineVisible: true,
        lastValueVisible: true,
      });
      candleSeries.setData(candles);
      candleSeriesRef.current = candleSeries;
    } else {
      lineSeries = chart.addSeries(LineSeries, {
        color: '#00F29D',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      lineSeries.setData(candles.map(c => ({ time: c.time, value: c.close })));
      lineSeriesRef.current = lineSeries;
    }

    // Volume Histogram Series (bottom 20%)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay in main pane
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeries.setData(volumes);
    volumeSeriesRef.current = volumeSeries;

    chart.timeScale().fitContent();

    // Crosshair Hover Tooltip Listener
    chart.subscribeCrosshairMove(param => {
      if (!hasCrosshairPoint(param)) {
        setHoverData(null);
        return;
      }

      const ohlc = extractOhlc(param, candleSeries, lineSeries);
      if (!ohlc) {
        setHoverData(null);
        return;
      }

      const { open, high, low, close } = ohlc;
      const vData = param.seriesData.get(volumeSeries) as VolumeData | undefined;
      const change = close - open;
      const changePct = open > 0 ? (change / open) * 100 : 0;

      const containerWidth = container.clientWidth || 700;
      const containerHeight = container.clientHeight || 400;

      setHoverData({
        time: formatChartTimestamp(param.time as number),
        open,
        high,
        low,
        close,
        volume: vData?.value ?? 0,
        change,
        changePct,
        isUp: close >= open,
        x: Math.min(param.point.x + 16, containerWidth - 225),
        y: Math.min(Math.max(param.point.y - 45, 12), containerHeight - 170),
      });
    });

    // Resize handling
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          chart.resize(entry.contentRect.width, entry.contentRect.height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [activeTimeframe, chartType, effectivePrice, chartContainerRef]);

  // Real-time updates when live trade prices or index ticks arrive
  useEffect(() => {
    const livePrice = parseFloat(lastTradePrice ?? indexPrice ?? '0');
    if (livePrice <= 0 || !lastCandleRef.current) return;

    // Update active candle
    const updatedCandle: CandlestickData = {
      ...lastCandleRef.current,
      high: Math.max(lastCandleRef.current.high, livePrice),
      low: Math.min(lastCandleRef.current.low, livePrice),
      close: livePrice,
    };
    lastCandleRef.current = updatedCandle;
    setLatestCandle(updatedCandle);

    if (candleSeriesRef.current) {
      candleSeriesRef.current.update(updatedCandle);
    }
    if (lineSeriesRef.current) {
      lineSeriesRef.current.update({
        time: updatedCandle.time,
        value: updatedCandle.close,
      });
    }
  }, [lastTradePrice, indexPrice]);

  // Update volume on new trades
  useEffect(() => {
    if (!volumeSeriesRef.current || !lastVolumeRef.current || trades.length === 0) return;
    const topTrade = trades[0];
    if (!topTrade) return;

    const tradeSize = parseFloat(topTrade.size) || 0.1;
    const updatedVolume: VolumeData = {
      ...lastVolumeRef.current,
      value: parseFloat((lastVolumeRef.current.value + tradeSize).toFixed(2)),
    };
    lastVolumeRef.current = updatedVolume;
    volumeSeriesRef.current.update(updatedVolume);
  }, [trades]);

  return { hoverData, setHoverData, latestCandle };
}
