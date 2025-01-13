import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import credentials from '../cred/playerstcg-bbc59-firebase-adminsdk-lzbr1-9b769a383a.json' assert { type: 'json' };

const firebaseConfig = {
  apiKey: credentials.apiKey,
  authDomain: credentials.authDomain,
  projectId: credentials.projectId,
  storageBucket: credentials.storageBucket,
  messagingSenderId: credentials.messagingSenderId,
  appId: credentials.appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };