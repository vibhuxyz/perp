import { PRESET_AMOUNTS } from './constants';

export function AmountPresets({ amount, onSelect }: { amount: string; onSelect: (preset: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2.5 mb-4">
      {PRESET_AMOUNTS.map(preset => (
        <button
          key={preset}
          type="button"
          onClick={() => onSelect(preset)}
          className={[
            'rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer border text-center',
            amount === preset
              ? 'bg-[#7152FF] text-white border-[#7152FF] shadow-md shadow-[#7152FF]/20'
              : 'bg-[#141924] text-[#8492A6] border-[#202738] hover:text-white hover:border-[#2D384E]',
          ].join(' ')}
        >
          +${Number(preset).toLocaleString()}
        </button>
      ))}
    </div>
  );
}
