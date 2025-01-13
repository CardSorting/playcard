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
    const decodedKey = decodeURIComponent(key);
    const response = await fetch(`${API_BASE_URL}/redis/get/${encodeURIComponent(decodedKey)}`);
    const data = await response.json();
    return data.value;
  },

  async del(key: string): Promise<void> {
    await fetch(`${API_BASE_URL}/redis/del/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  },

  async enqueue(queueName: string, value: Record<string, any>, priority: number = 2): Promise<string> {
    // Convert object to array of [key, value] pairs
    const fieldValuePairs = Object.entries(value);
    
    const response = await fetch(`${API_BASE_URL}/redis/xadd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queueName,
        fieldValuePairs,
        priority
      }),
    });
    
    const result = await response.json();
    return result.taskId;
  },

  async dequeue(queueName: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/redis/xread/${encodeURIComponent(queueName)}`);
    const data = await response.json();
    return data.value;
  },

  async getTaskStatus(taskId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/task-status/${taskId}`);
    return response.json();
  },

  async processTask(taskId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/process-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId }),
    });
    return response.json();
  },

  async cancelTask(taskId: string): Promise<void> {
    await fetch(`${API_BASE_URL}/task/${taskId}/cancel`, {
      method: 'POST',
    });
  },

  async retryTask(taskId: string): Promise<void> {
    await fetch(`${API_BASE_URL}/task/${taskId}/retry`, {
      method: 'POST',
    });
  },

  async getTaskHistory(queueName: string, limit: number = 100): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/task-history/${encodeURIComponent(queueName)}?limit=${limit}`);
    return response.json();
  }
};

export const TaskPriorities = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3
};
