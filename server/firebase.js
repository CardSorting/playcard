import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read service account credentials
const serviceAccount = JSON.parse(
  readFileSync(
    join(__dirname, '../cred/playerstcg-bbc59-firebase-adminsdk-lzbr1-9b769a383a.json'),
    'utf-8'
  )
);

// Initialize Firebase Admin SDK
const app = initializeApp({
  credential: cert(serviceAccount)
});

// Get Firestore instance
const db = getFirestore(app);

export { db };