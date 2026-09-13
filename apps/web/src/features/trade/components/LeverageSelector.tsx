import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

interface LeverageSelectorProps {
  leverage: string;
  onChange: (value: string) => void;
}

const RISK_LEVELS = [
  { max: 5,   label: "Low risk" },
  { max: 20,  label: "Moderate" },
  { max: 50,  label: "High risk" },
  { max: 100, label: "Extreme" },
];

function getRiskLabel(lev: number) {
  return RISK_LEVELS.find(r => lev <= r.max)?.label ?? "Extreme";
}

function getRiskColor(lev: number) {
  if (lev <= 5)  return "text-profit";
  if (lev <= 20) return "text-info";
  if (lev <= 50) return "text-warning";
  return "text-loss";
}

export function LeverageSelector({ leverage, onChange }: LeverageSelectorProps) {
  const numericValue = Number(leverage) || 1;
  const riskLabel    = getRiskLabel(numericValue);
  const riskColor    = getRiskColor(numericValue);

  return (
    <div className="grid gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Label className="text-xs text-text-secondary">Leverage</Label>
          <span
            title="Higher leverage amplifies both gains and losses. Beginners should start at 1x–5x."
            className="cursor-help"
          >
            <Info className="h-3 w-3 text-text-secondary/60" aria-label="Leverage explanation" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium ${riskColor}`}>{riskLabel}</span>
          <span className="text-xs font-bold tabular-nums text-text-primary">{leverage}×</span>
        </div>
      </div>

      <Slider
        value={[numericValue]}
        min={1}
        max={100}
        step={1}
        onValueChange={val => val[0] !== undefined && onChange(val[0].toString())}
        className="w-full"
        aria-label={`Leverage: ${leverage}x`}
        aria-valuemin={1}
        aria-valuemax={100}
        aria-valuenow={numericValue}
        aria-valuetext={`${leverage}x leverage — ${riskLabel}`}
      />

      {/* Quick-select presets */}
      <div className="flex gap-1.5">
        {[1, 5, 10, 25, 50].map(preset => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset.toString())}
            className={[
              "flex-1 rounded py-1 text-[10px] font-medium transition-colors",
              numericValue === preset
                ? "bg-brand/20 text-brand"
                : "bg-bg-elevated text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            {preset}×
          </button>
        ))}
      </div>

      {numericValue >= 20 && (
        <p className="text-[11px] text-warning leading-snug">
          Higher leverage increases your liquidation risk significantly.
          {numericValue >= 50 && " Extreme leverage is not recommended for beginners."}
        </p>
      )}
    </div>
  );
}
