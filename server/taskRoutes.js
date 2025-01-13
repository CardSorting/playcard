import express from 'express';
import taskService from './firestoreTaskService.js';
import statusService from './statusService.js';

const router = express.Router();

router.post('/test/generate', async (req, res) => {
  try {
    const { prompt, aspectRatio = "1:1" } = req.body;
    
    // Create task with all required fields
    const taskId = await taskService.createTask(prompt, aspectRatio);
    
    // Simulate task completion after 2 seconds
    setTimeout(async () => {
      await taskService.completeTask(taskId, {
        data: {
          output: {
            image_url: 'https://example.com/generated-image.png',
            image_urls: [
              'https://example.com/generated-image.png',
              'https://example.com/generated-image-2.png',
              'https://example.com/generated-image-3.png',
              'https://example.com/generated-image-4.png'
            ]
          }
        }
      });
    }, 2000);

    // Return initial response
    const initialResponse = statusService.formatTaskResponse({
      taskId,
      prompt,
      aspectRatio,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    });

    res.status(200).json(initialResponse);
  } catch (error) {
    console.error('Test generation error:', error);
    res.status(500).json({ 
      error: 'Failed to create test task',
      details: error.message 
    });
  }
});

router.get('/task-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.getTaskStatus(taskId);
    
    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found',
        taskId
      });
    }

    const response = statusService.formatTaskResponse(task);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting task status:', {
      taskId: req.params.taskId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to get task status',
      details: error.message 
    });
  }
});

export default router;