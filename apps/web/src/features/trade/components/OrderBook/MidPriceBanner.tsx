export function MidPriceBanner({ midPrice, markPriceDisplay }: { midPrice: string; markPriceDisplay: string }) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-between px-3 border-y border-border-subtle bg-bg-card font-mono">
      <span className="text-base font-extrabold text-profit tabular-nums tracking-tight">
        {midPrice !== '—' ? `$${midPrice}` : '—'}
      </span>
      <span className="text-xs text-text-secondary tabular-nums font-medium">
        {markPriceDisplay !== '—' ? `Mark: $${markPriceDisplay}` : '—'}
      </span>
    </div>
  );
}
