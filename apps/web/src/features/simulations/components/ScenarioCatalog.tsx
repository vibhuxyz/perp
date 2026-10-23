import { Activity, ShieldCheck, Zap, BookOpen } from 'lucide-react';
import { SCENARIOS } from '../scenarios';
import { ScenarioCard } from './ScenarioCard';
import { useSimulationStore } from '../useSimulationStore';

export function ScenarioCatalog() {
  const selectScenario = useSimulationStore(s => s.selectScenario);

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl border border-border-subtle bg-linear-to-r from-[#101524] via-[#141C2E] to-[#0E1321] p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-bold">
              <Activity className="h-3.5 w-3.5" />
              FLIGHT SIMULATOR LAB
            </span>
            <span className="text-xs text-text-secondary font-mono">Sandbox: $10,000 Capital</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Master Extreme Market Volatility
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            Over 90% of account liquidations occur during black-swan events. Step into the cockpit of historical crashes and squeezes, stress-test your leverage, and build true risk resilience without risking real capital.
          </p>

          <div className="flex items-center gap-6 text-xs text-text-secondary font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-profit" />
              <span>Isolated Sandbox</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#F59E0B]" />
              <span>Speed Warp: 0.5x–10x</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#06B6D4]" />
              <span>Survival Scorecards</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Historical Black-Swan Scenarios</h2>
            <p className="text-xs text-text-secondary">Select an authentic event to begin your flight</p>
          </div>
          <span className="text-xs font-mono text-text-secondary">{SCENARIOS.length} Missions Available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCENARIOS.map(sc => (
            <ScenarioCard key={sc.id} scenario={sc} onSelect={() => selectScenario(sc)} />
          ))}
        </div>
      </div>
    </div>
  );
}
