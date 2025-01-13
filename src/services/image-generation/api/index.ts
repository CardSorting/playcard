import { TaskStatusResponse } from '../types';

export class ImageApiService {
  private readonly API_URL = 'https://api.goapi.ai/api/v1/task';
  private readonly POLL_INTERVAL = 3000;
  private readonly MAX_POLL_TIME = 300000;

  constructor(private apiKey: string) {}

  async createTask(
    prompt: string,
    aspectRatio: string,
    processMode: 'relax' | 'fast' | 'turbo'
  ) {
    const headers = new Headers({
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    });

    const requestBody = {
      model: 'midjourney',
      task_type: 'imagine',
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        process_mode: processMode,
        skip_prompt_check: false,
        bot_id: 0
      },
      config: {
        service_mode: '',
        webhook_config: {
          endpoint: '',
          secret: ''
        }
      }
    };

    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return response.json();
  }

  async pollTaskStatus(
    taskId: string,
    onStatusUpdate: (status: TaskStatusResponse) => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();
    let lastProgress = 0;
    let lastProgressTime = Date.now();

    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          if (Date.now() - startTime > this.MAX_POLL_TIME) {
            clearInterval(interval);
            throw new Error('Task processing timed out');
          }

          const status = await this.checkTaskStatus(taskId);
          await onStatusUpdate(status);

          if (status.status === 'completed') {
            clearInterval(interval);
            resolve();
          } else if (status.status === 'failed') {
            clearInterval(interval);
            throw new Error(status.error?.message || 'Task failed');
          }

          // Check for stalled progress
          const currentProgress = status.output?.progress || 0;
          if (currentProgress === lastProgress) {
            if (Date.now() - lastProgressTime > 60000) {
              clearInterval(interval);
              throw new Error('Task progress stalled');
            }
          } else {
            lastProgress = currentProgress;
            lastProgressTime = Date.now();
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, this.POLL_INTERVAL);
    });
  }

  private async checkTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    const headers = new Headers({
      'x-api-key': this.apiKey
    });

    const response = await fetch(`${this.API_URL}/${taskId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return response.json();
  }
}