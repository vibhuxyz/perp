import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MARKET } from '@/app/config';
import { fetchDepth } from '@/features/trade/api/tradeApi';
import { useMarketStore } from '@/stores/market.store';
import { MarketTickerHeader } from '@/features/trade/components/MarketTickerHeader';
import { ChartPanel } from '@/features/trade/components/ChartPanel';
import { PositionsPanel } from '@/features/trade/components/PositionsPanel';
import { OrderBook } from '@/features/trade/components/OrderBook';
import { OrderTicket } from '@/features/trade/components/OrderTicket';

export default function TradePage() {
  const indexPrice = useMarketStore(s => s.indexPrice);
  const setBook = useMarketStore(s => s.setBook);
  const setIndexPrice = useMarketStore(s => s.setIndexPrice);
  const setLastTradePrice = useMarketStore(s => s.setLastTradePrice);

  // Poll depth until WebSocket broadcasts the book (Day 1 / GOOD rung)
  const { data: depth } = useQuery({
    queryKey: ['depth', MARKET],
    queryFn: () => fetchDepth(MARKET),
    refetchInterval: 1_000,
    retry: false,
  });

  useEffect(() => {
    if (depth) {
      if (depth.bids && depth.asks) {
        setBook(depth.bids, depth.asks);
      }
      if (depth.indexPrice) {
        setIndexPrice(depth.indexPrice);
      }
      if (depth.lastTradePrice) {
        setLastTradePrice(depth.lastTradePrice);
      }
    }
  }, [depth, setBook, setIndexPrice, setLastTradePrice]);

  return (
    <div className="flex flex-col h-full w-full min-h-0 min-w-0 overflow-hidden bg-[#0A0D14]">
      {/* 1. Market Ticker Header Bar */}
      <MarketTickerHeader />

      {/* 2. Main Trading Workspace */}
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* Left/Center Area: Top [Chart + OrderBook] & Bottom [PositionsPanel spanning both] */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto scrollbar-thin p-3 gap-3">
          {/* Top Row: Chart & OrderBook side-by-side with fixed height */}
          <div className="flex gap-3 h-[480px] shrink-0">
            {/* Chart takes remaining flexible width */}
            <div className="flex-1 min-w-0 h-full">
              <ChartPanel />
            </div>

            {/* OrderBook has fixed width matching screenshot */}
            <div className="w-[320px] shrink-0 h-full">
              <OrderBook />
            </div>
          </div>

          {/* Bottom Section: Positions & Orders Table taking full width of Chart + OrderBook */}
          <div className="w-full">
            <PositionsPanel />
          </div>
        </div>

        {/* Right Column: Order Ticket (Fixed width, full height) */}
        <div className="w-[320px] shrink-0 flex flex-col min-h-0 p-3 pl-0 overflow-y-auto scrollbar-thin">
          <OrderTicket indexPrice={indexPrice} />
        </div>
      </div>
    </div>
  );
}
