export function SideToggle({ isLong, onSelect }: { isLong: boolean; onSelect: (side: 'LONG' | 'SHORT') => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onSelect('LONG')}
        className={[
          'py-2 rounded-lg text-sm font-bold transition-all cursor-pointer shadow-xs',
          isLong
            ? 'bg-[#00DA8E] text-white shadow-md shadow-[#00DA8E]/25'
            : 'bg-[#111724] border border-[#1C2638] text-[#8492A6] hover:text-white',
        ].join(' ')}
      >
        Long
      </button>
      <button
        type="button"
        onClick={() => onSelect('SHORT')}
        className={[
          'py-2 rounded-lg text-sm font-bold transition-all cursor-pointer shadow-xs',
          !isLong
            ? 'bg-[#FF4D5A] text-white shadow-md shadow-[#FF4D5A]/25'
            : 'bg-[#111724] border border-[#1C2638] text-[#8492A6] hover:text-white',
        ].join(' ')}
      >
        Short
      </button>
    </div>
  );
}
