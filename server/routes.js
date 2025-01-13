import express from 'express';
import taskRoutes from './taskRoutes.js';

const router = express.Router();

// Mount task routes
router.use(taskRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;