import { Play, Pause, RotateCcw, ArrowLeft, FastForward } from 'lucide-react';
import { useSimulationStore } from '../useSimulationStore';

const SPEEDS = [0.5, 1, 2, 5, 10] as const;

export function SimulationControls() {
  const status = useSimulationStore(s => s.status);
  const activeScenario = useSimulationStore(s => s.activeScenario);
  const currentTimeSec = useSimulationStore(s => s.currentTimeSec);
  const playbackSpeed = useSimulationStore(s => s.playbackSpeed);
  const togglePlay = useSimulationStore(s => s.togglePlay);
  const setSpeed = useSimulationStore(s => s.setSpeed);
  const seek = useSimulationStore(s => s.seek);
  const resetSimulation = useSimulationStore(s => s.resetSimulation);
  const exitToCatalog = useSimulationStore(s => s.exitToCatalog);

  if (!activeScenario) return null;

  const isPlaying = status === 'playing';
  const progressPct = Math.min(100, (currentTimeSec / activeScenario.durationSeconds) * 100);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-[#0C101A] border-t border-border-subtle text-xs select-none">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={exitToCatalog}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-subtle bg-[#121826] hover:bg-[#1A2234] text-text-secondary hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit Flight</span>
        </button>

        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-bg-primary font-bold transition-all shadow-md shadow-primary/20 cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{currentTimeSec === 0 ? 'Start Flight' : 'Resume'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={resetSimulation}
          className="p-1.5 rounded-lg border border-border-subtle bg-[#121826] hover:bg-[#1A2234] text-text-secondary hover:text-white transition-colors cursor-pointer"
          title="Restart Simulation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 max-w-xl flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={activeScenario.durationSeconds}
          step={0.5}
          value={currentTimeSec}
          onChange={e => seek(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[#1A2336] rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <span className="font-mono text-[11px] text-text-secondary shrink-0 w-12 text-right">
          {progressPct.toFixed(0)}%
        </span>
      </div>

      <div className="flex items-center gap-1 font-mono">
        <FastForward className="h-3.5 w-3.5 text-text-secondary mr-1" />
        {SPEEDS.map(spd => (
          <button
            key={spd}
            type="button"
            onClick={() => setSpeed(spd)}
            className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              playbackSpeed === spd
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            {spd}x
          </button>
        ))}
      </div>
    </div>
  );
}
