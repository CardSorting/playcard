import { Timestamp } from 'firebase/firestore';
import { CardData } from '@/components/card-creator/types';

export interface BoosterPack {
  id: string;
  userId: string;
  creatorName?: string;
  name: string;
  description?: string;
  cards: CardData[];
  // Pack details
  totalCards: number;
  cardTypes: {
    [key: string]: number; // Distribution of card types
  };
  rarityDistribution: {
    [key: string]: number; // Distribution of card rarities
  };
  // Pack status
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  // Stats
  openCount: number;
  favoriteCount: number;
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
  lastOpenedAt?: Timestamp;
  // Reference to claim pool
  claimPoolId?: string;
}

export interface BoosterPackStats {
  id: string;
  packId: string;
  // Card stats
  mostOpenedCards: {
    cardId: string;
    openCount: number;
  }[];
  // Rarity stats
  rarityStats: {
    [rarity: string]: {
      totalOpened: number;
      averagePerOpening: number;
    };
  };
  // Time-based stats
  opensByDay: {
    date: string;
    count: number;
  }[];
  // Metadata
  updatedAt: Timestamp;
}

export interface BoosterPackFavorite {
  id: string;
  packId: string;
  userId: string;
  createdAt: Timestamp;
}
