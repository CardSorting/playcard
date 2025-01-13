import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { ClientTask, TaskCreationParams } from '../types';
import { ImageApiService } from '../api';

interface TaskService {
  createTask: (userId: string, taskData: any) => Promise<any>;
  getTaskStatus: (taskId: string, userId: string) => Promise<any>;
}

export class ImageGenerationCoreService {
  constructor(
    private apiService: ImageApiService,
    private taskService: TaskService
  ) {}

  async generateTask(params: TaskCreationParams) {
    const user = await this.getCurrentUser();
    const taskId = uuidv4();
    
    const taskData: ClientTask = {
      id: taskId,
      ...params,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Create task via HTTP API
    await this.taskService.createTask(user.uid, taskData);

    try {
      // Start image generation
      const taskResponse = await this.apiService.createTask(
        params.prompt,
        params.aspectRatio,
        params.processMode
      );

      // Poll for status updates
      await this.apiService.pollTaskStatus(
        taskResponse.task_id,
        async (status) => {
          // Update task status via HTTP API
          await this.taskService.createTask(user.uid, {
            ...taskData,
            status: status.status as 'pending' | 'processing' | 'completed' | 'failed',
            progress: status.output?.progress || 0
          });
        }
      );

      return {
        task_id: taskId,
        status: 'completed',
        progress: 100
      };
    } catch (error) {
      // Update task status to failed via HTTP API
      await this.taskService.createTask(user.uid, {
        ...taskData,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async getCurrentUser(): Promise<User> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  }
}
