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

  decodeKey(key) {
    try {
      return decodeURIComponent(key);
    } catch (error) {
      console.error('Error decoding Redis key:', key, error);
      return key;
    }
  }

  async hset(key, fieldValues) {
    const decodedKey = this.decodeKey(key);
    return this.client.hset(decodedKey, fieldValues);
  }

  async hgetall(key) {
    const decodedKey = this.decodeKey(key);
    return this.client.hgetall(decodedKey);
  }

  async get(key) {
    const decodedKey = this.decodeKey(key);
    return this.client.get(decodedKey);
  }

  async set(key, value, ttl) {
    const decodedKey = this.decodeKey(key);
    if (ttl) {
      return this.client.set(decodedKey, value, 'EX', ttl);
    }
    return this.client.set(decodedKey, value);
  }

  async del(key) {
    const decodedKey = this.decodeKey(key);
    return this.client.del(decodedKey);
  }

  async zadd(queue, priority, taskId) {
    const decodedQueue = this.decodeKey(queue);
    return this.client.zadd(decodedQueue, priority, taskId);
  }

  async keys(pattern) {
    const decodedPattern = this.decodeKey(pattern);
    return this.client.keys(decodedPattern);
  }
}

export default new RedisClient();