import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Define collection names as constants
export const COLLECTIONS = {
  USERS: 'users',
  CARDS: 'cards',
  BOOSTER_PACKS: 'boosterPacks',
  MARKETPLACE_LISTINGS: 'marketplaceListings',
  COLLECTIONS: 'collections'
} as const;

// Initialize Firestore (no-op for now since we don't need metadata documents)
export const initializeFirestore = async () => {
  try {
    // Collections will be created automatically when documents are added
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
