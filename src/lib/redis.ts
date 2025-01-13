import Redis from 'ioredis';

let redisClient: Redis | null = null;

if (typeof window === 'undefined') {
  redisClient = new Redis(import.meta.env.VITE_REDIS_URL);

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });
}

export const redis = {
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!redisClient) return;
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await redisClient.set(key, stringValue, 'EX', ttl);
    } else {
      await redisClient.set(key, stringValue);
    }
  },

  async get(key: string): Promise<any> {
    if (!redisClient) return null;
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  },

  async del(key: string): Promise<void> {
    if (!redisClient) return;
    await redisClient.del(key);
  },

  async enqueue(queueName: string, value: any): Promise<void> {
    if (!redisClient) return;
    await redisClient.rpush(queueName, JSON.stringify(value));
  },

  async dequeue(queueName: string): Promise<any> {
    if (!redisClient) return null;
    const value = await redisClient.lpop(queueName);
    return value ? JSON.parse(value) : null;
  },

  async close(): Promise<void> {
    if (!redisClient) return;
    await redisClient.quit();
  }
};