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

      {/* 2. Main 3-Column Trading Workspace */}
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* Column 1: Chart & Positions (Grows & scrollable independently) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto scrollbar-thin p-3 gap-3">
          {/* Chart Panel with toolbar & controls */}
          <ChartPanel />

          {/* Positions & Orders Tabs Table */}
          <PositionsPanel />
        </div>

        {/* Column 2: Order Book & Recent Trades (Fixed width, independently scrollable) */}
        <div className="w-[320px] shrink-0 flex flex-col min-h-0 p-3 pl-0">
          <OrderBook />
        </div>

        {/* Column 3: Order Ticket / Entry Form (Fixed width, independently scrollable) */}
        <div className="w-[320px] shrink-0 flex flex-col min-h-0 p-3 pl-0">
          <OrderTicket indexPrice={indexPrice} />
        </div>
      </div>
    </div>
  );
}
