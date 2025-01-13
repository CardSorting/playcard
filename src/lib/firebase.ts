import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
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

// Configure auth persistence
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log('Auth persistence set to session');
  })
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

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
