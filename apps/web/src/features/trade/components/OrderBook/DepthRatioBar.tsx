export function DepthRatioBar({
  hasLiquidity,
  bidPercent,
  askPercent,
}: {
  hasLiquidity: boolean;
  bidPercent: number;
  askPercent: number;
}) {
  return (
    <div className="p-2 shrink-0 border-t border-border-subtle bg-[#0C1018]">
      {hasLiquidity ? (
        <div className="flex h-6 w-full rounded-md overflow-hidden bg-[#0A0D14] text-xs font-bold font-mono">
          <div
            style={{
              width: `${bidPercent}%`,
              clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
            }}
            className="bg-profit/20 text-profit flex items-center px-2.5 transition-all"
          >
            {bidPercent}%
          </div>

          <div
            style={{
              width: `${askPercent + 2}%`,
              marginLeft: '-8px',
              clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%)',
            }}
            className="bg-loss/20 text-loss flex items-center justify-end px-2.5 transition-all"
          >
            {askPercent}%
          </div>
        </div>
      ) : (
        <div className="flex h-6 w-full items-center justify-center rounded-md bg-[#0A0D14] text-[11px] font-mono text-text-muted">
          Depth 0.00 BTC
        </div>
      )}
    </div>
  );
}
