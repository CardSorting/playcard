import { Timestamp } from 'firebase/firestore';
import { CardData } from '@/components/card-creator/types';

export interface BoosterPack {
  id: string;
  userId: string;
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
}

export interface PackOpening {
  id: string;
  packId: string;
  userId: string;
  cards: CardData[];
  // Opening details
  pulledRarities: {
    [key: string]: number;
  };
  bestPull?: {
    cardId: string;
    rarity: string;
  };
  // Metadata
  createdAt: Timestamp;
}

export interface PackFavorite {
  id: string;
  packId: string;
  userId: string;
  createdAt: Timestamp;
}

export interface PackAnalytics {
  id: string;
  packId: string;
  // Daily stats
  dailyStats: {
    date: string;
    opens: number;
    favorites: number;
  }[];
  // Card pull rates
  pullRates: {
    [cardId: string]: {
      pulls: number;
      totalOpens: number;
    };
  };
  // Rarity stats
  rarityStats: {
    [rarity: string]: {
      pulls: number;
      totalOpens: number;
    };
  };
  // Metadata
  lastUpdated: Timestamp;
}

export interface PackCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  // Collection contents
  packs: {
    packId: string;
    addedAt: Timestamp;
    openCount: number;
    lastOpenedAt?: Timestamp;
  }[];
  // Collection settings
  isPublic: boolean;
  sortOrder: 'name' | 'added' | 'opened' | 'custom';
  // Stats
  totalPacks: number;
  totalOpens: number;
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PackTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  // Template rules
  cardCount: number;
  rarityRules: {
    [rarity: string]: {
      min: number;
      max: number;
      guaranteed?: boolean;
    };
  };
  typeRules?: {
    [type: string]: {
      min: number;
      max: number;
      guaranteed?: boolean;
    };
  };
  // Template status
  isActive: boolean;
  // Usage stats
  usageCount: number;
  lastUsed?: Timestamp;
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}