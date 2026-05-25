import { useMemo, useCallback } from 'react';
import type { Product } from '../types';
import { getAllProducts } from '../data/products';

const RV_KEY = 'recentlyViewed';
const MAX_ITEMS = 10;

function getIds(): number[] {
  try {
    const raw = localStorage.getItem(RV_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function setIds(ids: number[]) {
  try {
    localStorage.setItem(RV_KEY, JSON.stringify(ids));
  } catch { /* noop */ }
}

export default function useRecentlyViewed() {
  const recentProducts = useMemo(() => {
    const ids = getIds();
    const all = getAllProducts();
    return ids
      .map((id) => all.find((p) => p.id === id))
      .filter(Boolean) as Product[];
  }, []);

  const addToRecentlyViewed = useCallback((productId: number) => {
    const ids = getIds();
    const filtered = ids.filter((id) => id !== productId);
    filtered.unshift(productId);
    setIds(filtered.slice(0, MAX_ITEMS));
  }, []);

  return { recentProducts, addToRecentlyViewed };
}
