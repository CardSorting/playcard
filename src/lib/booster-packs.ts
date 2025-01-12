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
} from 'firebase/firestore';
import { db } from './firebase';
import type { BoosterPack, BoosterPackStats } from './booster-pack-schema';
import type { ClaimPool } from './claim-schema';
import { createClaimPool, claimFromPool, getClaimPool } from './claims';
import type { CardData } from '@/components/card-creator/types';

// Create new booster pack
export const createBoosterPack = async (
  userId: string,
  data: {
    name: string;
    description?: string;
    cards: CardData[];
    isPublic?: boolean;
  }
): Promise<BoosterPack> => {
  const cardTypes = data.cards.reduce((acc, card) => {
    acc[card.type] = (acc[card.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const rarityDistribution = data.cards.reduce((acc, card) => {
    const rarity = card.rarity || 'Common';
    acc[rarity] = (acc[rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate tier based on rarity distribution
  const calculateTier = (rarityDistribution: Record<string, number>) => {
    const hasUltraRare = rarityDistribution['Ultra Rare'] > 0 || rarityDistribution['Secret Rare'] > 0;
    const hasRare = rarityDistribution['Rare'] > 0;
    return hasUltraRare ? 'ultra_rare' : hasRare ? 'rare' : 'common';
  };

  const tier = calculateTier(rarityDistribution);

  // Create the booster pack
  const packData: Omit<BoosterPack, 'id'> = {
    userId,
    name: data.name,
    description: data.description,
    cards: data.cards,
    totalCards: data.cards.length,
    cardTypes,
    rarityDistribution,
    status: 'published',
    isPublic: data.isPublic ?? false,
    openCount: 0,
    favoriteCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Create booster pack
  const packRef = await addDoc(collection(db, 'boosterPacks'), packData);

  // Create claim pool for the pack
  const claimLimits = {
    ultra_rare: { total: 10, perUser: 1 },
    rare: { total: 50, perUser: 2 },
    common: { total: 100, perUser: 3 },
  };

  const { total, perUser } = claimLimits[tier];
  const claimPool = await createClaimPool(packRef.id, 'booster_pack', {
    totalLimit: total,
    perUserLimit: perUser,
    tier,
  });

  // Update pack with claim pool reference and initialize stats
  await Promise.all([
    updateDoc(packRef, {
      claimPoolId: claimPool.id,
    }),
    addDoc(collection(db, 'boosterPackStats'), {
      packId: packRef.id,
      mostOpenedCards: [],
      rarityStats: {},
      opensByDay: [],
      updatedAt: Timestamp.now(),
    })
  ]);

  return { id: packRef.id, ...packData };
};

// Get user's booster packs
export const getUserPacks = async (userId: string) => {
  const q = query(
    collection(db, 'boosterPacks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BoosterPack[];
};

// Get public booster packs
export const getPublicPacks = async () => {
  const q = query(
    collection(db, 'boosterPacks'),
    where('isPublic', '==', true),
    where('status', '==', 'published'),
    orderBy('openCount', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BoosterPack[];
};

// Open a booster pack
export const openBoosterPack = async (
  userId: string,
  packId: string
): Promise<{ cards: CardData[] }> => {
  return runTransaction(db, async (transaction) => {
    const packRef = doc(db, 'boosterPacks', packId);
    const packDoc = await transaction.get(packRef);

    if (!packDoc.exists()) {
      throw new Error('Pack not found');
    }

    const pack = packDoc.data() as BoosterPack;
    
    if (!pack.claimPoolId) {
      throw new Error('Pack is not available for claiming');
    }

    // Claim from pool first
    await claimFromPool(pack.claimPoolId, userId);
    
    // Update pack stats
    transaction.update(packRef, {
      openCount: increment(1),
      lastOpenedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update pack stats
    const statsRef = doc(collection(db, 'boosterPackStats'), packId);
    const statsDoc = await transaction.get(statsRef);
    const stats = statsDoc.data() as BoosterPackStats;

    const today = new Date().toISOString().split('T')[0];
    const todayStats = stats.opensByDay.find(day => day.date === today);

    if (todayStats) {
      todayStats.count++;
    } else {
      stats.opensByDay.push({
        date: today,
        count: 1,
      });
    }

    // Update card stats
    pack.cards.forEach(card => {
      const rarity = card.rarity || 'Common';
      if (!stats.rarityStats[rarity]) {
        stats.rarityStats[rarity] = {
          totalOpened: 0,
          averagePerOpening: 0,
        };
      }
      stats.rarityStats[rarity].totalOpened++;
      stats.rarityStats[rarity].averagePerOpening = 
        stats.rarityStats[rarity].totalOpened / stats.opensByDay.reduce((sum, day) => sum + day.count, 0);
    });

    transaction.update(statsRef, {
      ...stats,
      updatedAt: Timestamp.now(),
    });

    return { cards: pack.cards };
  });
};

// Toggle pack favorite
export const togglePackFavorite = async (
  userId: string,
  packId: string
): Promise<boolean> => {
  const favoriteRef = doc(db, `boosterPacks/${packId}/favorites`, userId);
  const favoriteDoc = await getDoc(favoriteRef);

  if (favoriteDoc.exists()) {
    await runTransaction(db, async (transaction) => {
      transaction.delete(favoriteRef);
      transaction.update(doc(db, 'boosterPacks', packId), {
        favoriteCount: increment(-1),
      });
    });
    return false;
  } else {
    await runTransaction(db, async (transaction) => {
      transaction.set(favoriteRef, { createdAt: Timestamp.now() });
      transaction.update(doc(db, 'boosterPacks', packId), {
        favoriteCount: increment(1),
      });

      // Update pack stats
      const statsRef = doc(collection(db, 'boosterPackStats'), packId);
      const statsDoc = await transaction.get(statsRef);
      const stats = statsDoc.data() as BoosterPackStats;

      const today = new Date().toISOString().split('T')[0];
      const todayStats = stats.opensByDay.find(day => day.date === today);

      if (todayStats) {
        todayStats.count++;
      } else {
        stats.opensByDay.push({
          date: today,
          count: 1,
        });
      }

      transaction.update(statsRef, {
        ...stats,
        updatedAt: Timestamp.now(),
      });
    });
    return true;
  }
};

// Helper function to get rarity value for comparison
const getRarityValue = (rarity: string): number => {
  const rarityValues: Record<string, number> = {
    'Common': 0,
    'Uncommon': 1,
    'Rare': 2,
    'Ultra Rare': 3,
    'Secret Rare': 4,
  };
  return rarityValues[rarity] ?? 0;
};
