import axios from "axios";
import { redis } from "../lib/redis";

interface TaskOutput {
  image_url: string;
  image_urls?: string[];
  progress?: number;
}

interface TaskResponse {
  task_id: string;
  status: string;
  output?: TaskOutput;
}

const TASK_CACHE_TTL = 60 * 60; // 1 hour
const TASK_QUEUE_NAME = "image_generation_tasks";

export const generateImageTask = async (prompt: string, aspectRatio: string): Promise<string> => {
  // Check if task is already in queue
  const existingTask = await redis.get(`${TASK_QUEUE_NAME}:${prompt}:${aspectRatio}`);
  if (existingTask) {
    return existingTask.task_id;
  }

  const task = {
    prompt,
    aspectRatio,
    timestamp: Date.now()
  };

  // Add task to queue
  await redis.enqueue(TASK_QUEUE_NAME, task);
  
  // Process task immediately
  const response = await axios.post(
    "https://api.goapi.ai/api/v1/task",
    {
      model: "midjourney",
      task_type: "imagine",
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        process_mode: "fast",
        skip_prompt_check: false,
        bot_id: 0,
      },
      config: {
        service_mode: "",
        webhook_config: {
          endpoint: "",
          secret: "",
        },
      },
    },
    {
      headers: {
        "x-api-key": import.meta.env.VITE_GOAPI_KEY || "",
        "Content-Type": "application/json",
      },
    }
  );

  // Cache the task ID
  await redis.set(
    `${TASK_QUEUE_NAME}:${prompt}:${aspectRatio}`,
    { task_id: response.data.task_id },
    TASK_CACHE_TTL
  );

  return response.data.task_id;
};

export const pollTaskStatus = async (taskId: string): Promise<TaskResponse> => {
  // Check cache first
  const cachedStatus = await redis.get(`task_status:${taskId}`);
  if (cachedStatus) {
    return cachedStatus;
  }

  const response = await axios.get(
    `https://api.goapi.ai/api/v1/task/${taskId}`,
    {
      headers: {
        "x-api-key": import.meta.env.VITE_GOAPI_KEY || "",
        "Content-Type": "application/json",
      },
    }
  );

  // Cache the status
  await redis.set(
    `task_status:${taskId}`,
    response.data,
    TASK_CACHE_TTL
  );

  return response.data;
};