import { X, Check } from 'lucide-react';
import { useChartSettingsStore, type IndicatorState } from '@/stores/chartSettings.store';

interface IndicatorItem {
  key: keyof IndicatorState;
  name: string;
  description: string;
  color: string;
  type: string;
}

const AVAILABLE_INDICATORS: IndicatorItem[] = [
  { key: 'ma7', name: 'MA (7)', description: '7-period simple moving average', color: '#F59E0B', type: 'Trend' },
  { key: 'ma25', name: 'MA (25)', description: '25-period simple moving average', color: '#06B6D4', type: 'Trend' },
  { key: 'ma99', name: 'MA (99)', description: '99-period simple moving average', color: '#8B5CF6', type: 'Trend' },
  { key: 'ema20', name: 'EMA (20)', description: '20-period exponential moving average', color: '#10B981', type: 'Momentum' },
  { key: 'bollinger', name: 'Bollinger Bands', description: '20-period with 2 standard deviations', color: '#3B82F6', type: 'Volatility' },
  { key: 'volume', name: 'Volume Bar', description: 'Volume histogram panel below candles', color: '#00F29D', type: 'Volume' },
];

export function IndicatorsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const indicators = useChartSettingsStore(s => s.indicators);
  const toggleIndicator = useChartSettingsStore(s => s.toggleIndicator);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-md rounded-xl border border-border-subtle bg-[#0E131F] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 bg-[#111726]">
          <div>
            <h3 className="text-sm font-semibold text-white">Technical Indicators</h3>
            <p className="text-xs text-text-secondary">Toggle overlays for live price action</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-text-secondary hover:text-white hover:bg-[#1A2234] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-border-subtle/50 max-h-[420px] overflow-y-auto p-2">
          {AVAILABLE_INDICATORS.map(item => {
            const isActive = indicators[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggleIndicator(item.key)}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#141C2D] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3.5 w-3.5 rounded-full shrink-0 border border-white/20"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                      <span className="rounded bg-[#1A2335] px-1.5 py-0.5 text-[10px] text-text-secondary font-mono">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{item.description}</p>
                  </div>
                </div>

                <div
                  className={`h-5 w-9 rounded-full transition-colors flex items-center px-0.5 ${
                    isActive ? 'bg-profit' : 'bg-[#212C40]'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-xs transition-transform flex items-center justify-center ${
                      isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  >
                    {isActive && <Check className="h-2.5 w-2.5 text-[#0A0E17]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border-subtle px-4 py-2.5 bg-[#111726] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-bg-primary text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
