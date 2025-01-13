import { db } from './firebase.js';
import { Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

const TASK_COLLECTION = 'tasks';
const TASK_STATUS_COLLECTION = 'taskStatuses';

class FirestoreTaskService {
  async createTask(prompt, aspectRatio) {
    try {
      const taskId = randomUUID();
      const now = Timestamp.now();
      
      console.log('Creating task:', { taskId, prompt, aspectRatio });

      const taskData = {
        prompt,
        aspectRatio,
        status: 'pending',
        progress: 0,
        createdAt: now,
        startedAt: now,
        updatedAt: now,
        result: null
      };
      
      const statusData = {
        status: 'pending',
        updatedAt: now
      };

      // Use batch write for atomic operation
      const batch = db.batch();
      
      const taskRef = db.collection(TASK_COLLECTION).doc(taskId);
      const statusRef = db.collection(TASK_STATUS_COLLECTION).doc(taskId);
      
      batch.set(taskRef, taskData);
      batch.set(statusRef, statusData);
      
      await batch.commit();

      console.log('Task created successfully:', taskId);
      return taskId;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  async getTaskStatus(taskId) {
    try {
      console.log('Fetching task status:', taskId);
      
      const taskRef = db.collection(TASK_COLLECTION).doc(taskId);
      const statusRef = db.collection(TASK_STATUS_COLLECTION).doc(taskId);
      
      const [taskDoc, statusDoc] = await Promise.all([
        taskRef.get(),
        statusRef.get()
      ]);

      if (!taskDoc.exists || !statusDoc.exists) {
        console.log('Task not found:', taskId);
        return null;
      }

      const taskData = taskDoc.data();
      const statusData = statusDoc.data();

      console.log('Task data:', taskData);
      console.log('Status data:', statusData);

      // Convert Firestore Timestamps to JavaScript Dates
      const convertedTaskData = {
        ...taskData,
        createdAt: taskData.createdAt.toDate(),
        startedAt: taskData.startedAt.toDate(),
        updatedAt: taskData.updatedAt.toDate(),
        completedAt: taskData.completedAt ? taskData.completedAt.toDate() : null
      };

      return {
        ...convertedTaskData,
        currentStatus: statusData.status
      };
    } catch (error) {
      console.error('Error getting task status:', error);
      throw new Error('Failed to get task status');
    }
  }

  async completeTask(taskId, result) {
    try {
      const now = Timestamp.now();
      const taskRef = db.collection(TASK_COLLECTION).doc(taskId);
      const statusRef = db.collection(TASK_STATUS_COLLECTION).doc(taskId);
      
      const batch = db.batch();
      
      batch.update(taskRef, {
        status: 'completed',
        result: JSON.stringify(result),
        completedAt: now,
        progress: 100
      });
      
      batch.update(statusRef, {
        status: 'completed',
        updatedAt: now
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error completing task:', error);
      throw new Error('Failed to complete task');
    }
  }

  async cleanupOldTasks() {
    try {
      const cutoff = Timestamp.fromMillis(Date.now() - (24 * 60 * 60 * 1000));
      const snapshot = await db.collection(TASK_COLLECTION)
        .where('completedAt', '<', cutoff)
        .get();

      const batch = db.batch();
      
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        batch.delete(db.collection(TASK_STATUS_COLLECTION).doc(doc.id));
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up old tasks:', error);
      throw new Error('Failed to clean up old tasks');
    }
  }
}

export default new FirestoreTaskService();