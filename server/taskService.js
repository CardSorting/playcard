import redisClient from './redisClient.js';
import { v4 as uuidv4 } from 'uuid';

const TASK_PRIORITIES = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000];

class TaskService {
  constructor() {
    this.redis = redisClient;
  }

  getTaskKey(taskId) {
    return `task:${taskId}`;
  }

  getTaskStatusKey(taskId) {
    return `task_status:${taskId}`;
  }

  getTaskQueueKey(priority) {
    return `task_queue:${priority}`;
  }

  async createTask(prompt, aspectRatio) {
    const taskId = uuidv4();
    await this.redis.hset(this.getTaskKey(taskId), {
      prompt,
      aspectRatio,
      status: 'pending',
      createdAt: Date.now()
    });
    return taskId;
  }

  async getTaskStatus(taskId) {
    const taskKey = this.getTaskKey(taskId);
    const taskStatusKey = this.getTaskStatusKey(taskId);

    const task = await this.redis.hgetall(taskKey);
    if (!task) {
      return null;
    }

    const status = await this.redis.get(taskStatusKey);
    return {
      ...task,
      currentStatus: status
    };
  }

  async completeTask(taskId, result) {
    const taskKey = this.getTaskKey(taskId);
    const taskStatusKey = this.getTaskStatusKey(taskId);

    await this.redis.hset(taskKey, {
      status: 'completed',
      result: JSON.stringify(result),
      completedAt: Date.now()
    });

    await this.redis.set(taskStatusKey, 'completed');
  }

  async cleanupOldTasks() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    const tasks = await this.redis.keys('task:*');
    
    for (const taskKey of tasks) {
      const task = await this.redis.hgetall(taskKey);
      if (task.status === 'completed' && task.completedAt < cutoff) {
        await this.redis.del(taskKey);
        await this.redis.del(this.getTaskStatusKey(taskKey.split(':')[1]));
      }
    }
  }
}

export default new TaskService();