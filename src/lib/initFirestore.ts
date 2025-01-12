import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

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
    // Verify user document exists
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    console.log('Firestore initialized successfully');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    throw error;
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
