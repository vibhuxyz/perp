import { useEffect, useRef, useState, useMemo, type RefObject } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Trade } from '@/stores/market.store';
import type { CandleItem } from '@/features/trade/api/tradeApi';
import {
  resolveCandleData,
  type HoverData,
  type CandlestickData,
  type VolumeData,
} from '../chartData';
import { CHART_OPTIONS } from './chartOptions';
import { hasCrosshairPoint, extractOhlc, buildHoverData } from './chartCrosshair';

interface UseChartProps {
  chartContainerRef: RefObject<HTMLDivElement | null>;
  chartType: 'candles' | 'line';
  activeTimeframe: string;
  effectivePrice: number;
  lastTradePrice: string | null;
  indexPrice: string | null;
  trades: Trade[];
  realCandles?: CandleItem[];
}

export function useChartInstance({
  chartContainerRef,
  chartType,
  activeTimeframe,
  effectivePrice,
  lastTradePrice,
  indexPrice,
  trades,
  realCandles,
}: UseChartProps) {
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);
  const lastVolumeRef = useRef<VolumeData | null>(null);

  const [hoverData, setHoverData] = useState<HoverData | null>(null);

  const livePrice = parseFloat(lastTradePrice ?? indexPrice ?? '0');
  const baseCandle = realCandles && realCandles.length > 0 ? realCandles[realCandles.length - 1] : null;

  const latestCandle: CandlestickData | null = useMemo(() => {
    if (!baseCandle) return null;
    const hp = livePrice > 0 ? Math.max(baseCandle.high, livePrice) : baseCandle.high;
    const lp = livePrice > 0 ? Math.min(baseCandle.low, livePrice) : baseCandle.low;
    const cp = livePrice > 0 ? livePrice : baseCandle.close;
    return {
      time: baseCandle.time as UTCTimestamp,
      open: baseCandle.open,
      high: hp,
      low: lp,
      close: cp,
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
      candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00F29D',
        downColor: '#FF4D5A',
        borderVisible: false,
        wickUpColor: '#00F29D',
        wickDownColor: '#FF4D5A',
        priceLineVisible: true,
        lastValueVisible: true,
      });
      candleSeriesRef.current = candleSeries;
    } else {
      lineSeries = chart.addSeries(LineSeries, {
        color: '#00F29D',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      lineSeriesRef.current = lineSeries;
    }

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData([]);
    volumeSeriesRef.current = volumeSeries;

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
    const { candles, volumes } = resolveCandleData(realCandles, effectivePrice, activeTimeframe);
    if (candles.length === 0) return;

    candleSeriesRef.current?.setData(candles);
    lineSeriesRef.current?.setData(candles.map(c => ({ time: c.time, value: c.close })));
    volumeSeriesRef.current?.setData(volumes);

    lastCandleRef.current = candles[candles.length - 1] ?? null;
    lastVolumeRef.current = volumes[volumes.length - 1] ?? null;
    chartRef.current?.timeScale().fitContent();
  }, [realCandles, effectivePrice, activeTimeframe]);

  useEffect(() => {
    if (livePrice <= 0 || !lastCandleRef.current) return;

    const updatedCandle: CandlestickData = {
      ...lastCandleRef.current,
      high: Math.max(lastCandleRef.current.high, livePrice),
      low: Math.min(lastCandleRef.current.low, livePrice),
      close: livePrice,
    };
    lastCandleRef.current = updatedCandle;

    candleSeriesRef.current?.update(updatedCandle);
    lineSeriesRef.current?.update({ time: updatedCandle.time, value: updatedCandle.close });
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

  return { hoverData, setHoverData, latestCandle };
}
