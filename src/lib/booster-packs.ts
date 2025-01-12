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
import type { BoosterPack, PackOpening, PackAnalytics } from './booster-pack-schema';
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

  const packRef = await addDoc(collection(db, 'boosterPacks'), packData);

  // Initialize analytics
  await addDoc(collection(db, 'packAnalytics'), {
    packId: packRef.id,
    dailyStats: [],
    pullRates: {},
    rarityStats: {},
    lastUpdated: Timestamp.now(),
  });

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
): Promise<PackOpening> => {
  return runTransaction(db, async (transaction) => {
    const packRef = doc(db, 'boosterPacks', packId);
    const packDoc = await transaction.get(packRef);

    if (!packDoc.exists()) {
      throw new Error('Pack not found');
    }

    const pack = packDoc.data() as BoosterPack;
    
    // Create opening record
    const openingData: Omit<PackOpening, 'id'> = {
      packId,
      userId,
      cards: pack.cards,
      pulledRarities: pack.cards.reduce((acc, card) => {
        const rarity = card.rarity || 'Common';
        acc[rarity] = (acc[rarity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bestPull: pack.cards.reduce((best, card) => {
        const rarityValue = getRarityValue(card.rarity || 'Common');
        const bestValue = best ? getRarityValue(best.rarity) : -1;
        return rarityValue > bestValue ? { cardId: card.id, rarity: card.rarity || 'Common' } : best;
      }, undefined as PackOpening['bestPull']),
      createdAt: Timestamp.now(),
    };

    const openingRef = await addDoc(collection(db, 'packOpenings'), openingData);

    // Update pack stats
    transaction.update(packRef, {
      openCount: increment(1),
      lastOpenedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update analytics
    const analyticsRef = doc(collection(db, 'packAnalytics'), packId);
    const analyticsDoc = await transaction.get(analyticsRef);
    const analytics = analyticsDoc.data() as PackAnalytics;

    const today = new Date().toISOString().split('T')[0];
    const todayStats = analytics.dailyStats.find(stat => stat.date === today);

    if (todayStats) {
      todayStats.opens++;
    } else {
      analytics.dailyStats.push({
        date: today,
        opens: 1,
        favorites: 0,
      });
    }

    // Update pull rates
    pack.cards.forEach(card => {
      const cardStats = analytics.pullRates[card.id] || { pulls: 0, totalOpens: 0 };
      cardStats.pulls++;
      cardStats.totalOpens++;
      analytics.pullRates[card.id] = cardStats;

      const rarity = card.rarity || 'Common';
      const rarityStats = analytics.rarityStats[rarity] || { pulls: 0, totalOpens: 0 };
      rarityStats.pulls++;
      rarityStats.totalOpens++;
      analytics.rarityStats[rarity] = rarityStats;
    });

    transaction.set(analyticsRef, {
      ...analytics,
      lastUpdated: Timestamp.now(),
    });

    return { id: openingRef.id, ...openingData };
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

      // Update analytics
      const analyticsRef = doc(collection(db, 'packAnalytics'), packId);
      const analyticsDoc = await transaction.get(analyticsRef);
      const analytics = analyticsDoc.data() as PackAnalytics;

      const today = new Date().toISOString().split('T')[0];
      const todayStats = analytics.dailyStats.find(stat => stat.date === today);

      if (todayStats) {
        todayStats.favorites++;
      } else {
        analytics.dailyStats.push({
          date: today,
          opens: 0,
          favorites: 1,
        });
      }

      transaction.set(analyticsRef, {
        ...analytics,
        lastUpdated: Timestamp.now(),
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