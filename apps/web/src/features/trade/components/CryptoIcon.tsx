export function BtcIcon({ className = 'h-full w-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        d="M22.28 14.28c.32-2.14-1.31-3.29-3.55-4.06l.72-2.9-1.76-.44-.7 2.82c-.46-.11-.94-.22-1.42-.33l.71-2.85-1.77-.44-.72 2.9c-.39-.09-.77-.18-1.14-.27l-2.44-.61-.47 1.89s1.31.3 1.28.32c.72.18.85.66.83 1.04l-.83 3.33c.05.01.11.03.18.06l-.18-.04-1.16 4.67c-.09.22-.31.55-.82.42.02.03-1.28-.32-1.28-.32l-.88 2.03 2.3.57c.43.11.85.22 1.27.32l-.73 2.94 1.76.44.72-2.9c.48.13.95.25 1.41.36l-.72 2.87 1.77.44.73-2.92c3.02.57 5.29.34 6.25-2.39.77-2.2-.04-3.47-1.63-4.3 1.16-.27 2.03-1.03 2.27-2.61zm-4.05 5.69c-.55 2.2-4.27 1.01-5.47.71l.98-3.91c1.2.3 5.06.89 4.49 3.2zm.55-5.73c-.5 2.01-3.6.99-4.6.74l.88-3.55c1 .25 4.23.72 3.72 2.81z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function EthIcon({ className = 'h-full w-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <g fill="#FFFFFF">
        <path d="M16 4L15.8 4.7V20.3l.2.2 7.4-4.4L16 4z" fillOpacity="0.7" />
        <path d="M16 4L8.6 16.1l7.4 4.4V4z" />
        <path d="M16 21.6l-.1.1v6.1l.1.3 7.4-10.3-7.4 3.8z" fillOpacity="0.7" />
        <path d="M16 28.1V21.6L8.6 17.8 16 28.1z" />
        <path d="M16 20.3l7.4-4.2L16 12.8v7.5z" fillOpacity="0.3" />
        <path d="M8.6 16.1l7.4 4.2v-7.5l-7.4 3.3z" fillOpacity="0.5" />
      </g>
    </svg>
  );
}

export function SolIcon({ className = 'h-full w-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#141724" stroke="#252D42" strokeWidth="1" />
      <defs>
        <linearGradient id="sol-grad-1" x1="6" y1="9" x2="26" y2="9" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient id="sol-grad-2" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient id="sol-grad-3" x1="6" y1="23" x2="26" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <path
        d="M9.1 7.2a1 1 0 0 1 .7-.3h15.4c.4 0 .7.5.4.8l-2.7 2.7a1 1 0 0 1-.7.3H6.8c-.4 0-.7-.5-.4-.8l2.7-2.7z"
        fill="url(#sol-grad-1)"
      />
      <path
        d="M22.9 14.2a1 1 0 0 1 .7.3l2.7 2.7c.3.3.1.8-.4.8H10.5a1 1 0 0 1-.7-.3l-2.7-2.7c-.3-.3-.1-.8.4-.8h15.4z"
        fill="url(#sol-grad-2)"
      />
      <path
        d="M9.1 21.2a1 1 0 0 1 .7-.3h15.4c.4 0 .7.5.4.8l-2.7 2.7a1 1 0 0 1-.7.3H6.8c-.4 0-.7-.5-.4-.8l2.7-2.7z"
        fill="url(#sol-grad-3)"
      />
    </svg>
  );
}

export function MarketIcon({
  symbol,
  className = 'h-8 w-8',
}: {
  symbol: string;
  className?: string;
}) {
  const clean = symbol.replace(/-PERP$/i, '').toUpperCase();
  if (clean === 'ETH') return <div className={`shrink-0 ${className}`}><EthIcon /></div>;
  if (clean === 'SOL') return <div className={`shrink-0 ${className}`}><SolIcon /></div>;
  return <div className={`shrink-0 ${className}`}><BtcIcon /></div>;
}
