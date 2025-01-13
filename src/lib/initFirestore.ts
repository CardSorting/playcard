import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth, initializeFirebase } from './firebase';

// Define collection names as constants
export const COLLECTIONS = {
  USERS: 'users',
  CARDS: 'cards',
  BOOSTER_PACKS: 'boosterPacks',
  MARKETPLACE_LISTINGS: 'marketplaceListings',
  COLLECTIONS: 'collections'
} as const;

// Initialize Firestore and verify authentication
export const initializeFirestore = async () => {
  try {
    console.log('Attempting Firestore initialization...');
    
    // Wait for Firebase initialization
    await initializeFirebase();
    
    const user = auth.currentUser;
    
    if (!user) {
      console.log('No authenticated user - skipping Firestore initialization');
      return false;
    }

    console.log('Authenticated user found:', user.uid);
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('Creating new user document for:', user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      console.log('User document already exists for:', user.uid);
    }

    console.log('Firestore initialized successfully for user:', user.uid);
    return true;
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    return false;
  }
};

// Define collection schemas (TypeScript interfaces)
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoosterPack {
  id: string;
  name: string;
  description: string;
  price: number;
  cardIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceListing {
  id: string;
  cardId: string;
  sellerId: string;
  price: number;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  cardIds: string[];
  createdAt: string;
  updatedAt: string;
}
