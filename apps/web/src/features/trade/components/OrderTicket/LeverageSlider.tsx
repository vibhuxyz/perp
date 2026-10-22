import { useState, useRef, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { triggerHaptic } from '@/shared/lib/haptics';
import { LEVERAGE_STOPS } from '../../constants';

const ACTIVE_RESET_DELAY_MS = 350;

export function LeverageSlider({
  stopIndex,
  onChangeIndex,
  onReset,
}: {
  stopIndex: number;
  onChangeIndex: (index: number) => void;
  onReset: () => void;
}) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const prevStopIndexRef = useRef(stopIndex);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLeverage = LEVERAGE_STOPS[stopIndex] ?? 10;
  const positionPct = (stopIndex / (LEVERAGE_STOPS.length - 1)) * 100;

  useEffect(() => {
    if (stopIndex > prevStopIndexRef.current) {
      triggerHaptic(20);
      setIsIncreasing(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setIsIncreasing(false);
      }, ACTIVE_RESET_DELAY_MS);
    }
    prevStopIndexRef.current = stopIndex;
  }, [stopIndex]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handlePointerDown = () => setIsInteracting(true);
  const handlePointerUp = () => {
    setIsInteracting(false);
    setIsIncreasing(false);
  };

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
        <div
          className={[
            'w-full bg-[#222B3D] rounded-full relative transition-all duration-150',
            isIncreasing
              ? 'h-[7px] shadow-[0_0_14px_rgba(59,130,246,0.7)]'
              : isInteracting
                ? 'h-[5px]'
                : 'h-[3px]',
          ].join(' ')}
        >
          <div
            className="h-full bg-[#3B82F6] rounded-full transition-all duration-150"
            style={{ width: `${positionPct}%` }}
          />

          {LEVERAGE_STOPS.map((stop, i) => {
            const pos = (i / (LEVERAGE_STOPS.length - 1)) * 100;
            const isPassed = stopIndex >= i;
            return (
              <div
                key={`lev-dot-${stop}`}
                style={{ left: `${pos}%` }}
                className={[
                  'absolute w-2 h-2 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-150',
                  isPassed ? 'border border-[#3B82F6] bg-[#0A0E17]' : 'border border-[#2E3B52] bg-[#0A0E17]',
                ].join(' ')}
              />
            );
          })}

          <div
            style={{ left: `${positionPct}%` }}
            className={[
              'absolute rounded-full bg-[#3B82F6] top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-150',
              isIncreasing
                ? 'w-4.5 h-4.5 shadow-lg shadow-[#3B82F6]/90 ring-4 ring-[#3B82F6]/30'
                : isInteracting
                  ? 'w-4 h-4 shadow-md shadow-[#3B82F6]/70'
                  : 'w-3.5 h-3.5 shadow-sm shadow-[#3B82F6]/60',
            ].join(' ')}
          />
        </div>

        <input
          type="range"
          min="0"
          max={LEVERAGE_STOPS.length - 1}
          step="1"
          value={stopIndex}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
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
