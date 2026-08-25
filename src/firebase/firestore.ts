import { collection, doc, addDoc, setDoc, updateDoc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
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
export interface AdminCheckResult {
  status: AdminCheck;
  /** Shown in the UI — a denied check is otherwise impossible to tell apart from "not an admin". */
  detail: string;
}

/**
 * Can this session read the dashboard's data? Probes the real query the dashboard
 * makes rather than reading /admins — isAdmin() resolves server-side via exists(),
 * so the client never needs read access to the admin list itself.
 */
export async function checkAdminAccess(): Promise<AdminCheckResult> {
  if (!db) return { status: 'unavailable', detail: 'Firebase is not configured in this build.' };

  // A request that goes out before the ID token attaches has request.auth == null,
  // which the rules deny — indistinguishable from not being an admin. Rule it out.
  let tokenOk: boolean;
  try {
    tokenOk = Boolean(await auth?.currentUser?.getIdToken());
  } catch {
    tokenOk = false;
  }

  const context = `signed-in-uid=${auth?.currentUser?.uid ?? 'NONE'} token=${tokenOk ? 'ok' : 'MISSING'} project=${db.app.options.projectId}`;

  try {
    await getDocs(query(collection(db, 'orders'), limit(1)));
    return { status: 'ok', detail: context };
  } catch (err) {
    const { code, message } = (err ?? {}) as { code?: string; message?: string };
    console.error(`[admin check] orders list -> ${code}: ${message} | ${context}`);
    return {
      status: code === 'permission-denied' ? 'not-listed' : 'unavailable',
      detail: `${code} | ${context}`,
    };
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
