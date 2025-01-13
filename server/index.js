import express from 'express';
import cors from 'cors';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = process.env.PORT || 3001;

// Initialize Redis client with proper error handling
const redis = new Redis(process.env.REDIS_URL || process.env.VITE_REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Middleware
app.use(cors());
app.use(express.json());

// Constants
const TASK_PRIORITIES = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // in milliseconds

// Helper functions
const getTaskKey = (taskId) => `task:${taskId}`;
const getTaskStatusKey = (taskId) => `task_status:${taskId}`;
const getTaskQueueKey = (priority) => `task_queue:${priority}`;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Basic Redis operations
app.post('/redis/set', async (req, res) => {
  try {
    const { key, value, ttl } = req.body;
    if (ttl) {
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
    } else {
      await redis.set(key, JSON.stringify(value));
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Redis set error:', error);
    res.status(500).json({ error: 'Failed to set value' });
  }
});

app.get('/redis/get/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await redis.get(key);
    if (value === null) {
      return res.status(404).json({ error: 'Key not found' });
    }
    res.status(200).json({ value: JSON.parse(value) });
  } catch (error) {
    console.error('Redis get error:', error);
    res.status(500).json({ error: 'Failed to get value' });
  }
});

app.delete('/redis/del/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await redis.del(key);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Redis del error:', error);
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

// Enhanced Redis operations
app.post('/redis/xadd', async (req, res) => {
  try {
    const { queueName, fieldValuePairs, priority = TASK_PRIORITIES.NORMAL } = req.body;
    const taskId = uuidv4();
    
    // Store task metadata
    await redis.hset(getTaskKey(taskId), {
      status: 'pending',
      createdAt: Date.now(),
      priority,
      retries: 0,
      ...Object.fromEntries(fieldValuePairs)
    });

    // Add to priority queue
    await redis.zadd(getTaskQueueKey(priority), priority, taskId);

    res.status(200).json({ success: true, taskId });
  } catch (error) {
    console.error('Redis xadd error:', error);
    res.status(500).json({ error: 'Failed to add to stream' });
  }
});

// Task processing endpoint with retries
app.post('/process-task', async (req, res) => {
  const { taskId } = req.body;
  
  try {
    const taskKey = getTaskKey(taskId);
    const taskStatusKey = getTaskStatusKey(taskId);
    
    // Get task details
    const task = await redis.hgetall(taskKey);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if task is already being processed
    const currentStatus = await redis.get(taskStatusKey);
    if (currentStatus === 'processing') {
      return res.status(200).json({ message: 'Task is already being processed' });
    }

    // Mark as processing
    await redis.set(taskStatusKey, 'processing');

    const { prompt, aspectRatio, retries = 0 } = task;
    
    try {
      const myHeaders = new Headers();
      myHeaders.append("x-api-key", process.env.VITE_GOAPI_KEY || "");
      myHeaders.append("Content-Type", "application/json");

      const response = await fetch("https://api.goapi.ai/api/v1/task", {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify({
          model: "midjourney",
          task_type: "imagine",
          input: {
            prompt,
            aspect_ratio: aspectRatio,
            process_mode: "fast",
            skip_prompt_check: false,
            bot_id: 0,
          },
          config: {
            service_mode: "",
            webhook_config: {
              endpoint: "",
              secret: "",
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }

      const responseData = await response.json();
      if (responseData.code !== 200) {
        throw new Error(responseData.data.error?.message || "Failed to create task");
      }

      // Update task status
      await redis.hset(taskKey, {
        status: 'completed',
        completedAt: Date.now(),
        result: JSON.stringify(responseData)
      });

      await redis.set(taskStatusKey, 'completed');
      
      res.status(200).json({ 
        message: 'Task processed successfully',
        taskId: responseData.data.task_id
      });

    } catch (error) {
      console.error('Task processing error:', error);
      
      // Handle retries
      if (retries < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retries];
        const newRetries = parseInt(retries) + 1;
        
        await redis.hset(taskKey, {
          status: 'retrying',
          retries: newRetries
        });

        // Schedule retry
        setTimeout(async () => {
          await redis.zadd(getTaskQueueKey(task.priority), task.priority, taskId);
        }, delay);

        return res.status(200).json({ 
          message: `Task will be retried in ${delay}ms`,
          retries: newRetries
        });
      }

      // Mark as failed after max retries
      await redis.hset(taskKey, {
        status: 'failed',
        error: error.message
      });

      await redis.set(taskStatusKey, 'failed');
      
      res.status(500).json({ 
        error: 'Task failed after maximum retries',
        taskId
      });
    }
  } catch (error) {
    console.error('Error processing task:', error);
    res.status(500).json({ error: 'Failed to process task' });
  }
});

// Task status endpoint
app.get('/task-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskKey = getTaskKey(taskId);
    const taskStatusKey = getTaskStatusKey(taskId);

    const task = await redis.hgetall(taskKey);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const status = await redis.get(taskStatusKey);
    res.status(200).json({ 
      ...task,
      currentStatus: status
    });
  } catch (error) {
    console.error('Error getting task status:', error);
    res.status(500).json({ error: 'Failed to get task status' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Task cleanup worker
setInterval(async () => {
  try {
    // Clean up completed tasks older than 24 hours
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    const tasks = await redis.keys('task:*');
    
    for (const taskKey of tasks) {
      const task = await redis.hgetall(taskKey);
      if (task.status === 'completed' && task.completedAt < cutoff) {
        await redis.del(taskKey);
        await redis.del(getTaskStatusKey(taskKey.split(':')[1]));
      }
    }
  } catch (error) {
    console.error('Task cleanup error:', error);
  }
}, 60 * 60 * 1000); // Run every hour
