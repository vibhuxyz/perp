import { redisClinet } from "./client";
import { KEYS } from "./key";

export const cacheBalance = (userId: string, balance: object) => {
  const redis = redisClinet();
  redis.set(KEYS.balance(userId), JSON.stringify(balance),"EX", 3600);
};

export const cachePositions = (userId: string, position: object) => {
  const redis = redisClinet();

  redis.set(KEYS.positions(userId), JSON.stringify(position),"EX", 3600);
};


export const cacheOrderbook = (symbol: string, book: object) => {
  const redis = redisClinet();
  redis.set(KEYS.orderbook(symbol),JSON.stringify(book), "EX",60)
}


// 5. cacheOrderbook(symbol, book)
//    - redis.set(KEYS.orderbook(symbol), JSON.stringify(book), "EX", 60)

// 6. cacheMarkPrice(symbol, price)
//    - redis.set(KEYS.markPrice(symbol), price.toString(), "EX", 60)

// 7. cacheTicker(symbol, ticker)
//    - redis.set(KEYS.ticker(symbol), JSON.stringify(ticker), "EX", 60)

// 8. publishToUser(userId, message)
//    - redis.publish(KEYS.userChannel(userId), JSON.stringify(message))

// 9. publishToMarket(symbol, message)
//    - redis.publish(KEYS.marketChannel(symbol), JSON.stringify(message))

// 10. getCachedBalance(userId)
//     - const data = await redis.get(KEYS.balance(userId))
//     - return data ? JSON.parse(data) : null

// 11. getCachedPositions(userId)
//     - same pattern

// 12. getCachedOrderbook(symbol)
//     - same pattern

// 13. getCachedMarkPrice(symbol)
//     - const data = await redis.get(KEYS.markPrice(symbol))
//     - return data ? parseFloat(data) : null

// 14. getCachedTicker(symbol)
//     - same pattern as orderbook
