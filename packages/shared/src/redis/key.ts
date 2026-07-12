export const KEYS = {
  balance: (userId: string) => `balance:${userId}`,
  positions: (userId: string) => `positions:${userId}`,
  orderbook: (symbol: string) => `orderbook:${symbol}`,
  ticker: (symbol: string) => `ticker:${symbol}`,
  markPrice: (symbol: string) => `markprice:${symbol}`,
  userChannel: (userId: string) => `user:${userId}`,
  marketChannel: (symbol: string) => `market:${symbol}`,
};
