export const MARKET_PARTITIONS: Record<string, number> = {
  "BTC-PERP": 0,
  "ETH-PERP": 1,
  "SOL-PERP": 2,
};

export function getMarketPartition(market: string, totalPartitions = 3): number {
  const direct = MARKET_PARTITIONS[market];
  if (direct !== undefined) {
    return direct;
  }
  let hash = 0;
  for (let i = 0; i < market.length; i++) {
    hash = (hash * 31 + market.charCodeAt(i)) >>> 0;
  }
  return hash % totalPartitions;
}
