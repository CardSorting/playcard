import { collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface StoredGeneration {
  id: string;
  userId: string;
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  createdAt: Date;
}

export const storeGeneration = async (
  prompt: string,
  aspectRatio: string,
  imageUrl: string,
  userId: string
): Promise<void> => {
  try {
    const generationsRef = collection(db, "cardGeneration");
    await addDoc(generationsRef, {
      userId,
      prompt,
      imageUrl,
      aspectRatio,
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Error storing generation:", error);
    throw error;
  }
};

export const loadPreviousGenerations = async (userId: string): Promise<StoredGeneration[]> => {
  try {
    const generationsRef = collection(db, "cardGeneration");
    const q = query(
      generationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as StoredGeneration[];
  } catch (error) {
    console.error("Error loading previous generations:", error);
    throw error;
  }
};