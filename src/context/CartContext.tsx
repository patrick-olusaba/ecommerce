import { createContext, useContext, useReducer, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; size: string; color: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: number; size: string; color: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; size: string; color: string; quantity: number } }
  | { type: 'TOGGLE_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'CLEAR_CART' };

const loadCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  localStorage.setItem('cart', JSON.stringify(items));
};

const initialState: CartState = {
  items: loadCart(),
  isOpen: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, size, color, quantity } = action.payload;
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === product.id && item.size === size && item.color === color
      );

      let newItems: CartItem[];
      if (existingIndex >= 0) {
        newItems = state.items.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        newItems = [...state.items, { product, quantity, size, color }];
      }
      saveCart(newItems);
      return { ...state, items: newItems, isOpen: true };
    }
    case 'REMOVE_ITEM': {
      const { productId, size, color } = action.payload;
      const newItems = state.items.filter(
        (item) => !(item.product.id === productId && item.size === size && item.color === color)
      );
      saveCart(newItems);
      return { ...state, items: newItems };
    }
    case 'UPDATE_QUANTITY': {
      const { productId, size, color, quantity } = action.payload;
      const matches = (item: CartItem) =>
        item.product.id === productId && item.size === size && item.color === color;
      if (quantity <= 0) {
        const newItems = state.items.filter((item) => !matches(item));
        saveCart(newItems);
        return { ...state, items: newItems };
      }
      const newItems = state.items.map((item) =>
        matches(item) ? { ...item, quantity } : item
      );
      saveCart(newItems);
      return { ...state, items: newItems };
    }
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    case 'CLEAR_CART':
      saveCart([]);
      return { ...state, items: [], isOpen: false };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  itemCount: number;
  total: number;
  cartBounce: boolean;
  addItem: (product: Product, size: string, color: string, quantity: number) => void;
  removeItem: (productId: number, size: string, color: string) => void;
  updateQuantity: (productId: number, size: string, color: string, quantity: number) => void;
  toggleCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [cartBounce, setCartBounce] = useState(false);
  const bounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const addItem = (product: Product, size: string, color: string, quantity: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, size, color, quantity } });
    setCartBounce(true);
    if (bounceTimer.current) clearTimeout(bounceTimer.current);
    bounceTimer.current = setTimeout(() => setCartBounce(false), 500);
  };

  const value: CartContextType = {
    items: state.items,
    isOpen: state.isOpen,
    itemCount,
    total,
    cartBounce,
    addItem,
    removeItem: (productId, size, color) =>
      dispatch({ type: 'REMOVE_ITEM', payload: { productId, size, color } }),
    updateQuantity: (productId, size, color, quantity) =>
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, size, color, quantity } }),
    toggleCart: () => dispatch({ type: 'TOGGLE_CART' }),
    closeCart: () => dispatch({ type: 'CLOSE_CART' }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
