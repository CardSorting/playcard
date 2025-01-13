import { collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { redis } from "@/lib/redis";

export interface StoredGeneration {
  id: string;
  userId: string;
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  createdAt: Date;
}

const GENERATION_CACHE_TTL = 24 * 60 * 60; // 24 hours

export const storeGeneration = async (
  prompt: string,
  aspectRatio: string,
  imageUrl: string,
  userId: string
): Promise<void> => {
  try {
    const generationsRef = collection(db, "cardGeneration");
    const generationData = {
      userId,
      prompt,
      imageUrl,
      aspectRatio,
      createdAt: new Date()
    };
    
    // Store in Firestore
    const docRef = await addDoc(generationsRef, generationData);
    
    // Cache in Redis
    await redis.set(
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
    // Try to get from Redis cache first
    const cachedGenerations = await redis.get(`generations:${userId}`);
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

    // Cache results in Redis
    await redis.set(
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