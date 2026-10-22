import { useState, useRef, useEffect } from 'react';
import { triggerHaptic } from '@/shared/lib/haptics';

const TICKS = [0, 25, 50, 75, 100];
const VIBRATE_THROTTLE_MS = 40;
const ACTIVE_RESET_DELAY_MS = 350;

export function PercentSlider({ percent, onChange }: { percent: number; onChange: (pct: number) => void }) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const prevPercentRef = useRef(percent);
  const lastVibrateTimeRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (percent > prevPercentRef.current) {
      const now = Date.now();
      if (now - lastVibrateTimeRef.current >= VIBRATE_THROTTLE_MS) {
        lastVibrateTimeRef.current = now;
        triggerHaptic(15);
      }
      setIsIncreasing(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setIsIncreasing(false);
      }, ACTIVE_RESET_DELAY_MS);
    }
    prevPercentRef.current = percent;
  }, [percent]);

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
    <div className="flex flex-col gap-1 py-1">
      <div className="relative flex items-center py-2 cursor-pointer">
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
            className="h-full bg-[#3B82F6] rounded-full transition-all duration-75"
            style={{ width: `${percent}%` }}
          />

          {TICKS.map(tick => {
            const isPassed = percent >= tick;
            return (
              <div
                key={`tick-${tick}`}
                style={{ left: `${tick}%` }}
                className={[
                  'absolute w-2.5 h-2.5 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-150',
                  isPassed ? 'border-2 border-[#3B82F6] bg-[#0A0E17]' : 'border-2 border-[#2E3B52] bg-[#0A0E17]',
                ].join(' ')}
              />
            );
          })}

          <div
            style={{ left: `${percent}%` }}
            className={[
              'absolute rounded-full bg-[#3B82F6] top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-150',
              isIncreasing
                ? 'w-5 h-5 shadow-lg shadow-[#3B82F6]/90 ring-4 ring-[#3B82F6]/30'
                : isInteracting
                  ? 'w-4.5 h-4.5 shadow-md shadow-[#3B82F6]/70'
                  : 'w-4 h-4 shadow-sm shadow-[#3B82F6]/60',
            ].join(' ')}
          />
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={percent}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex justify-between text-xs font-mono text-text-secondary px-0.5">
        <span>0</span>
        <span>100%</span>
      </div>
    </div>
  );
}
