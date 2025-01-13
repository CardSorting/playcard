import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import taskService from './firestoreTaskService.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  
  // Setup cleanup task
  setInterval(async () => {
    try {
      await taskService.cleanupOldTasks();
    } catch (error) {
      console.error('Task cleanup error:', error);
    }
  }, 60 * 60 * 1000); // Run every hour
});
