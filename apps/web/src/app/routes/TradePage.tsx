import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDepth, fetchTrades, type Depth } from '@/features/trade/api/tradeApi';
import { useMarketStore, type Level, type Trade } from '@/stores/market.store';
import { MarketTickerHeader } from '@/features/trade/components/MarketTickerHeader';
import { ChartPanel } from '@/features/trade/components/ChartPanel';
import { PositionsPanel } from '@/features/trade/components/PositionsPanel';
import { OrderBook } from '@/features/trade/components/OrderBook';
import { OrderTicket } from '@/features/trade/components/OrderTicket';

function syncDepthToStore(
  depth: Depth | undefined,
  setBook: (bids: Level[], asks: Level[]) => void,
  setIndexPrice: (p: string) => void,
  setLastTradePrice: (p: string) => void,
) {
  if (!depth) return;
  if (depth.bids && depth.asks) setBook(depth.bids, depth.asks);
  if (depth.indexPrice) setIndexPrice(depth.indexPrice);
  if (depth.lastTradePrice) setLastTradePrice(depth.lastTradePrice);
}

function mapTrades(trades: Array<{ fillId: string; price: string; quantity: string; side: string; createdAt: string }>): Trade[] {
  return trades.map(t => {
    const d = new Date(t.createdAt);
    const time = isNaN(d.getTime())
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      id: t.fillId,
      price: t.price,
      size: t.quantity,
      time,
      isUp: t.side === 'BUY',
    };
  });
}

export default function TradePage() {
  const currentMarket = useMarketStore(s => s.currentMarket);
  const indexPrice = useMarketStore(s => s.indexPrice);
  const setBook = useMarketStore(s => s.setBook);
  const setIndexPrice = useMarketStore(s => s.setIndexPrice);
  const setLastTradePrice = useMarketStore(s => s.setLastTradePrice);
  const setTrades = useMarketStore(s => s.setTrades);

  const { data: depth } = useQuery({
    queryKey: ['depth', currentMarket],
    queryFn: () => fetchDepth(currentMarket),
    refetchInterval: 1_000,
    retry: false,
  });

  const { data: tradesResponse } = useQuery({
    queryKey: ['trades', currentMarket],
    queryFn: () => fetchTrades(currentMarket),
    refetchInterval: 2_000,
    retry: false,
  });

  useEffect(() => {
    syncDepthToStore(depth, setBook, setIndexPrice, setLastTradePrice);
  }, [depth, setBook, setIndexPrice, setLastTradePrice]);

  useEffect(() => {
    if (tradesResponse?.trades && tradesResponse.trades.length > 0) {
      setTrades(mapTrades(tradesResponse.trades));
    }
  }, [tradesResponse, setTrades]);

  return (
    <div className="flex flex-col h-full w-full min-h-0 min-w-0 overflow-hidden bg-[#0A0D14]">
      <MarketTickerHeader />

      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto scrollbar-thin p-3 gap-3">
          <div className="flex gap-3 h-[480px] shrink-0">
            <div className="flex-1 min-w-0 h-full">
              <ChartPanel />
            </div>

            <div className="w-[260px] shrink-0 h-full">
              <OrderBook />
            </div>
          </div>

          <div className="w-full">
            <PositionsPanel />
          </div>
        </div>

        <div className="w-[420px] shrink-0 flex flex-col min-h-0 p-3 pl-0 overflow-y-auto scrollbar-thin">
          <OrderTicket indexPrice={indexPrice} />
        </div>
      </div>
    </div>
  );
}
