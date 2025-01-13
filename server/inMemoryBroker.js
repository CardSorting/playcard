import { Queue } from 'bullmq';

class InMemoryBroker {
  constructor() {
    this.queues = new Map();
    this.dataStore = new Map();
  }

  async getQueue(name) {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: {
          host: 'localhost',
          port: 6379,
          maxRetriesPerRequest: null,
          enableOfflineQueue: false
        }
      });
      this.queues.set(name, queue);
    }
    return this.queues.get(name);
  }

  async hset(key, fieldValues) {
    if (!this.dataStore.has(key)) {
      this.dataStore.set(key, new Map());
    }
    const hash = this.dataStore.get(key);
    
    for (const [field, value] of Object.entries(fieldValues)) {
      hash.set(field, value);
    }
    return Object.keys(fieldValues).length;
  }

  async hgetall(key) {
    if (!this.dataStore.has(key)) return null;
    const hash = this.dataStore.get(key);
    return Object.fromEntries(hash);
  }

  async get(key) {
    return this.dataStore.get(key) || null;
  }

  async set(key, value) {
    this.dataStore.set(key, value);
    return 'OK';
  }

  async del(key) {
    const existed = this.dataStore.has(key);
    this.dataStore.delete(key);
    return existed ? 1 : 0;
  }

  async zadd(queueName, priority, taskId) {
    const queue = await this.getQueue(queueName);
    await queue.add(taskId, {}, { priority });
    return 1;
  }

  async keys(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const matches = [];
    
    for (const key of this.dataStore.keys()) {
      if (regex.test(key)) {
        matches.push(key);
      }
    }
    
    return matches;
  }
}

export default new InMemoryBroker();
