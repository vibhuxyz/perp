function buttonColor(isAuthenticated: boolean, isLong: boolean) {
  if (!isAuthenticated) return 'bg-[#7152FF] hover:bg-[#6042EE] text-white shadow-[#7152FF]/25';
  return isLong
    ? 'bg-[#00DA8E] hover:bg-[#00C57F] text-black shadow-md shadow-[#00DA8E]/20'
    : 'bg-[#FF4D5A] hover:bg-[#EE404D] text-white shadow-md shadow-[#FF4D5A]/20';
}

function buttonLabel(isPending: boolean, isAuthenticated: boolean, isLong: boolean) {
  if (isPending) return 'Submitting…';
  if (!isAuthenticated) return 'Log in to trade';
  return isLong ? 'Open Long (Demo)' : 'Open Short (Demo)';
}

export function SubmitButton({
  isAuthenticated,
  isLong,
  isPending,
  displayQuantity,
  onClick,
}: {
  isAuthenticated: boolean;
  isLong: boolean;
  isPending: boolean;
  displayQuantity: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-auto pt-2">
      <button
        type="button"
        disabled={isPending}
        onClick={onClick}
        className={[
          'w-full rounded-xl py-2.5 px-4 flex flex-col items-center justify-center transition-all cursor-pointer font-sans shadow-lg',
          buttonColor(isAuthenticated, isLong),
          isPending ? 'opacity-70 pointer-events-none' : '',
        ].join(' ')}
      >
        <span className="text-sm font-bold leading-tight">{buttonLabel(isPending, isAuthenticated, isLong)}</span>
        {isAuthenticated && Number(displayQuantity) > 0 && (
          <span className="text-xs font-medium opacity-80 font-mono leading-tight mt-0.5">
            ≈ {displayQuantity} BTC
          </span>
        )}
      </button>
    </div>
  );
}
