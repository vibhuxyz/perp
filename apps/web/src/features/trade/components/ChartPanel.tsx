import { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickData,
  type HistogramData,
  type LineData,
} from 'lightweight-charts';
import {
  CandlestickChart as CandleIcon,
  SlidersHorizontal,
  Bell,
  Maximize2,
  TrendingUp,
  Crosshair,
  PenTool,
  Hash,
  Type,
  Ruler,
  Trash2,
  Smile,
} from 'lucide-react';
import { useMarketStore } from '@/stores/market.store';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D'] as const;
const RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y', 'All'] as const;

// Generate realistic starting candle data around 67,432
function generateInitialCandles(count = 90) {
  const candles: CandlestickData<UTCTimestamp>[] = [];
  const volumes: HistogramData<UTCTimestamp>[] = [];
  const ma20: LineData<UTCTimestamp>[] = [];
  const ma50: LineData<UTCTimestamp>[] = [];

  const now = Math.floor(Date.now() / 1000);
  const step = 3600; // 1 hour steps
  let price = 65800;

  for (let i = count; i >= 0; i--) {
    const time = (now - i * step) as UTCTimestamp;
    const change = (Math.random() - 0.48) * 350;
    const open = Math.round(price);
    const close = Math.round(price + change);
    const high = Math.round(Math.max(open, close) + Math.random() * 220);
    const low = Math.round(Math.min(open, close) - Math.random() * 220);
    price = close;

    candles.push({ time, open, high, low, close });

    const isUp = close >= open;
    const volumeVal = Math.floor(250 + Math.random() * 800);
    volumes.push({
      time,
      value: volumeVal,
      color: isUp ? 'rgba(0, 242, 157, 0.35)' : 'rgba(255, 77, 90, 0.35)',
    });
  }

  // Force the last candle to match 67,432.1
  const last = candles[candles.length - 1];
  if (last) {
    last.open = 67188.1;
    last.high = 67512.4;
    last.low = 67102.3;
    last.close = 67432.1;
  }

  // Calculate moving averages
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    if (!candle) continue;
    const t = candle.time;
    if (i >= 19) {
      const slice = candles.slice(i - 19, i + 1);
      const avg = slice.reduce((sum, c) => sum + c.close, 0) / 20;
      ma20.push({ time: t, value: Math.round(avg * 10) / 10 });
    }
    if (i >= 49) {
      const slice = candles.slice(i - 49, i + 1);
      const avg = slice.reduce((sum, c) => sum + c.close, 0) / 50;
      ma50.push({ time: t, value: Math.round(avg * 10) / 10 });
    }
  }

  return { candles, volumes, ma20, ma50 };
}

export function ChartPanel() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick', UTCTimestamp> | null>(null);

  const [activeTimeframe, setActiveTimeframe] = useState('1h');
  const [activeRange, setActiveRange] = useState('1D');
  const [scaleMode, setScaleMode] = useState<'auto' | 'log' | '%'>('auto');

  const lastTradePrice = useMarketStore(s => s.lastTradePrice);

  const initialData = useMemo(() => generateInitialCandles(90), []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize TradingView lightweight chart
    const chart = createChart(chartContainerRef.current, {
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
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: '#1A2333',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00F29D',
      downColor: '#FF4D5A',
      borderUpColor: '#00F29D',
      borderDownColor: '#FF4D5A',
      wickUpColor: '#00F29D',
      wickDownColor: '#FF4D5A',
    });
    candleSeries.setData(initialData.candles);
    candleSeriesRef.current = candleSeries as unknown as ISeriesApi<'Candlestick', UTCTimestamp>;

    // Volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#00F29D',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set as overlay
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });
    volumeSeries.setData(initialData.volumes);

    // Cyan EMA 20 line
    const ma20Series = chart.addSeries(LineSeries, {
      color: '#00D2FF',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });
    ma20Series.setData(initialData.ma20);

    // Purple EMA 50 line
    const ma50Series = chart.addSeries(LineSeries, {
      color: '#7052FF',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });
    ma50Series.setData(initialData.ma50);

    // Auto-fit contents
    chart.timeScale().fitContent();

    // Auto resize observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          chart.resize(entry.contentRect.width, entry.contentRect.height);
        }
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [initialData]);

  // Update real-time candle tick if last trade price updates
  useEffect(() => {
    if (!candleSeriesRef.current || !lastTradePrice) return;
    const priceNum = parseFloat(lastTradePrice);
    if (!isNaN(priceNum) && priceNum > 0) {
      const now = Math.floor(Date.now() / 1000) as UTCTimestamp;
      candleSeriesRef.current.update({
        time: now,
        open: 67188.1,
        high: Math.max(67512.4, priceNum),
        low: Math.min(67102.3, priceNum),
        close: priceNum,
      });
    }
  }, [lastTradePrice]);

  return (
    <div className="flex flex-col bg-[#0E121B] rounded-xl border border-[#1A2333] overflow-hidden select-none">
      {/* Top Chart Toolbar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#1A2333] px-3 gap-2 bg-[#0E121B]">
        {/* Left Toolbar Items: Timeframes & Tools */}
        <div className="flex items-center gap-1.5">
          {/* Timeframe selector pills */}
          <div className="flex items-center gap-0.5">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setActiveTimeframe(tf)}
                className={[
                  'px-2 py-0.5 rounded text-xs font-semibold font-mono transition-colors cursor-pointer',
                  activeTimeframe === tf
                    ? 'bg-[#192231] text-white border border-[#2B384E] shadow-xs'
                    : 'text-[#8492A6] hover:text-white hover:bg-[#131824]',
                ].join(' ')}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[#1A2333] mx-1" />

          {/* Chart style button */}
          <button
            type="button"
            className="p-1 rounded text-[#8492A6] hover:text-white hover:bg-[#131824] transition-colors"
            title="Candlestick Chart"
          >
            <CandleIcon className="h-3.5 w-3.5" />
          </button>

          {/* Indicators Button */}
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-[#8492A6] hover:text-white hover:bg-[#131824] transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Indicators</span>
          </button>

          {/* Alert Button */}
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-[#8492A6] hover:text-white hover:bg-[#131824] transition-colors"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Alert</span>
          </button>
        </div>

        {/* Right Toolbar Items */}
        <div className="flex items-center gap-1 text-[#8492A6]">
          <button type="button" className="p-1 hover:text-white hover:bg-[#131824] rounded transition-colors" title="Trendline">
            <TrendingUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="p-1 hover:text-white hover:bg-[#131824] rounded transition-colors" title="Fullscreen">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time OHLC Legend Strip */}
      <div className="flex items-center gap-4 px-3 py-1 text-[11px] font-mono border-b border-[#1A2333]/50 bg-[#0C1018] text-[#8492A6] tabular-nums">
        <div className="flex items-center gap-1 text-[#00F29D]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00F29D]" />
          <span>BTC-PERP</span>
        </div>
        <div className="flex items-center gap-2">
          <span>O <span className="text-[#00F29D]">67,188.1</span></span>
          <span>H <span className="text-[#00F29D]">67,512.4</span></span>
          <span>L <span className="text-[#00F29D]">67,102.3</span></span>
          <span>C <span className="text-[#00F29D]">67,432.1</span></span>
          <span className="text-[#00F29D] font-bold">+244.0 (+0.36%)</span>
        </div>
        <div className="ml-auto text-[#8492A6] text-[10px]">
          Volume <span className="text-[#00F29D]">12.4K</span>
        </div>
      </div>

      {/* Main Chart Body: Left Tools + Canvas */}
      <div className="flex flex-1 min-h-[360px] relative">
        {/* Left Drawing Tools Sidebar */}
        <div className="w-8 shrink-0 border-r border-[#1A2333] bg-[#0C1018] flex flex-col items-center py-2 gap-2 text-[#6A788E]">
          <button type="button" className="p-1 text-[#00D2FF] bg-[#141C2B] rounded hover:text-white transition-colors" title="Crosshair">
            <Crosshair className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="p-1 hover:text-white rounded transition-colors" title="Draw Line">
            <PenTool className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="p-1 hover:text-white rounded transition-colors" title="Fibonacci">
            <Hash className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="p-1 hover:text-white rounded transition-colors" title="Text Note">
            <Type className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="p-1 hover:text-white rounded transition-colors" title="Patterns">
            <Smile className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="p-1 hover:text-white rounded transition-colors" title="Measure Ruler">
            <Ruler className="h-3.5 w-3.5" />
          </button>
          <div className="mt-auto">
            <button type="button" className="p-1 hover:text-[#FF4D5A] rounded transition-colors" title="Remove Drawings">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Lightweight Charts Canvas Container */}
        <div ref={chartContainerRef} className="flex-1 min-h-[360px] w-full" />
      </div>

      {/* Bottom Range and Scale Bar */}
      <div className="flex h-7 shrink-0 items-center justify-between border-t border-[#1A2333] px-3 bg-[#0C1018] text-[11px] text-[#8492A6]">
        {/* Left Range Presets */}
        <div className="flex items-center gap-1 font-mono">
          {RANGES.map(range => (
            <button
              key={range}
              type="button"
              onClick={() => setActiveRange(range)}
              className={[
                'px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer',
                activeRange === range
                  ? 'text-white font-bold bg-[#1A2333]'
                  : 'text-[#8492A6] hover:text-white',
              ].join(' ')}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Center UTC Time */}
        <div className="font-mono text-[10px] text-[#8492A6]">
          12:45:23 (UTC)
        </div>

        {/* Right Scale Options */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {(['%', 'log', 'auto'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setScaleMode(mode)}
              className={[
                'cursor-pointer transition-colors',
                scaleMode === mode ? 'text-[#00D2FF] font-bold' : 'text-[#8492A6] hover:text-white',
              ].join(' ')}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
