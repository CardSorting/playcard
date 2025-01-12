import { Timestamp } from 'firebase/firestore';
import { PokemonType } from '@/components/card-creator/types';

// User Collection
export interface UserCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  // Stats
  totalCards: number;
  uniqueTypes: PokemonType[];
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastViewedAt?: Timestamp;
}

// Collection Card
export interface CollectionCard {
  id: string;
  collectionId: string;
  cardId: string;
  // Card snapshot for quick access
  snapshot: {
    name: string;
    type: PokemonType;
    imageUrl: string;
    rarity: string;
  };
  // User customization
  nickname?: string;
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  showcase: boolean; // Featured in profile
  // Acquisition info
  acquiredFrom: {
    type: 'created' | 'purchased' | 'traded' | 'reward';
    sourceId?: string; // Order ID, trade ID, etc.
    date: Timestamp;
  };
  // Metadata
  addedAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection Set
export interface CollectionSet {
  id: string;
  collectionId: string;
  name: string;
  description?: string;
  // Set composition
  cards: {
    cardId: string;
    addedAt: Timestamp;
    position: number; // For custom ordering
  }[];
  // Display settings
  displayMode: 'grid' | 'list' | 'showcase';
  sortOrder: 'custom' | 'name' | 'type' | 'date' | 'rarity';
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection Stats
export interface CollectionStats {
  id: string;
  collectionId: string;
  // Card stats
  cardCounts: {
    total: number;
    byType: Record<PokemonType, number>;
    byRarity: Record<string, number>;
  };
  // Activity stats
  activity: {
    lastAddedAt?: Timestamp;
    lastRemovedAt?: Timestamp;
    mostActiveDay?: string;
    activityByDay: {
      date: string;
      adds: number;
      removes: number;
    }[];
  };
  // Value stats
  value: {
    totalEstimated: number;
    byRarity: Record<string, number>;
    historicalValue: {
      date: string;
      value: number;
    }[];
  };
  // Metadata
  updatedAt: Timestamp;
}

// Collection Sharing
export interface CollectionSharing {
  id: string;
  collectionId: string;
  // Access settings
  visibility: 'private' | 'link' | 'public';
  shareLink?: {
    token: string;
    expiresAt?: Timestamp;
    usageLimit?: number;
    usageCount: number;
  };
  // Collaborators
  collaborators: {
    userId: string;
    role: 'viewer' | 'editor';
    addedAt: Timestamp;
    addedBy: string;
  }[];
  // Access history
  accessLog: {
    userId: string;
    timestamp: Timestamp;
    action: 'view' | 'edit' | 'share';
  }[];
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection Achievement
export interface CollectionAchievement {
  id: string;
  collectionId: string;
  userId: string;
  // Achievement details
  type: 'collection_size' | 'type_master' | 'rarity_complete' | 'set_complete';
  name: string;
  description: string;
  criteria: {
    type: string;
    target: number;
    progress: number;
  };
  // Rewards
  rewards?: {
    type: string;
    amount: number;
    claimed: boolean;
    claimedAt?: Timestamp;
  }[];
  // Metadata
  unlockedAt?: Timestamp;
  updatedAt: Timestamp;
}

// Collection Trade
export interface CollectionTrade {
  id: string;
  // Participants
  initiatorId: string;
  recipientId: string;
  // Trade items
  offer: {
    userId: string;
    cards: {
      cardId: string;
      collectionId: string;
    }[];
  }[];
  // Status
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  // Messages
  messages: {
    userId: string;
    content: string;
    timestamp: Timestamp;
  }[];
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  // Trade verification
  verification?: {
    initiatorConfirmed: boolean;
    recipientConfirmed: boolean;
    confirmedAt?: Timestamp;
  };
}

// Collection Display Settings
export interface CollectionDisplay {
  id: string;
  collectionId: string;
  // Layout settings
  layout: {
    viewMode: 'grid' | 'list' | 'showcase';
    cardsPerRow: number;
    showDetails: boolean;
    animations: boolean;
  };
  // Sort and filter
  sort: {
    field: 'name' | 'type' | 'rarity' | 'date' | 'custom';
    direction: 'asc' | 'desc';
  };
  filters: {
    types?: PokemonType[];
    rarity?: string[];
    favorites?: boolean;
    tags?: string[];
  };
  // Custom sections
  sections: {
    id: string;
    name: string;
    filter: any;
    sort: any;
    visible: boolean;
    order: number;
  }[];
  // Metadata
  updatedAt: Timestamp;
}