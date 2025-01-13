const API_BASE_URL = 'http://localhost:3001';

export const redisApi = {
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await fetch(`${API_BASE_URL}/redis/set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value, ttl }),
    });
  },

  async get(key: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/redis/get/${key}`);
    const data = await response.json();
    return data.value;
  },

  async del(key: string): Promise<void> {
    await fetch(`${API_BASE_URL}/redis/del/${key}`, {
      method: 'DELETE',
    });
  },

  async enqueue(queueName: string, value: any): Promise<void> {
    await fetch(`${API_BASE_URL}/redis/xadd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queueName, value }),
    });
  },

  async dequeue(queueName: string): Promise<any> {
      const response = await fetch(`${API_BASE_URL}/redis/xread/${queueName}`);
      const data = await response.json();
      return data.value;
  },
};
