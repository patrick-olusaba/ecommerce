import { collection, doc, addDoc, setDoc, updateDoc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from './config';

// Firestore rejects undefined values outright, nested ones included — drop them
// instead of throwing.
function clean(data: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, isPlainObject(v) ? clean(v) : v])
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

export async function addDocument(collectionName: string, data: object) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db!, collectionName), {
      ...clean(data),
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch {
    return null;
  }
}

/** Write with a caller-chosen id, so the same record can be updated later without a lookup. */
export async function setDocument(collectionName: string, id: string, data: object) {
  if (!db) return false;
  try {
    await setDoc(doc(db!, collectionName, id), clean(data), { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function updateDocument(collectionName: string, id: string, data: object) {
  if (!db) return false;
  try {
    await updateDoc(doc(db!, collectionName, id), clean(data));
    return true;
  } catch {
    return false;
  }
}

export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db!, collectionName, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
  } catch {
    return null;
  }
}

export type AdminCheck = 'ok' | 'not-listed' | 'denied' | 'unavailable';

/**
 * Is this uid in /admins? Unlike getDocument, a rules rejection is reported rather
 * than collapsed into "no such doc" — the two need different fixes.
 */
export async function checkAdmin(uid: string): Promise<AdminCheck> {
  if (!db) return 'unavailable';
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists() ? 'ok' : 'not-listed';
  } catch (err) {
    // Logged because a silent permission-denied here is indistinguishable from
    // "you're just not an admin", and the two need completely different fixes.
    const { code, message } = (err ?? {}) as { code?: string; message?: string };
    console.error(
      `[admin check] admins/${uid} -> ${code}: ${message}` +
      ` | signedInUid=${auth?.currentUser?.uid ?? 'NONE'}` +
      ` | tokenAge=${auth?.currentUser ? 'present' : 'none'}` +
      ` | projectId=${db.app.options.projectId}`
    );
    return code === 'permission-denied' ? 'denied' : 'unavailable';
  }
}

export async function getDocuments<T>(collectionName: string): Promise<T[]> {
  if (!db) return [];
  try {
    const q = query(collection(db!, collectionName), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
  } catch {
    return [];
  }
}

// ponytail: no orderBy — a where+orderBy pair needs a composite index. Sort at the call site.
export async function queryDocuments<T>(collectionName: string, field: string, value: unknown): Promise<T[]> {
  if (!db) return [];
  try {
    const snapshot = await getDocs(query(collection(db!, collectionName), where(field, '==', value)));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
  } catch {
    return [];
  }
}
