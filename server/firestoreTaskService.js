import { db } from './firebase.js';
import { 
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';

const TASK_COLLECTION = 'tasks';
const TASK_STATUS_COLLECTION = 'taskStatuses';

class FirestoreTaskService {
  async createTask(prompt, aspectRatio) {
    try {
      const taskId = crypto.randomUUID();
      const now = Timestamp.now();
      
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
      await setDoc(doc(db, TASK_COLLECTION, taskId), taskData);
      await setDoc(doc(db, TASK_STATUS_COLLECTION, taskId), statusData);

      return taskId;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  async getTaskStatus(taskId) {
    try {
      const taskRef = doc(db, TASK_COLLECTION, taskId);
      const statusRef = doc(db, TASK_STATUS_COLLECTION, taskId);
      
      const [taskDoc, statusDoc] = await Promise.all([
        getDoc(taskRef),
        getDoc(statusRef)
      ]);

      if (!taskDoc.exists() || !statusDoc.exists()) {
        return null;
      }

      return {
        ...taskDoc.data(),
        currentStatus: statusDoc.data().status
      };
    } catch (error) {
      console.error('Error getting task status:', error);
      throw new Error('Failed to get task status');
    }
  }

  async completeTask(taskId, result) {
    try {
      const now = Timestamp.now();
      const taskRef = doc(db, TASK_COLLECTION, taskId);
      const statusRef = doc(db, TASK_STATUS_COLLECTION, taskId);
      
      await Promise.all([
        updateDoc(taskRef, {
          status: 'completed',
          result: JSON.stringify(result),
          completedAt: now,
          progress: 100
        }),
        updateDoc(statusRef, {
          status: 'completed',
          updatedAt: now
        })
      ]);
    } catch (error) {
      console.error('Error completing task:', error);
      throw new Error('Failed to complete task');
    }
  }

  async cleanupOldTasks() {
    try {
      const cutoff = Timestamp.fromMillis(Date.now() - (24 * 60 * 60 * 1000));
      const q = query(
        collection(db, TASK_COLLECTION),
        where('completedAt', '<', cutoff)
      );

      const snapshot = await getDocs(q);
      const deletePromises = [];
      
      snapshot.forEach((doc) => {
        deletePromises.push(
          deleteDoc(doc.ref),
          deleteDoc(doc(db, TASK_STATUS_COLLECTION, doc.id))
        );
      });

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error cleaning up old tasks:', error);
      throw new Error('Failed to clean up old tasks');
    }
  }
}

export default new FirestoreTaskService();