import { useState } from 'react';
import { useMarketStore, MARKET_DETAILS } from '@/stores/market.store';
import { Tabs } from './Tabs';
import { TradesView } from './TradesView';
import { BookView } from './BookView';

export function OrderBook() {
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');
  const currentMarket = useMarketStore(s => s.currentMarket);
  const baseAsset = MARKET_DETAILS[currentMarket]?.baseAsset ?? 'BTC';
  const realTrades = useMarketStore(s => s.trades);

  return (
    <div className="flex flex-col h-full bg-bg-card rounded-xl border border-border-subtle overflow-hidden select-none">
      <Tabs activeTab={activeTab} tradeCount={realTrades.length} onSelect={setActiveTab} />
      {activeTab === 'book' ? <BookView baseAsset={baseAsset} /> : <TradesView trades={realTrades} />}
    </div>
  );
}
