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
const GOAPI_URL = "https://api.goapi.ai/api/v1/task";
const API_KEY = "de4e2500f7d3d0f5c82921fe541b7463a8b740a1bdd1ec8938a977861ea35bf5";

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

async function generateImageWithAPI(prompt: string, aspectRatio: string) {
  const headers = new Headers({
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
  });

  const body = JSON.stringify({
    model: "midjourney",
    task_type: "imagine",
    input: {
      prompt,
      aspect_ratio: aspectRatio,
      process_mode: "fast",
      skip_prompt_check: false,
      bot_id: 0
    },
    config: {
      service_mode: "",
      webhook_config: {
        endpoint: "",
        secret: ""
      }
    }
  });

  const response = await fetch(GOAPI_URL, {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return await response.json();
}

export const generateImageTask = async (prompt: string, aspectRatio: string): Promise<string> => {
  // Check if task is already in queue
  const taskKey = `${TASK_QUEUE_NAME}:${prompt}:${aspectRatio}`;
  const existingTask = await taskQueue.get(taskKey);
  if (existingTask) {
    return existingTask.task_id;
  }

  // Generate image using API
  const apiResponse = await generateImageWithAPI(prompt, aspectRatio);
  
  const task = {
    prompt,
    aspectRatio,
    timestamp: Date.now(),
    result: {
      image_url: apiResponse.data.output.image_url,
      image_urls: apiResponse.data.output.image_urls || [],
      progress: apiResponse.data.output.progress || 0
    }
  };

  // Add task to queue and get the generated task ID
  const taskId = await taskQueue.enqueue(task);

  // Cache the task ID
  await taskQueue.set(taskKey, { 
    task_id: taskId,
    result: task.result
  });

  return taskId;
};
