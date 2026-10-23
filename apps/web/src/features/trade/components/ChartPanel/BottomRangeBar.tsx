import { RANGES } from '../chartData';

export type ScaleMode = '%' | 'log' | 'auto';

const SCALE_MODES: readonly ScaleMode[] = ['%', 'log', 'auto'];

export function BottomRangeBar({
  activeRange,
  onSelectRange,
  utcTime,
  scaleMode,
  onSelectScaleMode,
}: {
  activeRange: string;
  onSelectRange: (range: string) => void;
  utcTime: string;
  scaleMode: ScaleMode;
  onSelectScaleMode: (mode: ScaleMode) => void;
}) {
  return (
    <div className="flex h-7 shrink-0 items-center justify-between border-t border-border-subtle px-3 bg-[#0C1018] text-[11px] text-text-secondary">
      <div className="flex items-center gap-1 font-mono">
        {RANGES.map(range => (
          <button
            key={range}
            type="button"
            onClick={() => onSelectRange(range)}
            className={[
              'px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer',
              activeRange === range ? 'text-white font-bold bg-[#1A2333]' : 'text-[#8492A6] hover:text-white',
            ].join(' ')}
          >
            {range}
          </button>
        ))}
      </div>

      <div className="font-mono text-[10px] text-text-secondary">{utcTime} (UTC)</div>

      <div className="flex items-center gap-1 font-mono text-[10px]">
        {SCALE_MODES.map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => onSelectScaleMode(mode)}
            className={[
              'px-1.5 py-0.5 rounded transition-colors cursor-pointer',
              scaleMode === mode ? 'text-white font-bold bg-[#1A2333]' : 'text-[#8492A6] hover:text-white',
            ].join(' ')}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
