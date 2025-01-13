import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'https://api.goapi.ai/api/v1/task';
const API_KEY = import.meta.env.VITE_GOAPI_KEY;

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
  taskStatusCache.set(taskId, taskData);

  try {
    const headers = new Headers({
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    });

    const requestBody = {
      model: 'midjourney',
      task_type: 'imagine',
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        process_mode: 'fast',
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

    // Update status to processing
    const processingData = {
      ...taskData,
      status: 'processing',
      progress: 50,
      updatedAt: new Date().toISOString()
    };
    await setDoc(taskRef, processingData);
    taskStatusCache.set(taskId, processingData);

    // Make API request
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    // Update with completed data
    const completedData = {
      ...processingData,
      status: 'completed',
      progress: 100,
      imageUrl: result.image_url || '',
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(taskRef, completedData);
    taskStatusCache.set(taskId, completedData);

    return {
      task_id: taskId,
      status: 'completed',
      progress: 100,
      imageUrl: completedData.imageUrl
    };
  } catch (error) {
    // Update with error status
    const errorData = {
      ...taskData,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(taskRef, errorData);
    taskStatusCache.set(taskId, errorData);

    throw error;
  }
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
