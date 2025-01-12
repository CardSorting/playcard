import { Timestamp, FieldValue } from 'firebase/firestore';
import { PokemonType } from '@/components/card-creator/types';

// Card Template
export interface CardTemplate {
  id: string;
  name: string;
  type: PokemonType;
  imageUrl: string;
  // Creator info
  creatorId: string;
  creatorName: string;
  // Stats
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  // Card details
  description?: string;
  abilities: {
    name: string;
    description: string;
    energyCost: number;
    damage?: number;
  }[];
  rarity: 'common' | 'uncommon' | 'rare' | 'ultra-rare' | 'legendary';
  serialNumber: string;
  // Metadata
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

// Card Version History
export interface CardVersion {
  id: string;
  cardId: string;
  version: number;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  createdAt: Timestamp;
  createdBy: string;
}

// Card Assets
export interface CardAsset {
  id: string;
  cardId: string;
  type: 'image' | 'animation' | 'sound';
  url: string;
  thumbnailUrl?: string;
  fileType: string;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  status: 'processing' | 'ready' | 'error';
  metadata: {
    originalName: string;
    contentType: string;
    [key: string]: any;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Card Collection
export interface CardCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  cards: {
    cardId: string;
    addedAt: Timestamp;
    favorite: boolean;
    notes?: string;
  }[];
  isPublic: boolean;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Card Analytics
export interface CardAnalytics {
  id: string;
  cardId: string;
  // Usage stats
  views: number;
  likes: number;
  shares: number;
  collections: number;
  // Creation stats
  totalVersions: number;
  lastModified: Timestamp;
  // Marketplace stats
  listingCount: number;
  averagePrice: number;
  totalSales: number;
  // Time-based stats
  dailyStats: {
    date: string;
    views: number;
    likes: number;
    shares: number;
  }[];
  // Creator stats
  creatorStats: {
    totalCards: number;
    averageRating: number;
    followerCount: number;
  };
  updatedAt: Timestamp;
}

// Card Generation
export interface CardGeneration {
  id: string;
  userId: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  // Generation parameters
  parameters: {
    type: PokemonType;
    style: string;
    complexity: number;
    [key: string]: any;
  };
  // Results
  results: {
    imageUrl: string;
    timestamp: Timestamp;
    metadata: {
      model: string;
      seed: number;
      [key: string]: any;
    };
  }[];
  // Error handling
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  // Timestamps
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  // Usage tracking
  credits: number;
  processingTime: number;
}

// Card Comments
export interface CardComment {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  // Threading
  parentId?: string;
  replyCount: number;
  // Reactions
  reactions: {
    [type: string]: string[]; // userId[]
  };
  // Moderation
  status: 'active' | 'hidden' | 'deleted';
  reports?: {
    userId: string;
    reason: string;
    timestamp: Timestamp;
  }[];
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  editedAt?: Timestamp;
}

// Card Collaboration
export interface CardCollaboration {
  id: string;
  cardId: string;
  // Collaborators
  owner: {
    userId: string;
    role: 'owner';
    permissions: string[];
  };
  collaborators: {
    userId: string;
    role: 'editor' | 'viewer';
    permissions: string[];
    addedAt: Timestamp;
    addedBy: string;
  }[];
  // Access settings
  accessType: 'private' | 'shared' | 'public';
  shareLink?: string;
  shareLinkExpiry?: Timestamp;
  // Activity
  activity: {
    userId: string;
    action: string;
    timestamp: Timestamp;
    details?: any;
  }[];
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Card Sets
export interface CardSet {
  id: string;
  name: string;
  description?: string;
  // Set details
  cards: {
    cardId: string;
    rarity: string;
    dropRate: number;
  }[];
  totalCards: number;
  // Release info
  releaseDate?: Timestamp;
  endDate?: Timestamp;
  status: 'draft' | 'active' | 'ended';
  // Distribution
  distribution: {
    type: 'booster' | 'promo' | 'special';
    details: {
      cardsPerPack?: number;
      packPrice?: number;
      [key: string]: any;
    };
  };
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}