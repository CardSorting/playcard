interface TaskOutput {
  image_url: string;
  image_urls?: string[];
  progress?: number;
}

interface TaskResponse {
  code: number;
  data: {
    task_id: string;
    model: string;
    task_type: string;
    status: "Completed" | "Processing" | "Pending" | "Failed" | "Staged";
    input: Record<string, any>;
    output: TaskOutput;
    error: {
      code: number;
      message: string;
      detail: any;
    };
  };
  message: string;
}

const TASK_QUEUE_NAME = "image_generation_tasks";

class TaskQueue {
  private static instance: TaskQueue;
  private queue: Map<string, any>;
  private cache: Map<string, any>;

  private constructor() {
    this.queue = new Map();
    this.cache = new Map();
  }

  public static getInstance(): TaskQueue {
    if (!TaskQueue.instance) {
      TaskQueue.instance = new TaskQueue();
    }
    return TaskQueue.instance;
  }

  public async enqueue(task: any): Promise<string> {
    const taskId = crypto.randomUUID();
    this.queue.set(taskId, task);
    return taskId;
  }

  public async get(taskKey: string): Promise<any> {
    return this.cache.get(taskKey) || null;
  }

  public async set(taskKey: string, value: any): Promise<void> {
    this.cache.set(taskKey, value);
  }
}

const taskQueue = TaskQueue.getInstance();

export const generateImageTask = async (prompt: string, aspectRatio: string): Promise<string> => {
  // Check if task is already in queue
  const taskKey = `${TASK_QUEUE_NAME}:${prompt}:${aspectRatio}`;
  const existingTask = await taskQueue.get(taskKey);
  if (existingTask) {
    return existingTask.task_id;
  }

  const task = {
    prompt,
    aspectRatio,
    timestamp: Date.now()
  };

  // Add task to queue and get the generated task ID
  const taskId = await taskQueue.enqueue(task);

  // Cache the task ID
  await taskQueue.set(taskKey, { task_id: taskId });

  return taskId;
};
