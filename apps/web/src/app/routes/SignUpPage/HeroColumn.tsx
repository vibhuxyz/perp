import { TrendingUp, Percent, Scale } from 'lucide-react';

export function HeroColumn() {
  return (
    <div className="flex flex-col justify-between py-6">
      <div>
        <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-[1.12] mb-12">
          Every market.
          <br />
          One account.
        </h1>

        <div className="space-y-7">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#141924] border border-[#202738] text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5v4" />
                <rect width="4" height="6" x="7" y="9" rx="1" />
                <path d="M9 15v4" />
                <path d="M17 3v2" />
                <rect width="4" height="8" x="15" y="5" rx="1" />
                <path d="M17 13v8" />
              </svg>
            </div>
            <span className="text-base font-semibold text-white">Crypto spot and perps</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#141924] border border-[#202738] text-white">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-semibold text-white">Thousands of real US stocks</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#141924] border border-[#202738] text-white">
              <Percent className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-semibold text-white">Yield on your assets</span>
          </div>
        </div>
      </div>

      <div className="pt-16 lg:pt-24">
        <button type="button" className="flex items-center gap-2 text-xs text-text-secondary hover:text-white transition-colors cursor-pointer">
          <Scale className="h-4 w-4" />
          <span>Daily proof of reserves ↗</span>
        </button>
      </div>
    </div>
  );
}
