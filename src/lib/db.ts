import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  QueryConstraint,
  DocumentData,
  WithFieldValue,
  DocumentReference,
  CollectionReference,
} from 'firebase/firestore';
import { db } from './firebase';

// Generic type for Firestore documents
export type FirestoreDoc<T> = T & {
  id: string;
};

// Generic CRUD operations
export const createDocument = async <T extends DocumentData>(
  collectionName: string,
  data: WithFieldValue<T>,
  id?: string
): Promise<FirestoreDoc<T>> => {
  const collectionRef = collection(db, collectionName);
  const docRef = id ? doc(collectionRef, id) : doc(collectionRef);
  await setDoc(docRef, data);
  return { ...data, id: docRef.id } as FirestoreDoc<T>;
};

export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  id: string
): Promise<FirestoreDoc<T> | null> => {
  const docRef = doc(collection(db, collectionName), id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id } as FirestoreDoc<T>;
  }
  return null;
};

export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(collection(db, collectionName), id);
  await updateDoc(docRef, data as DocumentData);
};

export const deleteDocument = async (
  collectionName: string,
  id: string
): Promise<void> => {
  const docRef = doc(collection(db, collectionName), id);
  await deleteDoc(docRef);
};

export const queryDocuments = async <T extends DocumentData>(
  collectionName: string,
  ...queryConstraints: QueryConstraint[]
): Promise<FirestoreDoc<T>[]> => {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...queryConstraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as FirestoreDoc<T>)
  );
};

// Helper function to get a typed collection reference
export const getCollectionRef = <T extends DocumentData>(
  collectionName: string
): CollectionReference<T> => {
  return collection(db, collectionName) as CollectionReference<T>;
};

// Helper function to get a typed document reference
export const getDocumentRef = <T extends DocumentData>(
  collectionName: string,
  id: string
): DocumentReference<T> => {
  return doc(collection(db, collectionName), id) as DocumentReference<T>;
};