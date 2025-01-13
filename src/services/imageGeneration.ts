import { getDatabase, ref, set, onValue } from 'firebase/database';
import { app, auth } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'firebase/auth';

const API_URL = 'https://api.goapi.ai/api/v1/task';
const API_KEY = import.meta.env.VITE_GOAPI_KEY;

const db = getDatabase(app);

async function getCurrentUser(): Promise<User> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}

export const generateImageTask = async (
  prompt: string,
  aspectRatio: string,
  processMode: 'relax' | 'fast' | 'turbo' = 'fast'
) => {
  const user = await getCurrentUser();
  const taskId = uuidv4();
  const taskRef = ref(db, `imageGenerationTasks/${user.uid}/${taskId}`);
  
  // Create initial task document
  const taskData = {
    id: taskId,
    prompt,
    aspectRatio,
    processMode,
    status: 'pending',
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await set(taskRef, taskData);

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
        process_mode: processMode,
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
      updatedAt: Date.now()
    };
    await set(taskRef, processingData);

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

    // Handle API errors
    if (result.error?.message) {
      throw new Error(result.error.message);
    }

    // Extract all image URLs from response
    const imageUrls = {
      main: result.data?.output?.image_url || '',
      variants: result.data?.output?.image_urls || [],
      temporary: result.data?.output?.temporary_image_urls || [],
      discord: result.data?.output?.discord_image_url || ''
    };

    // Update with completed data
    const completedData = {
      ...processingData,
      status: 'completed',
      progress: 100,
      imageUrls,
      updatedAt: Date.now()
    };
    
    await set(taskRef, completedData);

    return {
      task_id: taskId,
      status: 'completed',
      progress: 100,
      image_url: imageUrls.main,
      image_urls: imageUrls.variants,
      temporary_image_urls: imageUrls.temporary,
      discord_image_url: imageUrls.discord,
      output: {
        image_url: imageUrls.main,
        image_urls: imageUrls.variants,
        temporary_image_urls: imageUrls.temporary,
        discord_image_url: imageUrls.discord
      }
    };
  } catch (error) {
    // Update with error status
    const errorData = {
      ...taskData,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      updatedAt: Date.now()
    };
    
    await set(taskRef, errorData);

    throw error;
  }
};

export const getTaskStatus = async (taskId: string) => {
  const user = await getCurrentUser();
  const taskRef = ref(db, `imageGenerationTasks/${user.uid}/${taskId}`);
  
  return new Promise((resolve, reject) => {
    onValue(taskRef, (snapshot) => {
      if (snapshot.exists()) {
        resolve(snapshot.val());
      } else {
        resolve(null);
      }
    }, {
      onlyOnce: true
    });
  });
};

export const subscribeToTaskUpdates = (taskId: string, callback: (task: any) => void) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  const taskRef = ref(db, `imageGenerationTasks/${user.uid}/${taskId}`);
  
  // Return unsubscribe function
  return onValue(taskRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
};
