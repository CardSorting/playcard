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
    this.tasks = new Map();
    this.taskStatuses = new Map();
  }

  async createTask(prompt, aspectRatio) {
    const taskId = uuidv4();
    const task = {
      prompt,
      aspectRatio,
      status: 'pending',
      createdAt: Date.now()
    };
    this.tasks.set(taskId, task);
    this.taskStatuses.set(taskId, 'pending');
    return taskId;
  }

  async getTaskStatus(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    const status = this.taskStatuses.get(taskId);
    return {
      ...task,
      currentStatus: status
    };
  }

  async completeTask(taskId, result) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.result = result;
      task.completedAt = Date.now();
      this.taskStatuses.set(taskId, 'completed');
    }
  }

  async cleanupOldTasks() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'completed' && task.completedAt < cutoff) {
        this.tasks.delete(taskId);
        this.taskStatuses.delete(taskId);
      }
    }
  }
}

export default new TaskService();