import { AlertTriangle } from 'lucide-react';

export function LiquidationWarning({ estLiqPrice, liqDistancePct }: { estLiqPrice: string; liqDistancePct: number }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-loss/40 bg-loss/10 p-2.5 text-xs text-loss select-none">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-loss" />
      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-loss text-xs">Liquidation Risk Warning</span>
        <span className="text-[11px] text-loss/90 leading-tight">
          Liquidation price ({estLiqPrice}) is only{' '}
          <strong className="text-white font-mono font-bold">~{liqDistancePct.toFixed(1)}%</strong> away from mark
          price. Adverse price volatility could trigger liquidation.
        </span>
      </div>
    </div>
  );
}
