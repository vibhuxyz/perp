function utilizationColor(pct: number) {
  if (pct > 80) return 'text-loss bg-loss/15';
  if (pct > 50) return 'text-[#FFB020] bg-[#FFB020]/15';
  return 'text-info bg-info/15';
}

function utilizationBarColor(pct: number) {
  if (pct > 80) return 'bg-loss';
  if (pct > 50) return 'bg-[#FFB020]';
  return 'bg-[#3B82F6]';
}

export function OrderSummary({
  requiredMargin,
  requiredMarginNum,
  marginUtilizationPct,
  availableMarginNum,
  estLiqPrice,
  liqDistancePct,
  isLiqClose,
  estFee,
}: {
  requiredMargin: string;
  requiredMarginNum: number;
  marginUtilizationPct: number;
  availableMarginNum: number;
  estLiqPrice: string;
  liqDistancePct: number | null;
  isLiqClose: boolean;
  estFee: string;
}) {
  return (
    <div className="flex flex-col gap-2.5 pt-1 text-xs font-mono">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary font-sans">Required Margin</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-medium tabular-nums">{requiredMargin} USDT</span>
            {requiredMarginNum > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${utilizationColor(marginUtilizationPct)}`}>
                {marginUtilizationPct < 0.1 ? '<0.1%' : `${marginUtilizationPct.toFixed(1)}%`}
              </span>
            )}
          </div>
        </div>

        {requiredMarginNum > 0 && (
          <div className="flex flex-col gap-1 bg-[#101522] border border-border-subtle p-2 rounded-xl">
            <div className="flex items-center justify-between text-[10px] font-sans text-[#7E8B9F]">
              <span>
                Available:{' '}
                <strong className="text-white font-mono">
                  ${availableMarginNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </span>
              <span className="font-mono font-semibold text-white">{marginUtilizationPct.toFixed(1)}% used</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-border-subtle overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${utilizationBarColor(marginUtilizationPct)}`}
                style={{ width: `${Math.min(marginUtilizationPct, 100)}%` }}
              />
            </div>
            {marginUtilizationPct > 100 && (
              <span className="text-[10px] text-loss font-sans font-semibold mt-0.5">
                ⚠️ Order exceeds available margin
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-text-secondary font-sans">Est. Liquidation Price</span>
        <div className="flex items-center gap-1.5">
          <span className={`tabular-nums ${isLiqClose ? 'text-loss font-bold' : 'text-white font-medium'}`}>
            {estLiqPrice}
          </span>
          {liqDistancePct !== null && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                isLiqClose ? 'text-loss bg-loss/15 border border-loss/30' : 'text-text-secondary bg-[#161D2B]'
              }`}
            >
              ~{liqDistancePct.toFixed(1)}% away
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-text-secondary font-sans">Est. Fee</span>
        <span className="text-white font-medium tabular-nums">{estFee} USDT</span>
      </div>
    </div>
  );
}
