import { Timestamp } from 'firebase/firestore';

export interface ClaimPool {
  id: string;
  // The item being shared (e.g., booster pack ID)
  itemId: string;
  itemType: 'booster_pack' | 'card' | 'collection';
  // Pool configuration
  totalLimit: number;
  perUserLimit: number;
  // Current state
  currentClaims: number;
  claims: {
    [userId: string]: {
      count: number;
      lastClaimedAt: Timestamp;
    };
  };
  // Pool metadata
  tier: 'common' | 'rare' | 'ultra_rare';
  status: 'active' | 'exhausted' | 'expired';
  expiresAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ClaimEvent {
  id: string;
  poolId: string;
  userId: string;
  itemId: string;
  itemType: ClaimPool['itemType'];
  // Event details
  claimNumber: number; // Out of total claims
  userClaimNumber: number; // Out of user's claims
  // Metadata
  createdAt: Timestamp;
}

export interface ClaimStats {
  id: string;
  poolId: string;
  // Time-based stats
  claimsByDay: {
    date: string;
    count: number;
    uniqueUsers: number;
  }[];
  // User stats
  topClaimers: {
    userId: string;
    claimCount: number;
  }[];
  // General stats
  totalClaims: number;
  uniqueClaimers: number;
  averageClaimsPerUser: number;
  // Metadata
  updatedAt: Timestamp;
}
