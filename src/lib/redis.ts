import { createClient } from 'redis';

const redisClient = createClient({
  url: import.meta.env.VITE_REDIS_URL
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

await redisClient.connect();

export const redis = {
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await redisClient.set(key, stringValue, { EX: ttl });
    } else {
      await redisClient.set(key, stringValue);
    }
  },

  async get(key: string): Promise<any> {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  },

  async del(key: string): Promise<void> {
    await redisClient.del(key);
  },

  async enqueue(queueName: string, value: any): Promise<void> {
    await redisClient.rPush(queueName, JSON.stringify(value));
  },

  async dequeue(queueName: string): Promise<any> {
    const value = await redisClient.lPop(queueName);
    return value ? JSON.parse(value) : null;
  },

  async close(): Promise<void> {
    await redisClient.quit();
  }
};