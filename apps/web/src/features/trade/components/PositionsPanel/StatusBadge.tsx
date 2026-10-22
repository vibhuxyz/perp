import { Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  filledQuantity?: string;
  quantity?: string;
  error?: string;
}

const BADGE_CONFIG: Record<string, { cls: string; label: string }> = {
  Accepted: { cls: 'bg-[#00DA8E]/10 text-[#00DA8E] border-[#00DA8E]/20', label: 'Resting' },
  resting: { cls: 'bg-[#00DA8E]/10 text-[#00DA8E] border-[#00DA8E]/20', label: 'Resting' },
  Filled: { cls: 'bg-[#00F29D]/15 text-[#00F29D] border-[#00F29D]/30', label: 'Filled' },
  filled: { cls: 'bg-[#00F29D]/15 text-[#00F29D] border-[#00F29D]/30', label: 'Filled' },
  PartiallyFilled: { cls: 'bg-warning/15 text-warning border-warning/30', label: 'Partial' },
  partially_filled: { cls: 'bg-warning/15 text-warning border-warning/30', label: 'Partial' },
};

function getBadgeConfig(status: string) {
  return BADGE_CONFIG[status] ?? { cls: 'bg-loss/10 text-loss border-loss/20', label: 'Rejected' };
}

export function StatusBadge({ status, filledQuantity, quantity, error }: StatusBadgeProps) {
  if (status === 'Submitting') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-info/10 text-info border border-info/20 animate-pulse">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        <span>Submitting</span>
      </span>
    );
  }

  const { cls, label } = getBadgeConfig(status);
  const isPartial = label === 'Partial';
  const detail = isPartial && filledQuantity && quantity ? ` (${filledQuantity}/${quantity})` : '';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`} title={error}>
      {label}{detail}
    </span>
  );
}
