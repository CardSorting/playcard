import {
  collection,
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
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  CardTemplate,
  CardVersion,
  CardAsset,
  CardCollection,
  CardAnalytics,
  CardGeneration,
  CardComment,
  CardCollaboration,
  CardSet,
} from './card-creator-schema';
import { PokemonType } from '@/components/card-creator/types';

// Create new card template
export const createCard = async (
  userId: string,
  userName: string,
  cardData: {
    name: string;
    type: PokemonType;
    imageUrl: string;
    description?: string;
    isPublic?: boolean;
  }
): Promise<CardTemplate> => {
  const cardTemplate: Omit<CardTemplate, 'id'> = {
    name: cardData.name,
    type: cardData.type,
    imageUrl: cardData.imageUrl,
    description: cardData.description,
    creatorId: userId,
    creatorName: userName,
    hp: 100, // Default values
    attack: 50,
    defense: 50,
    speed: 50,
    abilities: [],
    rarity: 'common',
    serialNumber: generateSerialNumber(),
    status: 'draft',
    isPublic: cardData.isPublic ?? false,
    tags: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const cardRef = await addDoc(collection(db, 'cardTemplates'), cardTemplate);
  
  // Create initial analytics
  await addDoc(collection(db, 'cardAnalytics'), {
    cardId: cardRef.id,
    views: 0,
    likes: 0,
    shares: 0,
    collections: 0,
    totalVersions: 1,
    lastModified: Timestamp.now(),
    listingCount: 0,
    averagePrice: 0,
    totalSales: 0,
    dailyStats: [],
    creatorStats: {
      totalCards: increment(1),
      averageRating: 0,
      followerCount: 0,
    },
    updatedAt: Timestamp.now(),
  });

  return { id: cardRef.id, ...cardTemplate };
};

// Update card template
export const updateCard = async (
  cardId: string,
  userId: string,
  updates: Partial<CardTemplate>
): Promise<void> => {
  return runTransaction(db, async (transaction) => {
    const cardRef = doc(db, 'cardTemplates', cardId);
    const cardDoc = await transaction.get(cardRef);

    if (!cardDoc.exists()) {
      throw new Error('Card not found');
    }

    const card = cardDoc.data() as CardTemplate;
    if (card.creatorId !== userId) {
      throw new Error('Unauthorized to update card');
    }

    // Create version history
    const changes = Object.entries(updates).map(([field, newValue]) => ({
      field,
      oldValue: card[field as keyof CardTemplate],
      newValue,
    }));

    const versionData: Omit<CardVersion, 'id'> = {
      cardId,
      version: (await getDocs(query(
        collection(db, 'cardVersions'),
        where('cardId', '==', cardId)
      ))).size + 1,
      changes,
      createdAt: Timestamp.now(),
      createdBy: userId,
    };

    const versionRef = doc(collection(db, 'cardVersions'));
    transaction.set(versionRef, versionData);

    // Update card
    transaction.update(cardRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    // Update analytics
    const analyticsRef = doc(collection(db, 'cardAnalytics'), cardId);
    transaction.update(analyticsRef, {
      totalVersions: increment(1),
      lastModified: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });
};

// Get card by ID
export const getCard = async (cardId: string): Promise<CardTemplate | null> => {
  const cardDoc = await getDoc(doc(db, 'cardTemplates', cardId));
  if (!cardDoc.exists()) return null;
  return { id: cardDoc.id, ...cardDoc.data() } as CardTemplate;
};

// Get user's cards
export const getUserCards = async (
  userId: string,
  options: {
    status?: CardTemplate['status'];
    limit?: number;
    lastVisible?: any;
  } = {}
): Promise<CardTemplate[]> => {
  const constraints: QueryConstraint[] = [
    where('creatorId', '==', userId),
    orderBy('createdAt', 'desc'),
  ];

  if (options.status) {
    constraints.push(where('status', '==', options.status));
  }
  if (options.limit) {
    constraints.push(limit(options.limit));
  }
  if (options.lastVisible) {
    constraints.push(options.lastVisible);
  }

  const q = query(collection(db, 'cardTemplates'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as CardTemplate);
};

// Add card to collection
export const addToCollection = async (
  userId: string,
  cardId: string,
  collectionId?: string
): Promise<void> => {
  return runTransaction(db, async (transaction) => {
    let collectionRef;

    if (collectionId) {
      collectionRef = doc(db, 'cardCollections', collectionId);
      const collectionDoc = await transaction.get(collectionRef);
      const collectionData = collectionDoc.data() as CardCollection;
      if (!collectionDoc.exists() || collectionData.userId !== userId) {
        throw new Error('Collection not found or unauthorized');
      }
    } else {
      // Get or create default collection
      const defaultCollectionQuery = query(
        collection(db, 'cardCollections'),
        where('userId', '==', userId),
        where('name', '==', 'My Collection'),
        limit(1)
      );
      const defaultCollectionSnapshot = await getDocs(defaultCollectionQuery);
      
      if (defaultCollectionSnapshot.empty) {
        const newCollection: Omit<CardCollection, 'id'> = {
          userId,
          name: 'My Collection',
          cards: [],
          isPublic: false,
          tags: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        collectionRef = doc(collection(db, 'cardCollections'));
        transaction.set(collectionRef, newCollection);
      } else {
        collectionRef = defaultCollectionSnapshot.docs[0].ref;
      }
    }

    // Add card to collection
    transaction.update(collectionRef, {
      cards: arrayUnion({
        cardId,
        addedAt: Timestamp.now(),
        favorite: false,
      }),
      updatedAt: Timestamp.now(),
    });

    // Update analytics
    const analyticsRef = doc(db, 'cardAnalytics', cardId);
    transaction.update(analyticsRef, {
      collections: increment(1),
      updatedAt: Timestamp.now(),
    });
  });
};

// Generate unique serial number
const generateSerialNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`.toUpperCase();
};

// Add comment to card
export const addComment = async (
  cardId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<CardComment> => {
  return runTransaction(db, async (transaction) => {
    const commentData: Omit<CardComment, 'id'> = {
      cardId,
      userId,
      content,
      parentId,
      replyCount: 0,
      reactions: {},
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const commentRef = await addDoc(collection(db, 'cardComments'), commentData);

    if (parentId) {
      const parentRef = doc(db, 'cardComments', parentId);
      transaction.update(parentRef, {
        replyCount: increment(1),
      });
    }

    return { id: commentRef.id, ...commentData };
  });
};

// Share card collaboration
export const shareCard = async (
  cardId: string,
  ownerId: string,
  collaboratorEmail: string,
  role: 'editor' | 'viewer'
): Promise<void> => {
  return runTransaction(db, async (transaction) => {
    const cardRef = doc(db, 'cardTemplates', cardId);
    const cardDoc = await transaction.get(cardRef);
    const cardData = cardDoc.data() as CardTemplate;

    if (!cardDoc.exists() || cardData.creatorId !== ownerId) {
      throw new Error('Card not found or unauthorized');
    }

    // Get user by email
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', collaboratorEmail),
      limit(1)
    );
    const userSnapshot = await getDocs(usersQuery);
    
    if (userSnapshot.empty) {
      throw new Error('User not found');
    }

    const collaboratorId = userSnapshot.docs[0].id;
    const collaborationRef = doc(collection(db, 'cardCollaborations'), cardId);
    
    const collaboration: Omit<CardCollaboration, 'id'> = {
      cardId,
      owner: {
        userId: ownerId,
        role: 'owner',
        permissions: ['*'],
      },
      collaborators: [{
        userId: collaboratorId,
        role,
        permissions: role === 'editor' ? ['edit', 'view'] : ['view'],
        addedAt: Timestamp.now(),
        addedBy: ownerId,
      }],
      accessType: 'shared',
      activity: [{
        userId: ownerId,
        action: 'added_collaborator',
        timestamp: Timestamp.now(),
        details: { collaboratorId, role },
      }],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    transaction.set(collaborationRef, collaboration, { merge: true });
  });
};