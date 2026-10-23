import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMarketStore } from '@/stores/market.store';
import { fetchCandles } from '@/features/trade/api/tradeApi';
import { ChartToolbar } from './ChartToolbar';
import { ChartLegend } from './ChartLegend';
import { DrawingToolsSidebar } from './DrawingToolsSidebar';
import { HoverTooltip } from './HoverTooltip';
import { BottomRangeBar, type ScaleMode } from './BottomRangeBar';
import { useChartInstance } from './useChartInstance';
import { RANGE_CONFIGS } from '../chartData';

export function ChartPanel() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [activeTimeframe, setActiveTimeframe] = useState<string>('1h');
  const [activeRange, setActiveRange] = useState<string>('1D');
  const [scaleMode, setScaleMode] = useState<ScaleMode>('auto');
  const [utcTime, setUtcTime] = useState(() => new Date().toISOString().substring(11, 19));

  const currentMarket = useMarketStore(s => s.currentMarket);
  const lastTradePrice = useMarketStore(s => s.lastTradePrice);
  const indexPrice = useMarketStore(s => s.indexPrice);
  const trades = useMarketStore(s => s.trades);

  const activeConfig = useMemo(() => {
    if (activeRange && RANGE_CONFIGS[activeRange]) {
      const cfg = RANGE_CONFIGS[activeRange];
      return { interval: cfg.interval, limit: cfg.limit, key: activeRange };
    }
    return { interval: activeTimeframe, limit: 150, key: activeTimeframe };
  }, [activeRange, activeTimeframe]);

  const { data: realCandles } = useQuery({
    queryKey: ['candles', currentMarket, activeConfig.key, activeConfig.interval, activeConfig.limit],
    queryFn: () => fetchCandles(currentMarket, activeConfig.interval, activeConfig.limit),
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: false,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toISOString().substring(11, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectRange = (range: string) => {
    setActiveRange(range);
    const cfg = RANGE_CONFIGS[range];
    if (cfg) setActiveTimeframe(cfg.interval);
  };

  const handleSelectTimeframe = (tf: string) => {
    setActiveTimeframe(tf);
    setActiveRange('');
  };

  const effectivePrice = useMemo(() => {
    return parseFloat(lastTradePrice ?? indexPrice ?? '67432.1') || 67432.1;
  }, [lastTradePrice, indexPrice]);

  const { hoverData, setHoverData, latestCandle } = useChartInstance({
    chartContainerRef,
    chartType,
    activeTimeframe: activeConfig.interval,
    activeRange,
    scaleMode,
    effectivePrice,
    lastTradePrice,
    indexPrice,
    trades,
    realCandles,
  });

  return (
    <div className="flex flex-col h-full bg-bg-card rounded-xl border border-border-subtle overflow-hidden select-none">
      <ChartToolbar
        activeTimeframe={activeTimeframe}
        onSelectTimeframe={handleSelectTimeframe}
        chartType={chartType}
        onToggleChartType={() => setChartType(prev => (prev === 'candles' ? 'line' : 'candles'))}
      />

      <ChartLegend
        hoverData={hoverData}
        lastTradePrice={lastTradePrice}
        indexPrice={indexPrice}
        effectivePrice={effectivePrice}
        latestCandle={latestCandle}
      />

      <div className="flex flex-1 min-h-0 relative overflow-hidden" onMouseLeave={() => setHoverData(null)}>
        <DrawingToolsSidebar />

        <div ref={chartContainerRef} className="flex-1 min-h-0 w-full relative" />

        {hoverData && <HoverTooltip hoverData={hoverData} />}
      </div>

      <BottomRangeBar
        activeRange={activeRange}
        onSelectRange={handleSelectRange}
        scaleMode={scaleMode}
        onSelectScaleMode={setScaleMode}
        utcTime={utcTime}
      />
    </div>
  );
}
