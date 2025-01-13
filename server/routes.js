import express from 'express';
import taskService from './taskService.js';
import statusService from './statusService.js';

const router = express.Router();

// Test endpoint for image generation
router.post('/test/generate', async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    const taskId = await taskService.createTask(prompt, aspectRatio);
    
    // Simulate task completion after 2 seconds
    setTimeout(async () => {
      await taskService.completeTask(taskId, {
        data: {
          output: {
            image_url: 'https://example.com/generated-image.png',
            image_urls: ['https://example.com/generated-image.png']
          }
        }
      });
    }, 2000);

    res.status(200).json({ taskId });
  } catch (error) {
    console.error('Test generation error:', error);
    res.status(500).json({ error: 'Failed to create test task' });
  }
});

// Task status endpoint
router.get('/task-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.getTaskStatus(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const response = statusService.formatTaskResponse(task);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting task status:', error);
    res.status(500).json({ error: 'Failed to get task status' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;