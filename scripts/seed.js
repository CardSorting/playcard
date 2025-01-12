import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with service account
const app = initializeApp({
  credential: cert('/Users/bozoegg/Documents/playcard/cred/playerstcg-bbc59-firebase-adminsdk-lzbr1-9b769a383a.json')
});

const auth = getAuth(app);
const db = getFirestore(app);

// Collection names from initFirestore.ts
const COLLECTIONS = {
  USERS: 'users',
  CARDS: 'cards',
  BOOSTER_PACKS: 'boosterPacks',
  MARKETPLACE_LISTINGS: 'marketplaceListings',
  COLLECTIONS: 'collections',
  CLAIMS: 'claims',
  CART: 'cart',
  CARD_CREATOR: 'cardCreator',
  CARD_GENERATION: 'cardGeneration',
  CARD_COLLABORATION: 'cardCollaboration'
};

// Helper to create a timestamp
const timestamp = () => new Date();

// Sample card data
const sampleCards = [
  {
    name: "Blazing Dragon",
    type: "Fire",
    rarity: "Rare",
    hp: 120,
    attack: 80,
    defense: 60,
    speed: 70,
    description: "A mighty dragon that breathes scorching flames.",
    abilities: [
      {
        name: "Inferno Blast",
        description: "Deals massive fire damage to the opponent.",
        energyCost: 3,
        damage: 90
      }
    ]
  },
  {
    name: "Mystic Mermaid",
    type: "Water",
    rarity: "Ultra Rare",
    hp: 100,
    attack: 60,
    defense: 80,
    speed: 75,
    description: "A graceful creature of the deep seas.",
    abilities: [
      {
        name: "Tidal Wave",
        description: "Summons a massive wave to damage all opponents.",
        energyCost: 2,
        damage: 70
      }
    ]
  },
  {
    name: "Thunder Phoenix",
    type: "Electric",
    rarity: "Legendary",
    hp: 150,
    attack: 90,
    defense: 70,
    speed: 85,
    description: "A legendary bird that controls lightning.",
    abilities: [
      {
        name: "Lightning Strike",
        description: "Calls down lightning from the sky.",
        energyCost: 4,
        damage: 100
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Create test user
    const userEmail = 'test@example.com';
    const userPassword = 'testpassword123';
    
    let testUser;
    try {
      testUser = await auth.createUser({
        email: userEmail,
        password: userPassword,
        emailVerified: true
      });
      console.log('Created test user:', testUser.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        testUser = await auth.getUserByEmail(userEmail);
        console.log('Using existing test user:', testUser.uid);
      } else {
        throw error;
      }
    }

    // Initialize collections with metadata
    for (const collectionName of Object.values(COLLECTIONS)) {
      const metadataRef = db.collection(collectionName).doc('_metadata');
      
      await metadataRef.set({
        createdAt: timestamp(),
        version: '1.0',
        collectionName
      }, { merge: true });
      
      console.log(`Initialized ${collectionName} collection`);
    }

    // Create test user document
    await db.collection(COLLECTIONS.USERS).doc(testUser.uid).set({
      email: userEmail,
      displayName: 'Test User',
      createdAt: timestamp(),
      updatedAt: timestamp()
    });

    // Create sample cards
    const createdCards = [];
    for (const cardData of sampleCards) {
      const cardRef = db.collection(COLLECTIONS.CARDS).doc();
      const card = {
        id: cardRef.id,
        ...cardData,
        creatorId: testUser.uid,
        creatorName: 'Test User',
        imageUrl: `https://picsum.photos/seed/${cardRef.id}/400/600`,
        status: 'published',
        isPublic: true,
        serialNumber: Math.random().toString(36).substring(2, 15),
        tags: [cardData.type.toLowerCase(), cardData.rarity.toLowerCase()],
        createdAt: timestamp(),
        updatedAt: timestamp(),
        publishedAt: timestamp()
      };
      await cardRef.set(card);
      createdCards.push(card);
      console.log(`Created card: ${card.name}`);
    }

    // Create a booster pack
    const boosterPackRef = db.collection(COLLECTIONS.BOOSTER_PACKS).doc();
    const boosterPack = {
      id: boosterPackRef.id,
      userId: testUser.uid,
      creatorName: 'Test User',
      name: 'Elemental Masters Pack',
      description: 'A collection of powerful elemental creatures',
      cards: createdCards,
      totalCards: createdCards.length,
      cardTypes: {
        Fire: 1,
        Water: 1,
        Electric: 1
      },
      rarityDistribution: {
        Rare: 1,
        'Ultra Rare': 1,
        Legendary: 1
      },
      status: 'published',
      isPublic: true,
      openCount: 0,
      favoriteCount: 0,
      createdAt: timestamp(),
      updatedAt: timestamp(),
      publishedAt: timestamp()
    };
    await boosterPackRef.set(boosterPack);
    console.log('Created booster pack:', boosterPack.name);

    // Create a collection for the user
    const collectionRef = db.collection(COLLECTIONS.COLLECTIONS).doc();
    const collection = {
      id: collectionRef.id,
      userId: testUser.uid,
      name: 'My Favorite Cards',
      description: 'A collection of my most powerful cards',
      cards: createdCards.map(card => ({
        cardId: card.id,
        addedAt: timestamp(),
        favorite: true
      })),
      isPublic: true,
      tags: ['favorites', 'powerful'],
      createdAt: timestamp(),
      updatedAt: timestamp()
    };
    await collectionRef.set(collection);
    console.log('Created collection:', collection.name);

    console.log('Database seeded successfully with sample data');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
