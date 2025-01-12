import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  increment,
  Timestamp,
  runTransaction,
  QueryConstraint,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ClaimPool, ClaimEvent, ClaimStats } from './claim-schema';

// Create a new claim pool for an item
export const createClaimPool = async (
  itemId: string,
  itemType: ClaimPool['itemType'],
  config: {
    totalLimit: number;
    perUserLimit: number;
    tier: ClaimPool['tier'];
    expiresAt?: Date;
  }
): Promise<ClaimPool> => {
  const poolData: Omit<ClaimPool, 'id'> = {
    itemId,
    itemType,
    totalLimit: config.totalLimit,
    perUserLimit: config.perUserLimit,
    currentClaims: 0,
    claims: {},
    tier: config.tier,
    status: 'active',
    expiresAt: config.expiresAt ? Timestamp.fromDate(config.expiresAt) : undefined,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const poolRef = await addDoc(collection(db, 'claimPools'), poolData);

  // Initialize stats
  await addDoc(collection(db, 'claimStats'), {
    poolId: poolRef.id,
    claimsByDay: [],
    topClaimers: [],
    totalClaims: 0,
    uniqueClaimers: 0,
    averageClaimsPerUser: 0,
    updatedAt: Timestamp.now(),
  });

  return { id: poolRef.id, ...poolData };
};

// Claim an item from a pool
export const claimFromPool = async (
  poolId: string,
  userId: string
): Promise<ClaimEvent> => {
  return runTransaction(db, async (transaction) => {
    const poolRef = doc(db, 'claimPools', poolId);
    const poolDoc = await transaction.get(poolRef);

    if (!poolDoc.exists()) {
      throw new Error('Claim pool not found');
    }

    const pool = poolDoc.data() as ClaimPool;

    // Check pool status
    if (pool.status !== 'active') {
      throw new Error(`Pool is ${pool.status}`);
    }

    // Check expiry
    if (pool.expiresAt && pool.expiresAt.toDate() < new Date()) {
      throw new Error('Pool has expired');
    }

    // Check total limit
    if (pool.currentClaims >= pool.totalLimit) {
      throw new Error('Pool has reached total claim limit');
    }

    // Check user limit
    const userClaims = pool.claims[userId]?.count || 0;
    if (userClaims >= pool.perUserLimit) {
      throw new Error('You have reached your claim limit for this pool');
    }

    // Update pool claims
    const newUserClaims = userClaims + 1;
    const newTotalClaims = pool.currentClaims + 1;

    transaction.update(poolRef, {
      currentClaims: increment(1),
      [`claims.${userId}`]: {
        count: newUserClaims,
        lastClaimedAt: Timestamp.now(),
      },
      status: newTotalClaims >= pool.totalLimit ? 'exhausted' : 'active',
      updatedAt: Timestamp.now(),
    });

    // Create claim event
    const eventData: Omit<ClaimEvent, 'id'> = {
      poolId,
      userId,
      itemId: pool.itemId,
      itemType: pool.itemType,
      claimNumber: newTotalClaims,
      userClaimNumber: newUserClaims,
      createdAt: Timestamp.now(),
    };

    const eventRef = await addDoc(collection(db, 'claimEvents'), eventData);

    // Update stats
    const statsRef = doc(collection(db, 'claimStats'), poolId);
    const statsDoc = await transaction.get(statsRef);
    const stats = statsDoc.data() as ClaimStats;

    const today = new Date().toISOString().split('T')[0];
    const todayStats = stats.claimsByDay.find(day => day.date === today);

    if (todayStats) {
      todayStats.count++;
      if (userClaims === 0) {
        todayStats.uniqueUsers++;
      }
    } else {
      stats.claimsByDay.push({
        date: today,
        count: 1,
        uniqueUsers: 1,
      });
    }

    if (userClaims === 0) {
      stats.uniqueClaimers++;
    }

    stats.totalClaims++;
    stats.averageClaimsPerUser = stats.totalClaims / stats.uniqueClaimers;

    // Update top claimers
    const topClaimerIndex = stats.topClaimers.findIndex(c => c.userId === userId);
    if (topClaimerIndex >= 0) {
      stats.topClaimers[topClaimerIndex].claimCount++;
    } else {
      stats.topClaimers.push({ userId, claimCount: 1 });
    }
    stats.topClaimers.sort((a, b) => b.claimCount - a.claimCount);
    if (stats.topClaimers.length > 10) {
      stats.topClaimers.length = 10;
    }

    transaction.update(statsRef, {
      ...stats,
      updatedAt: Timestamp.now(),
    });

    return { id: eventRef.id, ...eventData };
  });
};

// Get claim pool details
export const getClaimPool = async (poolId: string): Promise<ClaimPool | null> => {
  const poolDoc = await getDoc(doc(db, 'claimPools', poolId));
  if (!poolDoc.exists()) return null;
  return { id: poolDoc.id, ...poolDoc.data() } as ClaimPool;
};

// Get user's claims for a pool
export const getUserClaims = async (poolId: string, userId: string): Promise<number> => {
  const pool = await getClaimPool(poolId);
  return pool?.claims[userId]?.count || 0;
};

// Get claim stats
export const getClaimStats = async (poolId: string): Promise<ClaimStats | null> => {
  const statsDoc = await getDoc(doc(db, 'claimStats', poolId));
  if (!statsDoc.exists()) return null;
  return { id: statsDoc.id, ...statsDoc.data() } as ClaimStats;
};

// Get active pools for an item
export const getActivePoolsForItem = async (
  itemId: string,
  itemType: ClaimPool['itemType']
): Promise<ClaimPool[]> => {
  const q = query(
    collection(db, 'claimPools'),
    where('itemId', '==', itemId),
    where('itemType', '==', itemType),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ClaimPool);
};

// Get pools by tier
export const getPoolsByTier = async (
  tier: ClaimPool['tier'],
  limitCount = 20
): Promise<ClaimPool[]> => {
  const constraints: QueryConstraint[] = [
    where('tier', '==', tier),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  ];

  const q = query(collection(db, 'claimPools'), ...constraints);
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ClaimPool);
};
