import { RotateCcw } from 'lucide-react';
import { LEVERAGE_STOPS } from '../../constants';

export function LeverageSlider({
  stopIndex,
  onChangeIndex,
  onReset,
}: {
  stopIndex: number;
  onChangeIndex: (index: number) => void;
  onReset: () => void;
}) {
  const currentLeverage = LEVERAGE_STOPS[stopIndex] ?? 10;
  const positionPct = (stopIndex / (LEVERAGE_STOPS.length - 1)) * 100;

  return (
    <div className="flex flex-col gap-1 pt-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-text-secondary">Leverage</span>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 font-mono font-bold text-white hover:text-info transition-colors cursor-pointer"
          title="Reset leverage to 10x"
        >
          <span>{currentLeverage}x</span>
          <RotateCcw className="h-3 w-3 text-text-secondary" />
        </button>
      </div>

      <div className="relative flex items-center py-1.5 cursor-pointer">
        <div className="w-full h-[3px] bg-[#222B3D] rounded-full relative">
          <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${positionPct}%` }} />

          {LEVERAGE_STOPS.map((stop, i) => {
            const pos = (i / (LEVERAGE_STOPS.length - 1)) * 100;
            return (
              <div
                key={`lev-dot-${stop}`}
                style={{ left: `${pos}%` }}
                className="absolute w-2 h-2 rounded-full border border-[#2E3B52] bg-[#0A0E17] top-[-2.5px] -translate-x-1/2 pointer-events-none"
              />
            );
          })}

          <div
            style={{ left: `${positionPct}%` }}
            className="absolute w-3.5 h-3.5 rounded-full bg-[#3B82F6] shadow-sm shadow-[#3B82F6]/60 top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
          />
        </div>

        <input
          type="range"
          min="0"
          max={LEVERAGE_STOPS.length - 1}
          step="1"
          value={stopIndex}
          onChange={e => onChangeIndex(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex justify-between text-[10px] font-mono text-[#6A7B95] px-0.5">
        {LEVERAGE_STOPS.map((stop, i) => (
          <button
            key={stop}
            type="button"
            onClick={() => onChangeIndex(i)}
            className={[
              'cursor-pointer transition-colors hover:text-white',
              stopIndex === i ? 'text-white font-bold' : '',
            ].join(' ')}
          >
            {stop}x
          </button>
        ))}
      </div>
    </div>
  );
}
