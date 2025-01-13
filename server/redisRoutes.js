import express from 'express';
import redisClient from './redisClient.js';

const router = express.Router();

router.post('/set', async (req, res) => {
  try {
    const { key, value, ttl } = req.body;
    await redisClient.set(key, JSON.stringify(value), ttl);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Redis set error:', error);
    res.status(500).json({ error: 'Failed to set value' });
  }
});

router.get('/get/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await redisClient.get(key);
    if (value === null) {
      return res.status(404).json({ error: 'Key not found' });
    }
    res.status(200).json({ value: JSON.parse(value) });
  } catch (error) {
    console.error('Redis get error:', error);
    res.status(500).json({ error: 'Failed to get value' });
  }
});

router.delete('/del/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await redisClient.del(key);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Redis del error:', error);
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

router.post('/xadd', async (req, res) => {
  try {
    const { queueName, fieldValuePairs, priority = 2 } = req.body;
    const taskId = uuidv4();
    
    await redisClient.hset(`task:${taskId}`, {
      status: 'pending',
      createdAt: Date.now(),
      priority,
      retries: 0,
      ...Object.fromEntries(fieldValuePairs)
    });

    await redisClient.zadd(`task_queue:${priority}`, priority, taskId);

    res.status(200).json({ success: true, taskId });
  } catch (error) {
    console.error('Redis xadd error:', error);
    res.status(500).json({ error: 'Failed to add to stream' });
  }
});

export default router;