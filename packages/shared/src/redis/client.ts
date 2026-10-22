import Redis from "ioredis";

const redisURL = process.env.REDIS_URL || "redis://localhost:6379";

let redisInstance: Redis | null = null;

export const redisClient = (): Redis => {
  if (!redisInstance) {
    redisInstance = new Redis(redisURL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  return redisInstance;
};

export const redisClinet = redisClient;

export const redisPubSub = () => {
  return {
    pub: new Redis(redisURL, { maxRetriesPerRequest: 1, lazyConnect: true }),
    sub: new Redis(redisURL, { maxRetriesPerRequest: 1, lazyConnect: true }),
  };
};
