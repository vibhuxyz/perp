import { redisClient } from "./client";
import { KEYS } from "./key";

export const cacheBalance = async (userId: string, balance: object): Promise<void> => {
  try {
    const redis = redisClient();
    await redis.set(KEYS.balance(userId), JSON.stringify(balance), "EX", 3600);
  } catch {
    // redis offline or error
  }
};

export const getCachedBalance = async <T>(userId: string): Promise<T | null> => {
  try {
    const redis = redisClient();
    const data = await redis.get(KEYS.balance(userId));
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
};

export const cachePositions = async (userId: string, positions: object): Promise<void> => {
  try {
    const redis = redisClient();
    await redis.set(KEYS.positions(userId), JSON.stringify(positions), "EX", 3600);
  } catch {
    // redis offline or error
  }
};

export const getCachedPositions = async <T>(userId: string): Promise<T | null> => {
  try {
    const redis = redisClient();
    const data = await redis.get(KEYS.positions(userId));
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
};

export const cacheOrderbook = async (symbol: string, book: object): Promise<void> => {
  try {
    const redis = redisClient();
    await redis.set(KEYS.orderbook(symbol), JSON.stringify(book), "EX", 60);
  } catch {
    // redis offline or error
  }
};

export const getCachedOrderbook = async <T>(symbol: string): Promise<T | null> => {
  try {
    const redis = redisClient();
    const data = await redis.get(KEYS.orderbook(symbol));
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
};

export const cacheTicker = async (symbol: string, ticker: object): Promise<void> => {
  try {
    const redis = redisClient();
    await redis.set(KEYS.ticker(symbol), JSON.stringify(ticker), "EX", 60);
  } catch {
    // redis offline or error
  }
};

export const getCachedTicker = async <T>(symbol: string): Promise<T | null> => {
  try {
    const redis = redisClient();
    const data = await redis.get(KEYS.ticker(symbol));
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
};
