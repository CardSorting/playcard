import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// In-memory task status cache
const taskStatusCache = new Map<string, any>();

export const generateImageTask = async (prompt: string, aspectRatio: string) => {
  const taskId = uuidv4();
  const taskRef = doc(db, 'imageGenerationTasks', taskId);
  
  // Create initial task document
  const taskData = {
    id: taskId,
    prompt,
    aspectRatio,
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(taskRef, taskData);
  
  // Store in memory cache
  taskStatusCache.set(taskId, taskData);

  // Simulate image generation process
  setTimeout(async () => {
    const updatedData = {
      ...taskData,
      status: 'processing',
      progress: 50,
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(taskRef, updatedData);
    taskStatusCache.set(taskId, updatedData);

    setTimeout(async () => {
      const completedData = {
        ...updatedData,
        status: 'completed',
        progress: 100,
        imageUrl: `https://storage.googleapis.com/generated-images/${taskId}.png`,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(taskRef, completedData);
      taskStatusCache.set(taskId, completedData);
    }, 5000);
  }, 2000);

  return {
    task_id: taskId,
    status: 'pending',
    progress: 0
  };
};

export const getTaskStatus = (taskId: string) => {
  return taskStatusCache.get(taskId) || null;
};

export const subscribeToTaskUpdates = (taskId: string, callback: (task: any) => void) => {
  const taskRef = doc(db, 'imageGenerationTasks', taskId);
  
  // Return unsubscribe function
  return onSnapshot(taskRef, (doc) => {
    if (doc.exists()) {
      const taskData = doc.data();
      taskStatusCache.set(taskId, taskData);
      callback(taskData);
    }
  });
};
