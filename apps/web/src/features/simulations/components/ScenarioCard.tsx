import { Play, Flame, ShieldAlert, Sparkles, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import type { ScenarioDefinition } from '../types';

export function ScenarioCard({
  scenario,
  onSelect,
}: {
  scenario: ScenarioDefinition;
  onSelect: () => void;
}) {
  const isDrop = scenario.points[scenario.points.length - 1]?.price ?? 0 < scenario.initialPrice;
  const minPrice = Math.min(...scenario.points.map(p => p.price));
  const maxPrice = Math.max(...scenario.points.map(p => p.price));
  const extremePrice = isDrop ? minPrice : maxPrice;
  const deltaPct = Math.round(((extremePrice - scenario.initialPrice) / scenario.initialPrice) * 100);

  const difficultyColors = {
    Beginner: 'text-[#00F29D] border-[#00F29D]/30 bg-[#00F29D]/10',
    Intermediate: 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10',
    Hardcore: 'text-[#FF4D5A] border-[#FF4D5A]/30 bg-[#FF4D5A]/10',
  }[scenario.difficulty];

  const DifficultyIcon = {
    Beginner: Sparkles,
    Intermediate: ShieldAlert,
    Hardcore: Flame,
  }[scenario.difficulty];

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border-subtle bg-[#0D121D] hover:border-[#283750] hover:bg-[#101726] p-5 transition-all shadow-md group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs text-text-secondary">{scenario.date}</span>
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${difficultyColors}`}
          >
            <DifficultyIcon className="h-3 w-3" />
            {scenario.difficulty}
          </span>
        </div>

        <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors mb-1">
          {scenario.title}
        </h3>
        <p className="text-xs text-text-secondary mb-4 line-clamp-2 leading-relaxed">
          {scenario.description}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-lg bg-[#080B12] border border-border-subtle/60 font-mono text-xs">
          <div>
            <span className="text-[10px] text-text-secondary block">START PRICE</span>
            <span className="font-bold text-white">${scenario.initialPrice.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-text-secondary block">EXTREME PEAK</span>
            <span className={`font-bold flex items-center gap-0.5 ${isDrop ? 'text-loss' : 'text-profit'}`}>
              {isDrop ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              ${extremePrice.toLocaleString()} ({deltaPct > 0 ? `+${deltaPct}` : deltaPct}%)
            </span>
          </div>
        </div>

        <div className="text-[11px] text-text-secondary border-l-2 border-primary/60 pl-2.5 py-0.5 mb-4 italic">
          <span className="font-semibold text-white not-italic">Mission: </span>
          {scenario.keyChallenge}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50">
        <span className="flex items-center gap-1.5 text-xs text-text-secondary font-mono">
          <Clock className="h-3.5 w-3.5" />
          {Math.round(scenario.durationSeconds / 60)} min flight
        </span>

        <button
          type="button"
          onClick={onSelect}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-bg-primary text-xs font-bold transition-all shadow-md shadow-primary/20 cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Launch Flight</span>
        </button>
      </div>
    </div>
  );
}
