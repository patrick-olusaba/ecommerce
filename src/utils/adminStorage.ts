import type { Product } from '../types';
import { setDocument, deleteDocument, getDocuments } from '../firebase/firestore';

const STORAGE_KEY = 'avytrendy_admin_products';

export function getAdminProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAdminProduct(product: Product): void {
  const products = getAdminProducts();
  products.push(product);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  void pushProduct(product);
}

export function updateAdminProduct(id: number, updates: Partial<Product>): void {
  const products = getAdminProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return;
  products[index] = { ...products[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  void pushProduct(products[index]);
}

export function deleteAdminProduct(id: number): void {
  const products = getAdminProducts().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  void deleteDocument('products', String(id));
}

export function getNextAdminId(): number {
  const products = getAdminProducts();
  if (products.length === 0) return 9000;
  return Math.max(...products.map((p) => p.id)) + 1;
}

// Firestore is the source of truth so admin edits reach every device; localStorage stays
// as the synchronous cache the rest of the app reads. Rules make writes admin-only, so a
// shopper's browser can never push anything.
function pushProduct(product: Product): Promise<boolean> {
  return setDocument('products', String(product.id), { ...product, createdAt: new Date().toISOString() });
}

/** Pull products into the cache. Call once before first render (see main.tsx). */
export async function syncAdminProducts(): Promise<void> {
  const remote = await getDocuments<Product>('products');
  if (remote.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
    return;
  }
  // Nothing remote yet (first run, or offline): upload what this browser holds so products
  // added before Firestore support aren't lost. Denied silently for non-admins.
  // ponytail: if the last product is deleted on another device, a stale cache re-uploads it here.
  for (const product of getAdminProducts()) void pushProduct(product);
}
