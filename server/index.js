import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import serviceAccount from '../cred/playerstcg-bbc59-firebase-adminsdk-lzbr1-9b769a383a.json';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const app = express();
app.use(cors());
app.use(express.json());

// Image generation endpoints
app.post('/api/image-tasks', async (req, res) => {
  try {
    const { userId, taskData } = req.body;
    const db = admin.database();
    const taskRef = db.ref(`imageGenerationTasks/${userId}/${taskData.id}`);
    await taskRef.set(taskData);
    res.json({ success: true, taskId: taskData.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/image-tasks/:userId/:taskId', async (req, res) => {
  try {
    const { userId, taskId } = req.params;
    const db = admin.database();
    const taskRef = db.ref(`imageGenerationTasks/${userId}/${taskId}`);
    
    taskRef.once('value', (snapshot) => {
      if (snapshot.exists()) {
        res.json(snapshot.val());
      } else {
        res.status(404).json({ error: 'Task not found' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
