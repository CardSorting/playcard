import express from 'express';
import cors from 'cors';
import Redis from 'ioredis';

const app = express();
const port = process.env.PORT || 3001;

// Initialize Redis client with proper error handling
const redis = new Redis(process.env.VITE_REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Redis operations
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
    res.status(200).json({ value: value ? JSON.parse(value) : null });
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
    console.error('Redis delete error:', error);
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

app.post('/redis/enqueue', async (req, res) => {
  try {
    const { queueName, value } = req.body;
    await redis.rpush(queueName, JSON.stringify(value));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Redis enqueue error:', error);
    res.status(500).json({ error: 'Failed to enqueue value' });
  }
});

app.get('/redis/dequeue/:queueName', async (req, res) => {
  try {
    const { queueName } = req.params;
    const value = await redis.lpop(queueName);
    res.status(200).json({ value: value ? JSON.parse(value) : null });
  } catch (error) {
    console.error('Redis dequeue error:', error);
    res.status(500).json({ error: 'Failed to dequeue value' });
  }
});

// Task processing endpoint
app.post('/process-task', async (req, res) => {
  try {
    const task = await redis.lpop('image_generation_tasks');
    if (!task) {
      return res.status(200).json({ message: 'No tasks in queue' });
    }

    const parsedTask = JSON.parse(task);
    const { prompt, aspectRatio } = parsedTask;

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

    // Cache the task ID
    await redis.set(
      `task_status:${responseData.data.task_id}`,
      {
        code: responseData.code,
        data: {
          status: responseData.data.status,
          output: responseData.data.output,
          error: responseData.data.error,
        },
        message: responseData.message,
      },
      60 * 60
    );

    res.status(200).json({ message: 'Task processed successfully', taskId: responseData.data.task_id });
  } catch (error) {
    console.error('Error processing task:', error);
    res.status(500).json({ error: 'Failed to process task' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
