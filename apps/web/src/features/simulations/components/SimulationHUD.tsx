import { AlertTriangle, Clock, TrendingDown, TrendingUp, ShieldCheck } from 'lucide-react';
import type { SandboxPosition } from '../types';
import { useSimulationStore } from '../useSimulationStore';
import { getInterpolatedPoint } from '../simulationEngine';

const formatClock = (m: number, s: number) =>
  `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

function PositionHud({ position, currentPrice }: { position: SandboxPosition | null; currentPrice: number }) {
  if (!position) {
    return (
      <div className="flex items-center gap-1.5 text-text-secondary bg-[#111728] border border-border-subtle/40 px-2.5 py-1 rounded-lg">
        <ShieldCheck className="h-3.5 w-3.5 text-profit" />
        <span className="text-[11px]">No Open Exposure</span>
      </div>
    );
  }

  const liqDistancePct = Math.abs(((currentPrice - position.liquidationPrice) / currentPrice) * 100);
  const colorClass = liqDistancePct < 5 ? 'text-loss' : liqDistancePct < 15 ? 'text-[#F59E0B]' : 'text-profit';

  return (
    <div className="flex items-center gap-3 bg-[#111728] border border-border-subtle/80 px-3 py-1 rounded-lg">
      <div>
        <span className="text-[9px] text-text-secondary block">POSITION</span>
        <span className={`font-bold ${position.side === 'LONG' ? 'text-profit' : 'text-loss'}`}>
          {position.side} {position.leverage}x
        </span>
      </div>
      <div>
        <span className="text-[9px] text-text-secondary block">UNREALIZED PNL</span>
        <span className={`font-bold ${position.unrealizedPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
          {position.unrealizedPnL >= 0 ? `+$${position.unrealizedPnL.toFixed(2)}` : `-$${Math.abs(position.unrealizedPnL).toFixed(2)}`}
        </span>
      </div>
      <div>
        <span className="text-[9px] text-text-secondary block">LIQ DISTANCE</span>
        <div className="flex items-center gap-1">
          {liqDistancePct < 5 && <AlertTriangle className="h-3 w-3 text-loss animate-pulse" />}
          <span className={`font-bold ${colorClass}`}>{liqDistancePct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

export function SimulationHUD() {
  const scenario = useSimulationStore(s => s.activeScenario);
  const currentTimeSec = useSimulationStore(s => s.currentTimeSec);
  const position = useSimulationStore(s => s.position);
  const balance = useSimulationStore(s => s.balance);

  if (!scenario) return null;

  const currentPt = getInterpolatedPoint(scenario.points, currentTimeSec);
  const priceChangePct = ((currentPt.price - scenario.initialPrice) / scenario.initialPrice) * 100;
  const isUp = priceChangePct >= 0;

  const totalMin = Math.floor(scenario.durationSeconds / 60);
  const totalSec = scenario.durationSeconds % 60;
  const curMin = Math.floor(currentTimeSec / 60);
  const curSec = Math.floor(currentTimeSec % 60);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0C101A] border-b border-border-subtle text-xs select-none">
      <div className="flex items-center gap-4">
        <div>
          <span className="text-[10px] text-text-secondary font-mono block">MISSION</span>
          <span className="font-bold text-white">{scenario.title}</span>
        </div>

        <div className="h-6 w-px bg-border-subtle" />

        <div className="font-mono">
          <span className="text-[10px] text-text-secondary block">MARK PRICE</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">${currentPt.price.toLocaleString()}</span>
            <span className={`text-[11px] flex items-center ${isUp ? 'text-profit' : 'text-loss'}`}>
              {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {priceChangePct > 0 ? `+${priceChangePct.toFixed(1)}%` : `${priceChangePct.toFixed(1)}%`}
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-border-subtle" />

        <div className="font-mono">
          <span className="text-[10px] text-text-secondary block">TIMELINE</span>
          <div className="flex items-center gap-1 text-white font-bold">
            <Clock className="h-3 w-3 text-text-secondary" />
            <span>
              {formatClock(curMin, curSec)} / {formatClock(totalMin, totalSec)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 font-mono">
        <PositionHud position={position} currentPrice={currentPt.price} />

        <div className="bg-[#111728] border border-border-subtle px-3 py-1 rounded-lg">
          <span className="text-[9px] text-text-secondary block">SANDBOX BALANCE</span>
          <span className="font-bold text-white">${balance.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
