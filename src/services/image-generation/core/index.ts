import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { Task, TaskCreationParams } from '../types';
import { FirebaseImageService } from '../firebase';
import { ImageApiService } from '../api';

export class ImageGenerationCoreService {
  constructor(
    private firebaseService: FirebaseImageService,
    private apiService: ImageApiService
  ) {}

  async generateTask(params: TaskCreationParams) {
    const user = await this.getCurrentUser();
    const taskId = uuidv4();
    
    const taskData: Task = {
      id: taskId,
      ...params,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const taskRef = await this.firebaseService.createTask(user.uid, taskData);

    try {
      await this.firebaseService.updateTask(taskRef, {
        status: 'processing',
        progress: 0
      });

      const taskResponse = await this.apiService.createTask(
        params.prompt,
        params.aspectRatio,
        params.processMode
      );

      await this.apiService.pollTaskStatus(
        taskResponse.task_id,
        async (status) => {
          await this.firebaseService.updateTask(taskRef, {
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
      await this.firebaseService.updateTask(taskRef, {
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