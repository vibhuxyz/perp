export function ProgressGauge({ percent = 0, compact = false }: { percent?: number; compact?: boolean }) {
  const radius = compact ? 16 : 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const size = compact ? 40 : 56;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
      <svg className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} -rotate-90`} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1B2435" strokeWidth={compact ? 3 : 4} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#00F29D"
          strokeWidth={compact ? 3 : 4}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-white tabular-nums`}>{percent}%</span>
      </div>
    </div>
  );
}
