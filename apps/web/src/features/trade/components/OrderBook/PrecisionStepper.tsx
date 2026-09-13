import { Minus, Plus } from 'lucide-react';

export function PrecisionStepper({
  precision,
  onStepDown,
  onStepUp,
}: {
  precision: string;
  onStepDown: () => void;
  onStepUp: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#1E283C] bg-[#121824] px-2 py-0.5 text-xs text-white font-mono">
      <button
        type="button"
        onClick={onStepDown}
        className="text-text-secondary hover:text-white transition-colors cursor-pointer"
        title="Decrease tick size"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="font-bold tabular-nums min-w-6 text-center">{precision}</span>
      <button
        type="button"
        onClick={onStepUp}
        className="text-text-secondary hover:text-white transition-colors cursor-pointer"
        title="Increase tick size"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
