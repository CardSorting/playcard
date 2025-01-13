import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import taskService from './firestoreTaskService.js';

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:5173', // Frontend URL
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

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
