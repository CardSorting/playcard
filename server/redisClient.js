import Redis from 'ioredis';

class RedisClient {
  constructor() {
    this.client = new Redis(process.env.REDIS_URL || process.env.VITE_REDIS_URL || 'redis://localhost:6379');
    this.initEventHandlers();
  }

  initEventHandlers() {
    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  async hset(key, fieldValues) {
    return this.client.hset(key, fieldValues);
  }

  async hgetall(key) {
    return this.client.hgetall(key);
  }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, value, ttl) {
    if (ttl) {
      return this.client.set(key, value, 'EX', ttl);
    }
    return this.client.set(key, value);
  }

  async del(key) {
    return this.client.del(key);
  }

  async zadd(queue, priority, taskId) {
    return this.client.zadd(queue, priority, taskId);
  }

  async keys(pattern) {
    return this.client.keys(pattern);
  }
}

export default new RedisClient();