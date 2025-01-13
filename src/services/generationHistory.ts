import { collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ImageUrls {
  main: string;
  variants: string[];
  temporary: string[];
  discord: string;
}

export interface StoredGeneration {
  id: string;
  userId: string;
  prompt: string;
  imageUrls: ImageUrls;
  aspectRatio: string;
  createdAt: Date;
}

const GENERATION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const memoryCache = new Map<string, { value: any, timeout: NodeJS.Timeout }>();

const memoryStorage = {
  set: (key: string, value: any, ttl?: number): void => {
    // Clear existing timeout if present
    if (memoryCache.has(key)) {
      clearTimeout(memoryCache.get(key)!.timeout);
    }

    // Set new value with timeout
    const timeout = ttl ? setTimeout(() => memoryCache.delete(key), ttl) : null;
    memoryCache.set(key, { value, timeout });
  },

  get: (key: string): any => {
    if (!memoryCache.has(key)) return null;
    return memoryCache.get(key)!.value;
  },

  delete: (key: string): void => {
    if (memoryCache.has(key)) {
      clearTimeout(memoryCache.get(key)!.timeout);
      memoryCache.delete(key);
    }
  }
};

export const storeGeneration = async (
  prompt: string,
  aspectRatio: string,
  imageUrls: ImageUrls,
  userId: string
): Promise<void> => {
  try {
    const generationsRef = collection(db, "cardGeneration");
    const generationData = {
      userId,
      prompt,
      imageUrls,
      aspectRatio,
      createdAt: new Date()
    };
    
    // Store in Firestore
    const docRef = await addDoc(generationsRef, generationData);
    
    // Cache in memory
    memoryStorage.set(
      `generation:${userId}:${docRef.id}`,
      { ...generationData, id: docRef.id },
      GENERATION_CACHE_TTL
    );
  } catch (error) {
    console.error("Error storing generation:", error);
    throw error;
  }
};

export const loadPreviousGenerations = async (userId: string): Promise<StoredGeneration[]> => {
  try {
    // Try to get from memory cache first
    const cachedGenerations = memoryStorage.get(`generations:${userId}`);
    if (cachedGenerations) {
      return cachedGenerations;
    }

    // Fallback to Firestore
    const generationsRef = collection(db, "cardGeneration");
    const q = query(
      generationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const generations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as StoredGeneration[];

    // Cache results in memory
    memoryStorage.set(
      `generations:${userId}`,
      generations,
      GENERATION_CACHE_TTL
    );

    return generations;
  } catch (error) {
    console.error("Error loading previous generations:", error);
    throw error;
  }
};