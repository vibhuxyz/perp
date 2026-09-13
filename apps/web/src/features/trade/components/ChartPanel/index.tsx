import { useEffect, useRef, useState, useMemo } from 'react';
import { useMarketStore } from '@/stores/market.store';
import { ChartToolbar } from './ChartToolbar';
import { ChartLegend } from './ChartLegend';
import { DrawingToolsSidebar } from './DrawingToolsSidebar';
import { HoverTooltip } from './HoverTooltip';
import { BottomRangeBar } from './BottomRangeBar';
import { useChartInstance } from './useChartInstance';

export function ChartPanel() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [activeTimeframe, setActiveTimeframe] = useState<string>('1h');
  const [activeRange, setActiveRange] = useState<string>('1D');
  const [utcTime, setUtcTime] = useState(() => new Date().toISOString().substring(11, 19));

  const lastTradePrice = useMarketStore(s => s.lastTradePrice);
  const indexPrice = useMarketStore(s => s.indexPrice);
  const trades = useMarketStore(s => s.trades);

  // Keep live UTC clock updated
  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toISOString().substring(11, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const effectivePrice = useMemo(() => {
    return parseFloat(lastTradePrice ?? indexPrice ?? '67432.1') || 67432.1;
  }, [lastTradePrice, indexPrice]);

  const { hoverData, setHoverData, latestCandle } = useChartInstance({
    chartContainerRef,
    chartType,
    activeTimeframe,
    effectivePrice,
    lastTradePrice,
    indexPrice,
    trades,
  });

  return (
    <div className="flex flex-col h-full bg-bg-card rounded-xl border border-border-subtle overflow-hidden select-none">
      <ChartToolbar
        activeTimeframe={activeTimeframe}
        onSelectTimeframe={setActiveTimeframe}
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

      <BottomRangeBar activeRange={activeRange} onSelectRange={setActiveRange} utcTime={utcTime} />
    </div>
  );
}
