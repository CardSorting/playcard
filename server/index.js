import express from 'express';
import cors from 'cors';
import Redis from 'ioredis';

const app = express();
const port = process.env.PORT || 3001;

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

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

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});