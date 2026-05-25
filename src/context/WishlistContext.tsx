import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { Product } from '../types';
import { getAllProducts } from '../data/products';

interface WishlistState {
  ids: number[];
}

type WishlistAction =
  | { type: 'TOGGLE'; payload: { productId: number } }
  | { type: 'REMOVE'; payload: { productId: number } };

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'TOGGLE': {
      const exists = state.ids.includes(action.payload.productId);
      return {
        ids: exists
          ? state.ids.filter((id) => id !== action.payload.productId)
          : [...state.ids, action.payload.productId],
      };
    }
    case 'REMOVE':
      return { ids: state.ids.filter((id) => id !== action.payload.productId) };
    default:
      return state;
  }
}

const WISHLIST_KEY = 'wishlist';

function loadWishlist(): number[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

interface WishlistContextType {
  ids: number[];
  items: Product[];
  count: number;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, { ids: loadWishlist() });

  const items = getAllProducts().filter((p) => state.ids.includes(p.id));
  const count = state.ids.length;

  const isInWishlist = useCallback(
    (productId: number) => state.ids.includes(productId),
    [state.ids],
  );

  const toggleWishlist = useCallback((productId: number) => {
    dispatch({ type: 'TOGGLE', payload: { productId } });
  }, []);

  const removeFromWishlist = useCallback((productId: number) => {
    dispatch({ type: 'REMOVE', payload: { productId } });
  }, []);

  // Persist on every state change
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(state.ids));
  } catch { /* noop */ }

  return (
    <WishlistContext.Provider
      value={{ ids: state.ids, items, count, isInWishlist, toggleWishlist, removeFromWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
