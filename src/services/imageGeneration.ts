import axios from "axios";

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

export const generateImageTask = async (prompt: string, aspectRatio: string): Promise<string> => {
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

  return response.data.task_id;
};

export const pollTaskStatus = async (taskId: string): Promise<TaskResponse> => {
  const response = await axios.get(
    `https://api.goapi.ai/api/v1/task/${taskId}`,
    {
      headers: {
        "x-api-key": import.meta.env.VITE_GOAPI_KEY || "",
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};