import { useState } from 'react';
import { TrendingUp, TrendingDown, XCircle } from 'lucide-react';
import { useSimulationStore } from '../useSimulationStore';

const LEVERAGES = [1, 5, 10, 20, 50] as const;
const PERCENT_PRESETS = [0.25, 0.5, 0.75, 1.0] as const;

export function SimulationOrderTicket() {
  const balance = useSimulationStore(s => s.balance);
  const position = useSimulationStore(s => s.position);
  const openPosition = useSimulationStore(s => s.openPosition);
  const closePosition = useSimulationStore(s => s.closePosition);

  const [leverage, setLeverage] = useState<number>(10);
  const [marginPct, setMarginPct] = useState<number>(0.5);

  const selectedMargin = Math.round(balance * marginPct);

  return (
    <div className="w-80 shrink-0 bg-[#0C101A] border-l border-border-subtle p-4 flex flex-col justify-between text-xs select-none">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle/60">
          <span className="font-bold text-white uppercase font-mono text-[11px]">Flight Controls</span>
          <span className="text-[10px] text-text-secondary font-mono">Isolated Margin</span>
        </div>

        {position ? (
          <div className="p-3 rounded-xl border border-border-subtle bg-[#101726] space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className={`font-black text-sm ${position.side === 'LONG' ? 'text-profit' : 'text-loss'}`}>
                {position.side} {position.leverage}x
              </span>
              <span className="text-text-secondary text-[10px]">Active Flight</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border-subtle/50">
              <div>
                <span className="text-[9px] text-text-secondary block">ENTRY</span>
                <span className="text-white font-bold">${position.entryPrice.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-text-secondary block">LIQ PRICE</span>
                <span className="text-loss font-bold">${position.liquidationPrice.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-text-secondary block">MARGIN</span>
                <span className="text-white">${position.margin.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-text-secondary block">PNL</span>
                <span className={`font-bold ${position.unrealizedPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {position.unrealizedPnL >= 0 ? `+$${position.unrealizedPnL.toFixed(2)}` : `-$${Math.abs(position.unrealizedPnL).toFixed(2)}`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={closePosition}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#243048] hover:bg-[#2C3B58] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
              <span>Close Position</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-text-secondary font-mono text-[10px] mb-1.5">
                <span>LEVERAGE</span>
                <span className="text-white font-bold">{leverage}x</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {LEVERAGES.map(lev => (
                  <button
                    key={lev}
                    type="button"
                    onClick={() => setLeverage(lev)}
                    className={`py-1 rounded font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                      leverage === lev
                        ? 'bg-primary/20 text-primary border border-primary/50'
                        : 'bg-[#121927] text-text-secondary hover:text-white border border-border-subtle/60'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-text-secondary font-mono text-[10px] mb-1.5">
                <span>MARGIN AMOUNT</span>
                <span className="text-white font-bold">${selectedMargin.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {PERCENT_PRESETS.map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setMarginPct(pct)}
                    className={`py-1 rounded font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                      marginPct === pct
                        ? 'bg-primary/20 text-primary border border-primary/50'
                        : 'bg-[#121927] text-text-secondary hover:text-white border border-border-subtle/60'
                    }`}
                  >
                    {pct * 100}%
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={balance <= 0}
                onClick={() => openPosition('LONG', leverage, selectedMargin)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-profit hover:brightness-110 text-bg-primary font-bold text-xs transition-all shadow-md shadow-profit/20 cursor-pointer disabled:opacity-50"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Long {leverage}x</span>
              </button>
              <button
                type="button"
                disabled={balance <= 0}
                onClick={() => openPosition('SHORT', leverage, selectedMargin)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-loss hover:brightness-110 text-white font-bold text-xs transition-all shadow-md shadow-loss/20 cursor-pointer disabled:opacity-50"
              >
                <TrendingDown className="h-4 w-4" />
                <span>Short {leverage}x</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 rounded-lg bg-[#080B12] border border-border-subtle/50 text-[10px] text-text-secondary font-mono">
        <span className="text-white font-bold block mb-0.5">FLIGHT SAFETY RULE</span>
        Stop-losses execute at the Mark Price. In violent crashes, local order book slippage can exceed 10%.
      </div>
    </div>
  );
}
