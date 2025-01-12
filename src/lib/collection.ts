import {
  collection as firestoreCollection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
  runTransaction,
  DocumentReference,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  UserCollection,
  CollectionCard,
  CollectionSet,
  CollectionStats,
  CollectionSharing,
  CollectionAchievement,
  CollectionTrade,
  CollectionDisplay
} from './collection-schema';
import { PokemonType, CardData } from '@/components/card-creator/types';

const POKEMON_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting',
  'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost',
  'Dragon', 'Dark', 'Steel', 'Fairy'
] as const;

// Create new collection
export const createCollection = async (
  userId: string,
  data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }
): Promise<UserCollection> => {
  const collectionData: Omit<UserCollection, 'id'> = {
    userId,
    name: data.name,
    description: data.description,
    isPublic: data.isPublic ?? false,
    totalCards: 0,
    uniqueTypes: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const collectionRef = await addDoc(firestoreCollection(db, 'collections'), collectionData);
  
  // Initialize collection stats
  await addDoc(firestoreCollection(db, 'collectionStats'), {
    collectionId: collectionRef.id,
    cardCounts: {
      total: 0,
      byType: {},
      byRarity: {},
    },
    activity: {
      activityByDay: [],
    },
    value: {
      totalEstimated: 0,
      byRarity: {},
      historicalValue: [],
    },
    updatedAt: Timestamp.now(),
  });

  // Initialize display settings
  await addDoc(firestoreCollection(db, 'collectionDisplay'), {
    collectionId: collectionRef.id,
    layout: {
      viewMode: 'grid',
      cardsPerRow: 4,
      showDetails: true,
      animations: true,
    },
    sort: {
      field: 'date',
      direction: 'desc',
    },
    filters: {},
    sections: [],
    updatedAt: Timestamp.now(),
  });

  return { id: collectionRef.id, ...collectionData };
};

// Add card to collection
export const addCardToCollection = async (
  collectionId: string,
  cardId: string,
  cardSnapshot: {
    name: string;
    type: PokemonType;
    imageUrl: string;
    rarity: string;
  },
  options?: {
    nickname?: string;
    notes?: string;
    tags?: string[];
    isFavorite?: boolean;
    showcase?: boolean;
    acquiredFrom?: CollectionCard['acquiredFrom'];
  }
): Promise<void> => {
  return runTransaction(db, async (transaction) => {
    const collectionRef = doc(db, 'collections', collectionId);
    const collectionDoc = await transaction.get(collectionRef);
    
    if (!collectionDoc.exists()) {
      throw new Error('Collection not found');
    }

    const collection = collectionDoc.data() as UserCollection;
    
    // Create collection card
    const collectionCardData: Omit<CollectionCard, 'id'> = {
      collectionId,
      cardId,
      snapshot: {
        name: cardSnapshot.name,
        type: cardSnapshot.type,
        imageUrl: cardSnapshot.imageUrl,
        rarity: cardSnapshot.rarity,
      },
      nickname: options?.nickname,
      notes: options?.notes,
      tags: options?.tags || [],
      isFavorite: options?.isFavorite || false,
      showcase: options?.showcase || false,
      acquiredFrom: options?.acquiredFrom || {
        type: 'created',
        date: Timestamp.now(),
      },
      addedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const cardRef = await addDoc(firestoreCollection(db, 'collectionCards'), collectionCardData);

    // Update collection stats
    const statsRef = doc(firestoreCollection(db, 'collectionStats'), collectionId);
    transaction.update(statsRef, {
      'cardCounts.total': increment(1),
      [`cardCounts.byType.${cardSnapshot.type}`]: increment(1),
      [`cardCounts.byRarity.${cardSnapshot.rarity}`]: increment(1),
      'activity.lastAddedAt': Timestamp.now(),
      [`activity.activityByDay`]: arrayUnion({
        date: new Date().toISOString().split('T')[0],
        adds: 1,
        removes: 0,
      }),
      updatedAt: Timestamp.now(),
    });

    // Update collection
    transaction.update(collectionRef, {
      totalCards: increment(1),
      uniqueTypes: arrayUnion(cardSnapshot.type),
      updatedAt: Timestamp.now(),
    });

    // Check and award achievements
    await checkAchievements(collectionId, collection.userId);
  });
};

// Get collection cards with pagination
export const getCollectionCards = async (
  collectionId: string,
  options: {
    page?: number;
    limit?: number;
    sort?: {
      field: 'name' | 'type' | 'rarity' | 'date';
      direction: 'asc' | 'desc';
    };
    filters?: {
      types?: PokemonType[];
      rarity?: string[];
      favorites?: boolean;
      tags?: string[];
    };
  } = {}
): Promise<{ cards: CollectionCard[]; total: number }> => {
  const constraints: QueryConstraint[] = [
    where('collectionId', '==', collectionId),
  ];

  // Apply filters
  if (options.filters?.types?.length) {
    constraints.push(where('snapshot.type', 'in', options.filters.types));
  }
  if (options.filters?.rarity?.length) {
    constraints.push(where('snapshot.rarity', 'in', options.filters.rarity));
  }
  if (options.filters?.favorites) {
    constraints.push(where('isFavorite', '==', true));
  }
  if (options.filters?.tags?.length) {
    constraints.push(where('tags', 'array-contains-any', options.filters.tags));
  }

  // Apply sort
  if (options.sort) {
    const field = options.sort.field === 'date' ? 'addedAt' : `snapshot.${options.sort.field}`;
    constraints.push(orderBy(field, options.sort.direction));
  } else {
    constraints.push(orderBy('addedAt', 'desc'));
  }

  // Apply pagination
  const pageSize = options.limit || 20;
  if (options.page && options.page > 1) {
    constraints.push(limit(pageSize));
    // Add startAfter if implementing cursor-based pagination
  } else {
    constraints.push(limit(pageSize));
  }

  const q = query(firestoreCollection(db, 'collectionCards'), ...constraints);
  const snapshot = await getDocs(q);

  // Get total count (for pagination)
  const countQ = query(
    firestoreCollection(db, 'collectionCards'),
    where('collectionId', '==', collectionId)
  );
  const countSnapshot = await getDocs(countQ);

  return {
    cards: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as CollectionCard),
    total: countSnapshot.size,
  };
};

// Check and award achievements
const checkAchievements = async (collectionId: string, userId: string): Promise<void> => {
  const statsRef = doc(firestoreCollection(db, 'collectionStats'), collectionId);
  const statsDoc = await getDoc(statsRef);
  const stats = statsDoc.data() as CollectionStats;

  const achievements: Partial<CollectionAchievement>[] = [];

  // Collection size achievements
  const sizeThresholds = [10, 50, 100, 500, 1000];
  const currentSize = stats.cardCounts.total;
  for (const threshold of sizeThresholds) {
    if (currentSize >= threshold) {
      achievements.push({
        collectionId,
        userId,
        type: 'collection_size',
        name: `${threshold} Card Collector`,
        description: `Collect ${threshold} cards`,
        criteria: {
          type: 'count',
          target: threshold,
          progress: currentSize,
        },
        unlockedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  }

  // Type master achievements
  const typeCount = Object.keys(stats.cardCounts.byType).length;
  if (typeCount >= POKEMON_TYPES.length) {
    achievements.push({
      collectionId,
      userId,
      type: 'type_master',
      name: 'Type Master',
      description: 'Collect at least one card of each type',
      criteria: {
        type: 'types',
        target: POKEMON_TYPES.length,
        progress: typeCount,
      },
      unlockedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  // Save new achievements
  for (const achievement of achievements) {
    const q = query(
      firestoreCollection(db, 'collectionAchievements'),
      where('collectionId', '==', collectionId),
      where('type', '==', achievement.type)
    );
    const existing = await getDocs(q);
    
    if (existing.empty) {
      await addDoc(firestoreCollection(db, 'collectionAchievements'), achievement);
    }
  }
};

// Initialize trade
export const initiateTrade = async (
  initiatorId: string,
  recipientId: string,
  offeredCards: { cardId: string; collectionId: string }[]
): Promise<string> => {
  const trade: Omit<CollectionTrade, 'id'> = {
    initiatorId,
    recipientId,
    offer: [
      {
        userId: initiatorId,
        cards: offeredCards,
      },
      {
        userId: recipientId,
        cards: [],
      },
    ],
    status: 'pending',
    messages: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const tradeRef = await addDoc(firestoreCollection(db, 'collectionTrades'), trade);
  return tradeRef.id;
};

// Update collection display settings
export const updateDisplaySettings = async (
  collectionId: string,
  settings: Partial<CollectionDisplay['layout'] & CollectionDisplay['sort'] & CollectionDisplay['filters']>
): Promise<void> => {
  const displayRef = doc(firestoreCollection(db, 'collectionDisplay'), collectionId);
  await updateDoc(displayRef, {
    ...settings,
    updatedAt: Timestamp.now(),
  });
};

// Get user's cards
export const getUserCards = async (userId: string): Promise<CardData[]> => {
  const q = query(
    firestoreCollection(db, 'collectionCards'),
    where('userId', '==', userId),
    orderBy('addedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.snapshot.name,
      type: data.snapshot.type,
      image: data.snapshot.imageUrl,
      rarity: data.snapshot.rarity,
    };
  });
};
