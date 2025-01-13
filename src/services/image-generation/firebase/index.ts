import { getAdminDatabase } from '@server/lib/firebase-admin';
import { AdminTask, TaskUpdateParams } from '../types';
import type { Database, Reference } from 'firebase-admin/database';

export class FirebaseImageService {
  private db: Database = getAdminDatabase();

  constructor() {
    // Initialize with system permissions
    // No token needed since we're using admin SDK
  }

  async createTask(userId: string, taskData: AdminTask): Promise<Reference> {
    const taskRef = this.db.ref(`imageGenerationTasks/${userId}/${taskData.id}`);
    await taskRef.set(taskData);
    return taskRef;
  }

  async updateTask(taskRef: Reference, updates: TaskUpdateParams) {
    await taskRef.update({
      ...updates,
      updatedAt: Date.now()
    });
  }

  async getTaskStatus(taskRef: Reference): Promise<AdminTask | null> {
    return new Promise<AdminTask | null>((resolve) => {
      taskRef.once('value', (snapshot: any) => {
        if (snapshot.exists()) {
          resolve(snapshot.val());
        } else {
          resolve(null);
        }
      });
    });
  }

  subscribeToTaskUpdates(taskId: string, userId: string, callback: (task: AdminTask) => void): () => void {
    const taskRef = this.db.ref(`imageGenerationTasks/${userId}/${taskId}`);
    
    const listener = taskRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });

    // Return unsubscribe function that takes no arguments
    return () => taskRef.off('value', listener);
  }
}
