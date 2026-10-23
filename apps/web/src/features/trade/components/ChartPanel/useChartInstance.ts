import { useEffect, useRef, useState, useMemo, type RefObject } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  PriceScaleMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Trade } from '@/stores/market.store';
import type { CandleItem } from '@/features/trade/api/tradeApi';
import { useChartSettingsStore } from '@/stores/chartSettings.store';
import type { ScaleMode } from './BottomRangeBar';
import { resolveCandleData, type HoverData, type CandlestickData, type VolumeData } from '../chartData';
import { CHART_OPTIONS, CANDLE_OPTIONS, LINE_OPTIONS, VOLUME_OPTIONS } from './chartOptions';
import { hasCrosshairPoint, extractOhlc, buildHoverData } from './chartCrosshair';
import { useChartIndicators } from './useChartIndicators';
import { useChartAlerts } from './useChartAlerts';

interface UseChartProps {
  chartContainerRef: RefObject<HTMLDivElement | null>;
  chartType: 'candles' | 'line';
  activeTimeframe: string;
  activeRange?: string;
  scaleMode?: ScaleMode;
  market: string;
  effectivePrice: number;
  lastTradePrice: string | null;
  indexPrice: string | null;
  trades: Trade[];
  realCandles?: CandleItem[];
}

const checkNeedsRefit = (f: boolean, pTf: string, tf: string, pR?: string, r?: string) =>
  !f || pTf !== tf || pR !== r;

export function useChartInstance({
  chartContainerRef, chartType, activeTimeframe, activeRange, scaleMode,
  market, effectivePrice, lastTradePrice, indexPrice, trades, realCandles,
}: UseChartProps) {
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);
  const lastVolumeRef = useRef<VolumeData | null>(null);
  const hasFittedRef = useRef(false);
  const lastTimeframeRef = useRef(activeTimeframe);
  const lastRangeRef = useRef(activeRange);
  const effectivePriceRef = useRef(effectivePrice);
  const [currentCandles, setCurrentCandles] = useState<CandlestickData[]>([]);

  useEffect(() => {
    effectivePriceRef.current = effectivePrice;
  }, [effectivePrice]);

  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const indicators = useChartSettingsStore(s => s.indicators);

  const livePrice = parseFloat(lastTradePrice ?? indexPrice ?? '0');
  const baseCandle = realCandles && realCandles.length > 0 ? realCandles[realCandles.length - 1] : null;

  const latestCandle: CandlestickData | null = useMemo(() => {
    if (!baseCandle) return null;
    const isPlausible = livePrice > 0 && Math.abs(livePrice - baseCandle.close) / baseCandle.close < 0.2;
    const validLive = isPlausible ? livePrice : baseCandle.close;
    return {
      time: baseCandle.time as UTCTimestamp,
      open: baseCandle.open,
      high: Math.max(baseCandle.high, validLive),
      low: Math.min(baseCandle.low, validLive),
      close: validLive,
    };
  }, [baseCandle, livePrice]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    const chart = createChart(container, CHART_OPTIONS);
    chartRef.current = chart;

    let candleSeries: ISeriesApi<'Candlestick'> | null = null;
    let lineSeries: ISeriesApi<'Line'> | null = null;

    if (chartType === 'candles') {
      candleSeries = chart.addSeries(CandlestickSeries, CANDLE_OPTIONS);
      candleSeriesRef.current = candleSeries;
    } else {
      lineSeries = chart.addSeries(LineSeries, LINE_OPTIONS);
      lineSeriesRef.current = lineSeries;
    }

    const volumeSeries = chart.addSeries(HistogramSeries, VOLUME_OPTIONS);
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeries.setData([]);
    volumeSeriesRef.current = volumeSeries;

    chart.subscribeCrosshairMove(param => {
      if (!hasCrosshairPoint(param)) return setHoverData(null);
      const ohlc = extractOhlc(param, candleSeries, lineSeries);
      if (!ohlc) return setHoverData(null);
      setHoverData(buildHoverData(param, container, ohlc, volumeSeries));
    });

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
  }, [chartType, chartContainerRef]);

  useEffect(() => {
    if (!chartRef.current) return;
    const mode =
      scaleMode === '%' ? PriceScaleMode.Percentage : scaleMode === 'log' ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal;
    chartRef.current.priceScale('right').applyOptions({ mode });
  }, [scaleMode]);

  useEffect(() => {
    const { candles, volumes } = resolveCandleData(realCandles, effectivePriceRef.current, activeTimeframe);
    if (candles.length === 0) return;

    candleSeriesRef.current?.setData(candles);
    lineSeriesRef.current?.setData(candles.map(c => ({ time: c.time, value: c.close })));
    volumeSeriesRef.current?.setData(volumes);
    setCurrentCandles(candles);

    lastCandleRef.current = candles[candles.length - 1] ?? null;
    lastVolumeRef.current = volumes[volumes.length - 1] ?? null;

    if (checkNeedsRefit(hasFittedRef.current, lastTimeframeRef.current, activeTimeframe, lastRangeRef.current, activeRange)) {
      hasFittedRef.current = true;
      lastTimeframeRef.current = activeTimeframe;
      lastRangeRef.current = activeRange;
      chartRef.current?.timeScale().fitContent();
    }
  }, [realCandles, activeTimeframe, activeRange, chartType]);

  useEffect(() => {
    if (livePrice <= 0 || !lastCandleRef.current) return;
    const diff = Math.abs(livePrice - lastCandleRef.current.close);
    if (lastCandleRef.current.close > 0 && diff / lastCandleRef.current.close > 0.2) return;

    const updated: CandlestickData = {
      ...lastCandleRef.current,
      high: Math.max(lastCandleRef.current.high, livePrice),
      low: Math.min(lastCandleRef.current.low, livePrice),
      close: livePrice,
    };
    lastCandleRef.current = updated;
    candleSeriesRef.current?.update(updated);
    lineSeriesRef.current?.update({ time: updated.time, value: updated.close });
  }, [livePrice]);

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

  const activeSeriesRef = chartType === 'candles' ? candleSeriesRef : lineSeriesRef;

  useChartIndicators({
    chartRef,
    candles: currentCandles,
    indicators,
    volumeSeriesRef,
  });

  useChartAlerts({
    seriesRef: activeSeriesRef,
    market,
    livePrice,
  });

  return { hoverData, setHoverData, latestCandle };
}
