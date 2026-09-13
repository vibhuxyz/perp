import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPositions, closePosition } from '@/features/trade/api/tradeApi';
import { useMarketStore } from '@/stores/market.store';
import { useAccountStore } from '@/stores/account.store';
import { unrealisedPnl } from '@/shared/lib/decimal';
import { formatPrice, formatSigned } from '@/shared/lib/formatters';
import { MoreHorizontal, ArrowUpDown, ChevronRight } from 'lucide-react';
import { AuthModal } from '@/features/auth/AuthModal';
import Decimal from 'decimal.js';

const TABS = [
  { id: 'positions',    label: 'Positions' },
  { id: 'orders',       label: 'Open Orders' },
  { id: 'borrows',      label: 'Borrows' },
  { id: 'twap',         label: 'TWAP' },
  { id: 'fills',        label: 'Fill History' },
  { id: 'orderHistory', label: 'Order History' },
  { id: 'posHistory',   label: 'Position History' },
] as const;

export function PositionsPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('positions');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const queryClient = useQueryClient();
  const token = useAccountStore(s => s.token);
  const markPrice = useMarketStore(s => s.indexPrice);

  const isAuthenticated = Boolean(token);

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ['positions', token],
    queryFn: fetchPositions,
    enabled: isAuthenticated,
    refetchInterval: 2_000,
    retry: false,
  });

  const closeMutation = useMutation({
    mutationFn: (market: string) => closePosition(market),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['equity'] });
      queryClient.invalidateQueries({ queryKey: ['depth'] });
    },
  });

  const handleOpenAuth = (signUp: boolean) => {
    if (signUp) {
      navigate('/register');
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <>
      <div className="flex flex-col bg-[#0E121B] rounded-xl border border-[#1A2333] overflow-hidden select-none">
        {/* Tab Navigation Header */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#1A2333] px-3 bg-[#0E121B]">
          {/* Scrollable Tabs row */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                  activeTab === tab.id
                    ? 'bg-[#181F2E] text-white border border-[#26344B] font-bold shadow-xs'
                    : 'text-[#8492A6] hover:text-white',
                ].join(' ')}
              >
                {tab.label}
                {tab.id === 'positions' && positions.length > 0 && ` (${positions.length})`}
              </button>
            ))}
          </div>

          {/* Right Chevron */}
          <div className="flex items-center pl-2 shrink-0">
            <button
              type="button"
              className="p-1 text-[#8492A6] hover:text-white transition-colors cursor-pointer"
              title="Next tabs"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!isAuthenticated ? (
          /* Signed Out State */
          <div className="flex h-48 items-center justify-center text-center p-6 bg-[#0B0E15]">
            <p className="text-sm font-medium text-white select-text">
              Please{' '}
              <button
                type="button"
                onClick={() => handleOpenAuth(false)}
                className="text-[#7152FF] hover:underline font-semibold cursor-pointer"
              >
                log in
              </button>{' '}
              or{' '}
              <button
                type="button"
                onClick={() => handleOpenAuth(true)}
                className="text-[#7152FF] hover:underline font-semibold cursor-pointer"
              >
                sign up
              </button>{' '}
              first
            </p>
          </div>
        ) : (
          /* Authenticated State */
          <div className="overflow-x-auto scrollbar-thin">
            {activeTab === 'positions' ? (
              positions.length > 0 ? (
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1A2333] text-[#8492A6] text-[11px] font-medium font-sans">
                      <th className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <span>Market</span>
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </div>
                      </th>
                      <th className="px-3 py-2.5">Side</th>
                      <th className="px-3 py-2.5">Size</th>
                      <th className="px-3 py-2.5">Entry Price</th>
                      <th className="px-3 py-2.5">Mark Price</th>
                      <th className="px-3 py-2.5">Liq. Price</th>
                      <th className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <span>Unrealized PnL</span>
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </div>
                      </th>
                      <th className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <span>ROE</span>
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </div>
                      </th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos, idx) => {
                      const currentMark = markPrice ?? pos.averagePrice;
                      const pnl = unrealisedPnl(pos.side, pos.averagePrice, currentMark, pos.quantity);
                      const isLong = pos.side === 'LONG';
                      const pnlTone = pnl.isPositive() ? 'profit' : pnl.isNegative() ? 'loss' : 'flat';

                      let roe = '+0.0%';
                      try {
                        const marginDec = new Decimal(pos.margin);
                        if (marginDec.gt(0)) {
                          const roeDec = pnl.div(marginDec).times(100);
                          roe = `${roeDec.gte(0) ? '+' : ''}${roeDec.toFixed(1)}%`;
                        }
                      } catch {
                        roe = '+0.0%';
                      }

                      return (
                        <tr
                          key={`${pos.market}-${idx}`}
                          className="border-b border-[#1A2333]/50 hover:bg-[#131824]/50 transition-colors"
                        >
                          {/* Market */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F7931A] text-white">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M15.76 10.42c.31-.92.1-1.97-.56-2.61-.75-.73-1.89-.96-3.15-.98V5h-1.5v1.8H9.3V5H7.8v1.8H5.5v1.5h1.25c.34 0 .5.16.5.5v8.4c0 .34-.16.5-.5.5H5.5v1.5h2.3V22h1.5v-1.8h1.25V22h1.5v-1.8c2.4-.04 4.2-.7 4.57-2.6.28-1.46-.42-2.52-1.61-3.08 1.05-.48 1.68-1.45 1.55-4.1zm-4.71-2.22c1.4.02 2.6.35 2.6 1.7 0 1.25-1.07 1.6-2.6 1.6H9.3V8.2h1.75zm.35 9.1H9.3v-3.7h1.9c1.6 0 2.8.38 2.8 1.85 0 1.35-1.12 1.85-2.6 1.85z"/>
                                </svg>
                              </div>
                              <span className="font-bold text-white font-sans text-xs">{pos.market}</span>
                            </div>
                          </td>

                          {/* Side */}
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                isLong
                                  ? 'bg-[#00F29D]/15 text-[#00F29D]'
                                  : 'bg-[#FF4D5A]/15 text-[#FF4D5A]'
                              }`}
                            >
                              {isLong ? 'Long' : 'Short'}
                            </span>
                          </td>

                          {/* Size */}
                          <td className="px-3 py-3 text-white font-bold tabular-nums">
                            {pos.quantity} BTC
                          </td>

                          {/* Entry Price */}
                          <td className="px-3 py-3 text-white tabular-nums">
                            ${formatPrice(pos.averagePrice)}
                          </td>

                          {/* Mark Price */}
                          <td className="px-3 py-3 text-white tabular-nums">
                            ${formatPrice(currentMark)}
                          </td>

                          {/* Liq. Price */}
                          <td className="px-3 py-3 text-[#FF4D5A] font-bold tabular-nums">
                            ${formatPrice(pos.liquidationPrice)}
                          </td>

                          {/* Unrealized PnL */}
                          <td
                            className={`px-3 py-3 font-bold tabular-nums ${
                              pnlTone === 'profit'
                                ? 'text-[#00F29D]'
                                : pnlTone === 'loss'
                                ? 'text-[#FF4D5A]'
                                : 'text-[#8492A6]'
                            }`}
                          >
                            {formatSigned(pnl)} USD
                          </td>

                          {/* ROE */}
                          <td
                            className={`px-3 py-3 font-bold tabular-nums ${
                              pnlTone === 'profit'
                                ? 'text-[#00F29D]'
                                : pnlTone === 'loss'
                                ? 'text-[#FF4D5A]'
                                : 'text-[#8492A6]'
                            }`}
                          >
                            {roe}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 font-sans">
                              <button
                                type="button"
                                disabled={closeMutation.isPending}
                                onClick={() => closeMutation.mutate(pos.market)}
                                className="rounded-lg bg-[#182132] hover:bg-[#FF4D5A]/20 hover:text-[#FF4D5A] border border-[#233047] px-2.5 py-1 text-xs text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {closeMutation.isPending ? 'Closing…' : 'Close'}
                              </button>
                              <button
                                type="button"
                                className="rounded-lg bg-[#182132] hover:bg-[#222E44] border border-[#233047] p-1 text-[#8492A6] hover:text-white transition-colors cursor-pointer"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-center text-[#8492A6] text-xs gap-1.5">
                  {isLoading ? (
                    <span>Loading positions…</span>
                  ) : (
                    <>
                      <span className="font-semibold text-white">No open positions</span>
                      <span className="text-[11px]">Use the order panel to place a limit or market order.</span>
                    </>
                  )}
                </div>
              )
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center text-[#8492A6] text-xs">
                <span>No records found for {TABS.find(t => t.id === activeTab)?.label ?? 'this tab'}.</span>
              </div>
            )}
          </div>
        )}
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
}
