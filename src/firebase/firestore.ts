import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './config';

export async function addDocument(collectionName: string, data: Record<string, unknown>) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db!, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch {
    return null;
  }
}

export async function getDocuments<T>(collectionName: string): Promise<T[]> {
  if (!db) return [];
  try {
    const q = query(collection(db!, collectionName), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
  } catch {
    return [];
  }
}
