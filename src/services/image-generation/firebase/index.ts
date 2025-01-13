import { getDatabase, ref, set, onValue } from 'firebase/database';
import { app } from '@/lib/firebase';
import { Task, TaskUpdateParams } from '../types';

export class FirebaseImageService {
  private db = getDatabase(app);

  async createTask(userId: string, taskData: Task) {
    const taskRef = ref(this.db, `imageGenerationTasks/${userId}/${taskData.id}`);
    await set(taskRef, taskData);
    return taskRef;
  }

  async updateTask(taskRef: any, updates: TaskUpdateParams) {
    await set(taskRef, {
      ...updates,
      updatedAt: Date.now()
    });
  }

  async getTaskStatus(taskRef: any) {
    return new Promise<Task | null>((resolve) => {
      onValue(taskRef, (snapshot) => {
        if (snapshot.exists()) {
          resolve(snapshot.val());
        } else {
          resolve(null);
        }
      }, { onlyOnce: true });
    });
  }

  subscribeToTaskUpdates(taskId: string, userId: string, callback: (task: Task) => void) {
    const taskRef = ref(this.db, `imageGenerationTasks/${userId}/${taskId}`);
    
    return onValue(taskRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
  }
}