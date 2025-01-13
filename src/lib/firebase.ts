import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

// Configure auth persistence and wait for initialization
export const initializeFirebase = async () => {
  try {
    // Use in-memory persistence to avoid window operations
    await setPersistence(auth, {
      type: 'NONE'
    });
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
};

// Initialize Firebase immediately
initializeFirebase();

// Add token refresh listener
auth.onIdTokenChanged(async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken();
      // Store token in sessionStorage to match auth context
      sessionStorage.setItem('firebaseToken', token);
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  } else {
    sessionStorage.removeItem('firebaseToken');
  }
});
