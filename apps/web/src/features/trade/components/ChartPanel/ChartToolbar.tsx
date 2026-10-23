import {
  CandlestickChart as CandleIcon,
  LineChart as LineIcon,
  SlidersHorizontal,
  Bell,
  TrendingUp,
  Maximize2,
} from 'lucide-react';
import { TIMEFRAMES } from '../chartData';

export function ChartToolbar({
  activeTimeframe,
  onSelectTimeframe,
  chartType,
  onToggleChartType,
  onOpenIndicators,
  onOpenAlert,
  onToggleFullscreen,
  activeIndicatorsCount = 0,
  activeAlertsCount = 0,
}: {
  activeTimeframe: string;
  onSelectTimeframe: (tf: string) => void;
  chartType: 'candles' | 'line';
  onToggleChartType: () => void;
  onOpenIndicators?: () => void;
  onOpenAlert?: () => void;
  onToggleFullscreen?: () => void;
  activeIndicatorsCount?: number;
  activeAlertsCount?: number;
}) {
  const isCandles = chartType === 'candles';

  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-b border-border-subtle px-3 gap-2 bg-bg-card">
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              type="button"
              onClick={() => onSelectTimeframe(tf)}
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

        <div className="h-4 w-px bg-border-subtle mx-1" />

        <button
          type="button"
          onClick={onToggleChartType}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            isCandles
              ? 'text-profit bg-[#141C2B] border border-profit/30'
              : 'text-[#06B6D4] bg-[#141C2B] border border-[#06B6D4]/30'
          }`}
          title={isCandles ? 'Switch to Line chart' : 'Switch to Candlestick chart'}
        >
          {isCandles ? <CandleIcon className="h-3.5 w-3.5" /> : <LineIcon className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          onClick={onOpenIndicators}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-text-secondary hover:text-white hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Indicators</span>
          {activeIndicatorsCount > 0 && (
            <span className="rounded-full bg-primary/20 text-primary px-1.5 py-0.2 text-[10px] font-mono font-bold">
              {activeIndicatorsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenAlert}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-text-secondary hover:text-white hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Alert</span>
          {activeAlertsCount > 0 && (
            <span className="rounded-full bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.2 text-[10px] font-mono font-bold">
              {activeAlertsCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-1 text-text-secondary">
        <button type="button" className="p-1 hover:text-white hover:bg-bg-elevated rounded transition-colors cursor-pointer" title="Trendline">
          <TrendingUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-1 hover:text-white hover:bg-bg-elevated rounded transition-colors cursor-pointer"
          title="Fullscreen"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
