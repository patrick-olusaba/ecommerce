import type { Product } from '../types';
import { setDocument, deleteDocument, getDocuments } from '../firebase/firestore';

// Built-in products live in code, so admin edits to them are stored separately and applied
// on top (see getAllProducts). Same shape as adminStorage: Firestore is the source of truth,
// localStorage the synchronous cache.
const STORAGE_KEY = 'avytrendy_price_overrides'; // key kept from when only prices were editable

export interface ProductOverride {
  price: number;
  originalPrice: number | null; // null = no strike-through price
  name?: string;
  description?: string;
  stock?: number | null; // null = not tracked
  images?: string[];
  category?: Product['category'];
  sizes?: string[];
  colors?: string[];
  colorImages?: Record<string, string[]>;
}

export function getProductOverrides(): Record<string, ProductOverride> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function save(all: Record<string, ProductOverride>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage full or unavailable
  }
}

export function setProductOverride(id: number, override: ProductOverride): Promise<boolean> {
  save({ ...getProductOverrides(), [id]: override });
  return setDocument('product_overrides', String(id), { ...override, createdAt: new Date().toISOString() });
}

export function clearProductOverride(id: number): Promise<boolean> {
  const all = getProductOverrides();
  delete all[id];
  save(all);
  return deleteDocument('product_overrides', String(id));
}

/** Replace the cache with Firestore's copy. Call once before first render (see main.tsx). */
export async function syncProductOverrides(): Promise<void> {
  const remote = await getDocuments<ProductOverride & { id: string }>('product_overrides');
  // ponytail: getDocuments hides failure behind [] — an empty answer keeps the cache, so
  // resetting the very last override on another device only shows up after that cache clears.
  if (remote.length === 0) return;
  const all: Record<string, ProductOverride> = {};
  for (const { id, ...override } of remote) all[id] = { ...override, originalPrice: override.originalPrice ?? null };
  save(all);
}
