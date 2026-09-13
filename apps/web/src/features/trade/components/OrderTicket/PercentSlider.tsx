const TICKS = [0, 25, 50, 75, 100];

export function PercentSlider({ percent, onChange }: { percent: number; onChange: (pct: number) => void }) {
  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="relative flex items-center py-2 cursor-pointer">
        <div className="w-full h-[3px] bg-[#222B3D] rounded-full relative">
          <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${percent}%` }} />

          {TICKS.map(tick => {
            const isPassed = percent >= tick;
            return (
              <div
                key={`tick-${tick}`}
                style={{ left: `${tick}%` }}
                className={[
                  'absolute w-2.5 h-2.5 rounded-full -top-[3.5px] -translate-x-1/2 pointer-events-none transition-colors',
                  isPassed ? 'border-2 border-[#3B82F6] bg-[#0A0E17]' : 'border-2 border-[#2E3B52] bg-[#0A0E17]',
                ].join(' ')}
              />
            );
          })}

          <div
            style={{ left: `${percent}%` }}
            className="absolute w-4 h-4 rounded-full bg-[#3B82F6] shadow-sm shadow-[#3B82F6]/60 top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
          />
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={percent}
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
