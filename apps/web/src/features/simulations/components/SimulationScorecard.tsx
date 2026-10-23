import { Trophy, AlertOctagon, RotateCcw, ArrowLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useSimulationStore } from '../useSimulationStore';

export function SimulationScorecard() {
  const result = useSimulationStore(s => s.result);
  const resetSimulation = useSimulationStore(s => s.resetSimulation);
  const exitToCatalog = useSimulationStore(s => s.exitToCatalog);

  if (!result) return null;

  const gradeColors = {
    S: 'text-[#00F29D] border-[#00F29D]/40 bg-[#00F29D]/10',
    A: 'text-[#06B6D4] border-[#06B6D4]/40 bg-[#06B6D4]/10',
    B: 'text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10',
    C: 'text-[#EC4899] border-[#EC4899]/40 bg-[#EC4899]/10',
    F: 'text-loss border-loss/40 bg-loss/10',
  }[result.grade];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-lg rounded-2xl border border-border-subtle bg-[#0E131F] shadow-2xl p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center">
          <div
            className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-3 border shadow-lg ${
              result.survived
                ? 'border-profit/30 bg-profit/10 text-profit'
                : 'border-loss/30 bg-loss/10 text-loss'
            }`}
          >
            {result.survived ? <Trophy className="h-8 w-8" /> : <AlertOctagon className="h-8 w-8" />}
          </div>

          <h2 className="text-xl font-black text-white uppercase tracking-wider">
            {result.survived ? 'Flight Survived' : 'Position Liquidated'}
          </h2>
          <p className="text-xs text-text-secondary font-mono mt-0.5">{result.scenarioTitle}</p>
        </div>

        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border border-border-subtle/80 bg-[#121927]">
          <span className="text-xs font-mono text-text-secondary">SURVIVAL GRADE</span>
          <span className={`text-2xl font-black px-3 py-0.5 rounded-lg border ${gradeColors}`}>
            {result.grade}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#111728] border border-border-subtle/60">
            <span className="text-[10px] text-text-secondary block">NET PNL</span>
            <div
              className={`font-bold flex items-center justify-center gap-0.5 ${
                result.netPnL >= 0 ? 'text-profit' : 'text-loss'
              }`}
            >
              {result.netPnL >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {result.netPnL >= 0 ? `+$${result.netPnL}` : `-$${Math.abs(result.netPnL)}`}
            </div>
            <span className="text-[10px] text-text-secondary">({result.roiPct}%)</span>
          </div>

          <div className="p-3 rounded-xl bg-[#111728] border border-border-subtle/60">
            <span className="text-[10px] text-text-secondary block">FINAL EQUITY</span>
            <span className="font-bold text-white block mt-0.5">${result.finalBalance.toLocaleString()}</span>
            <span className="text-[10px] text-text-secondary">Start: $10,000</span>
          </div>

          <div className="p-3 rounded-xl bg-[#111728] border border-border-subtle/60">
            <span className="text-[10px] text-text-secondary block">MAX DRAWDOWN</span>
            <span
              className={`font-bold block mt-0.5 ${result.maxDrawdownPct > 30 ? 'text-loss' : 'text-white'}`}
            >
              {result.maxDrawdownPct}%
            </span>
            <span className="text-[10px] text-text-secondary">Peak Exposure</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#121927] border border-border-subtle text-left">
          <span className="text-[10px] font-mono font-bold text-primary block mb-1">
            TACTICAL DEBRIEF & LESSON
          </span>
          <p className="text-xs text-text-secondary leading-relaxed">{result.feedback}</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={exitToCatalog}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border-subtle bg-[#141C2D] hover:bg-[#1A253C] text-text-secondary hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Missions Catalog</span>
          </button>

          <button
            type="button"
            onClick={resetSimulation}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-bg-primary text-xs font-bold transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Fly Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
