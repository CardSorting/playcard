import { ref } from 'firebase/database';
import { FirebaseImageService } from './image-generation/firebase';
import { ImageApiService } from './image-generation/api';
import { ImageGenerationCoreService } from './image-generation/core';
import { auth } from '@/lib/firebase';

// Initialize services
const firebaseService = new FirebaseImageService();
const apiService = new ImageApiService(import.meta.env.VITE_GOAPI_KEY);
const coreService = new ImageGenerationCoreService(firebaseService, apiService);

// Export public API
export const generateImageTask = coreService.generateTask.bind(coreService);

export const getTaskStatus = (taskId: string, userId: string) => {
  return firebaseService.getTaskStatus(
    ref(firebaseService['db'], `imageGenerationTasks/${userId}/${taskId}`)
  );
};

export const subscribeToTaskUpdates = (
  taskId: string,
  userId: string,
  callback: (task: any) => void
) => {
  return firebaseService.subscribeToTaskUpdates(taskId, userId, callback);
};
