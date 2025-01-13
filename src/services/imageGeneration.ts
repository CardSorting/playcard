import { ImageApiService } from './image-generation/api';
import { ImageGenerationCoreService } from './image-generation/core';

// Task management functions
const getTaskStatus = async (taskId: string, userId: string) => {
  try {
    const response = await fetch(`/api/image-tasks/${userId}/${taskId}`);
    if (!response.ok) throw new Error('Failed to fetch task status');
    return await response.json();
  } catch (error) {
    console.error('Error getting task status:', error);
    throw error;
  }
};

const createImageTask = async (userId: string, taskData: any) => {
  try {
    const response = await fetch('/api/image-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, taskData }),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return await response.json();
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Initialize services
const apiService = new ImageApiService(import.meta.env.VITE_GOAPI_KEY);
const coreService = new ImageGenerationCoreService(apiService, {
  createTask: createImageTask,
  getTaskStatus
});

// Export public API
export const generateImageTask = coreService.generateTask.bind(coreService);
