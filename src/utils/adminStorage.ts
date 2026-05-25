import type { Product } from '../types';

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
}

export function deleteAdminProduct(id: number): void {
  const products = getAdminProducts().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function getNextAdminId(): number {
  const products = getAdminProducts();
  if (products.length === 0) return 9000;
  return Math.max(...products.map((p) => p.id)) + 1;
}
