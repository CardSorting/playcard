import taskService from '../../server/firestoreTaskService';

const GOAPI_URL = "https://api.goapi.ai/api/v1/task";
const API_KEY = "de4e2500f7d3d0f5c82921fe541b7463a8b740a1bdd1ec8938a977861ea35bf5";

export const generateImageTask = async (prompt: string, aspectRatio: string) => {
  // First create local task record
  const localTaskId = await taskService.createTask(prompt, aspectRatio);
  
  const headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
  };

  const body = JSON.stringify({
    model: "midjourney",
    task_type: "imagine",
    input: {
      prompt,
      aspect_ratio: aspectRatio,
      process_mode: "fast",
      skip_prompt_check: false,
      bot_id: 0
    },
    config: {
      service_mode: "",
      webhook_config: {
        endpoint: "",
        secret: ""
      }
    }
  });

  console.log('Sending API request to:', GOAPI_URL);
  console.log('Request headers:', headers);
  console.log('Request body:', body);

  try {
    const response = await fetch(GOAPI_URL, {
      method: 'POST',
      headers,
      body
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorResponse = await response.text();
      console.error('API error response:', errorResponse);
      await taskService.completeTask(localTaskId, {
        error: `API request failed with status ${response.status}`
      });
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('API response data:', data);
    
    if (!data?.data?.task_id) {
      console.error('Invalid API response format:', data);
      await taskService.completeTask(localTaskId, {
        error: 'Invalid API response format'
      });
      throw new Error('Invalid API response format');
    }

    // Update local task with external task ID
    await taskService.updateTask(localTaskId, {
      externalTaskId: data.data.task_id,
      status: data.data.status || 'pending',
      progress: data.data.output?.progress || 0
    });

    return {
      task_id: localTaskId, // Return local task ID instead of external one
      image_url: data.data.output?.image_url || '',
      image_urls: data.data.output?.image_urls || [],
      progress: data.data.output?.progress || 0,
      status: data.data.status || 'pending'
    };
  } catch (error) {
    console.error('Error in generateImageTask:', error);
    await taskService.completeTask(localTaskId, {
      error: error.message
    });
    throw error;
  }
};
