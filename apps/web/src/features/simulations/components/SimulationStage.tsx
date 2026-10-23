import { useEffect } from 'react';
import { useSimulationStore } from '../useSimulationStore';
import { SimulationHUD } from './SimulationHUD';
import { SimulationChart } from './SimulationChart';
import { SimulationOrderTicket } from './SimulationOrderTicket';
import { SimulationControls } from './SimulationControls';
import { SimulationScorecard } from './SimulationScorecard';

export function SimulationStage() {
  const status = useSimulationStore(s => s.status);
  const playbackSpeed = useSimulationStore(s => s.playbackSpeed);
  const tick = useSimulationStore(s => s.tick);

  useEffect(() => {
    if (status !== 'playing') return;

    const intervalMs = 250;
    const deltaSec = 0.25 * playbackSpeed;

    const timer = setInterval(() => {
      tick(deltaSec);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [status, playbackSpeed, tick]);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-[#0A0D14] overflow-hidden relative">
      <SimulationHUD />

      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        <SimulationChart />
        <SimulationOrderTicket />
      </div>

      <SimulationControls />
      <SimulationScorecard />
    </div>
  );
}
