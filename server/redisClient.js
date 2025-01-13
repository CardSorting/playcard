import InMemoryBroker from './inMemoryBroker';

class RedisClient {
  constructor() {
    this.client = InMemoryBroker;
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
