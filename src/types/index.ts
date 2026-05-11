export interface Product {
  id: number;
  name: string;
  category: 'watches' | 'dresses' | 'pants' | 'blouses' | 'tshirts';
  price: number;
  originalPrice?: number;
  badge?: string;
  description: string;
  images: string[];
  sizes: string[];
  colors: string[];
  featured: boolean;
  rating: number;
  reviews: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

export type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'rating';
