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
  
  // Process task immediately
  const myHeaders = new Headers();
  myHeaders.append("x-api-key", import.meta.env.VITE_GOAPI_KEY || "");
  myHeaders.append("Content-Type", "application/json");

  const response = await fetch("https://api.goapi.ai/api/v1/task", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.statusText}`);
  }

  const responseData = await response.json();
  if (responseData.code !== 200) {
    throw new Error(responseData.data.error?.message || "Failed to create task");
  }

  // Cache the task ID
  await redisApi.set(
    `${TASK_QUEUE_NAME}:${prompt}:${aspectRatio}`,
    { task_id: responseData.data.task_id },
    TASK_CACHE_TTL
  );

  return responseData.data.task_id;
};

export const pollTaskStatus = async (taskId: string): Promise<TaskResponse> => {
  // Check cache first
  const cachedStatus = await redisApi.get(`task_status:${taskId}`);
  if (cachedStatus) {
    return cachedStatus;
  }

  const myHeaders = new Headers();
  myHeaders.append("x-api-key", import.meta.env.VITE_GOAPI_KEY || "");

  const response = await fetch(`https://api.goapi.ai/api/v1/task/${taskId}`, {
    method: "GET",
    headers: myHeaders,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch task status: ${response.statusText}`);
  }

  const responseData = await response.json();
  if (responseData.code !== 200) {
    throw new Error(responseData.data.error?.message || "Failed to fetch task status");
  }

  // Cache the status
  await redisApi.set(
    `task_status:${taskId}`,
    responseData,
    TASK_CACHE_TTL
  );

  return responseData;
};