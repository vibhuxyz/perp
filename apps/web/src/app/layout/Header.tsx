import { useState } from 'react';
import { MARKET } from '@/app/config';
import { formatPrice } from '@/shared/lib/formatters';
import { useMarketStore, selectBestBid, selectBestAsk } from '@/stores/market.store';
import { useConnectionStore } from '@/stores/connection.store';
import { useAccountStore } from '@/stores/account.store';
import { AuthModal } from '@/features/auth/AuthModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  LogOut,
  ChevronDown,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import Decimal from 'decimal.js';

const STATUS_CONFIG = {
  connected:    { dot: 'bg-profit', pulse: false,  label: 'Live' },
  connecting:   { dot: 'bg-warning', pulse: true,  label: 'Connecting' },
  reconnecting: { dot: 'bg-warning', pulse: true,  label: 'Reconnecting' },
  disconnected: { dot: 'bg-loss',   pulse: false,  label: 'Offline' },
} satisfies Record<string, { dot: string; pulse: boolean; label: string }>;

interface StatPillProps {
  label: string;
  value: string;
  tone?: 'profit' | 'loss' | 'warning' | 'muted';
}

function StatPill({ label, value, tone = 'muted' }: StatPillProps) {
  const valueColor = {
    profit:  'text-profit',
    loss:    'text-loss',
    warning: 'text-warning',
    muted:   'text-text-primary',
  }[tone];

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-text-secondary font-medium">{label}</span>
      <span className={`text-xs tabular-nums font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}

function Spread({ bestBid, bestAsk }: { bestBid: string | null; bestAsk: string | null }) {
  if (!bestBid || !bestAsk) return null;
  const spread = new Decimal(bestAsk).minus(bestBid).toFixed(2);
  return <StatPill label="Spread" value={`$${spread}`} />;
}

export function Header() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const lastTradePrice = useMarketStore(s => s.lastTradePrice);
  const indexPrice     = useMarketStore(s => s.indexPrice);
  const bestBid        = useMarketStore(selectBestBid);
  const bestAsk        = useMarketStore(selectBestAsk);
  const status         = useConnectionStore(s => s.status);
  const { user, token, clearToken } = useAccountStore();

  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.disconnected;

  return (
    <>
      <header className="flex items-center gap-4 border-b border-border-subtle bg-bg-card px-4 py-2.5 min-h-[48px]">
        {/* Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <FlaskConical className="h-4 w-4 text-brand" aria-hidden />
          <span className="font-bold tracking-tight text-brand text-sm">PaperTrade</span>
        </div>

        <div className="h-5 w-px bg-border-subtle" />

        {/* Market + current price — largest numeric treatment */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-text-primary">{MARKET}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tabular-nums text-text-primary leading-none">
              {formatPrice(lastTradePrice) ?? '—'}
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-border-subtle hidden sm:block" />

        {/* Market stats row */}
        <div className="hidden sm:flex items-center gap-6 text-xs">
          <StatPill label="Mark" value={`$${formatPrice(indexPrice) ?? '—'}`} />
          <StatPill label="Best bid" value={`$${formatPrice(bestBid) ?? '—'}`} tone="profit" />
          <StatPill label="Best ask" value={`$${formatPrice(bestAsk) ?? '—'}`} tone="loss" />
          <Spread bestBid={bestBid} bestAsk={bestAsk} />
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1.5" aria-live="polite" aria-label={`Market feed: ${statusConfig.label}`}>
            <div
              className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot} ${statusConfig.pulse ? 'animate-pulse' : ''}`}
            />
            <span className="text-[11px] text-text-secondary hidden sm:inline">{statusConfig.label}</span>
          </div>

          {/* Account area */}
          {token && user ? (
            <div className="flex items-center gap-2 border-l border-border-subtle pl-3">
              <Badge variant="demo">Demo</Badge>
              <div className="flex items-center gap-1 text-xs text-text-primary">
                <User className="h-3.5 w-3.5 text-text-secondary" aria-hidden />
                <span className="hidden sm:inline">{user.username ?? user.email}</span>
              </div>
              <button
                onClick={clearToken}
                title="Sign out"
                aria-label="Sign out"
                className="p-1 rounded text-text-secondary transition-colors hover:text-loss focus-visible:ring-2 focus-visible:ring-brand"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-l border-border-subtle pl-3">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Learn</span>
              </button>
              <Button
                variant="brand"
                size="sm"
                onClick={() => setIsAuthOpen(true)}
              >
                Sign in
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
