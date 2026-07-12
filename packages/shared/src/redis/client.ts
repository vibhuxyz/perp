import Redis from "ioredis";

const redisURL = process.env.REDIS_URL || "";

let redisInstance: Redis | null = null;

export const redisClinet = () => {
  if (!redisInstance) {
    redisInstance = new Redis(redisURL);
  }

  return redisInstance;
};

export const redisPubSub = () => {
  return {
    pub: new Redis(redisURL),
    sub: new Redis(redisURL),
  };
};
