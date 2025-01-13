import { redisApi } from "./redisApi";

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

const TASK_CACHE_TTL = 60 * 60; // 1 hour
const TASK_QUEUE_NAME = "image_generation_tasks";

export const generateImageTask = async (prompt: string, aspectRatio: string): Promise<string> => {
  // Check if task is already in queue
  const existingTask = await redisApi.get(`${TASK_QUEUE_NAME}:${prompt}:${aspectRatio}`);
  if (existingTask) {
    return existingTask.task_id;
  }

  const task = {
    prompt,
    aspectRatio,
    timestamp: Date.now()
  };

  // Add task to queue
  await redisApi.enqueue(TASK_QUEUE_NAME, task);

  // Cache the task ID
  const taskId =  `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  await redisApi.set(
    `${TASK_QUEUE_NAME}:${prompt}:${aspectRatio}`,
    { task_id: taskId },
    TASK_CACHE_TTL
  );

  return taskId;
};
