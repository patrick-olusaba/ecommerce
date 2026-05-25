import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { Product } from '../types';
import { getAllProducts } from '../data/products';

const MAX_COMPARE = 4;

interface CompareState {
  ids: number[];
}

type CompareAction =
  | { type: 'TOGGLE'; payload: { productId: number } }
  | { type: 'REMOVE'; payload: { productId: number } }
  | { type: 'CLEAR' };

function compareReducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case 'TOGGLE': {
      const exists = state.ids.includes(action.payload.productId);
      if (exists) {
        return { ids: state.ids.filter((id) => id !== action.payload.productId) };
      }
      if (state.ids.length >= MAX_COMPARE) return state;
      return { ids: [...state.ids, action.payload.productId] };
    }
    case 'REMOVE':
      return { ids: state.ids.filter((id) => id !== action.payload.productId) };
    case 'CLEAR':
      return { ids: [] };
    default:
      return state;
  }
}

const COMPARE_KEY = 'compare';

function loadCompare(): number[] {
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

interface CompareContextType {
  ids: number[];
  items: Product[];
  count: number;
  isInCompare: (productId: number) => boolean;
  toggleCompare: (productId: number) => boolean;
  removeFromCompare: (productId: number) => void;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(compareReducer, { ids: loadCompare() });

  const items = getAllProducts().filter((p) => state.ids.includes(p.id));
  const count = state.ids.length;

  const isInCompare = useCallback(
    (productId: number) => state.ids.includes(productId),
    [state.ids],
  );

  const toggleCompare = useCallback((productId: number): boolean => {
    const exists = state.ids.includes(productId);
    if (exists) {
      dispatch({ type: 'TOGGLE', payload: { productId } });
      return true;
    }
    if (state.ids.length >= MAX_COMPARE) return false;
    dispatch({ type: 'TOGGLE', payload: { productId } });
    return true;
  }, [state.ids]);

  const removeFromCompare = useCallback((productId: number) => {
    dispatch({ type: 'REMOVE', payload: { productId } });
  }, []);

  const clearCompare = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  try {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(state.ids));
  } catch { /* noop */ }

  return (
    <CompareContext.Provider
      value={{ ids: state.ids, items, count, isInCompare, toggleCompare, removeFromCompare, clearCompare }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextType {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
