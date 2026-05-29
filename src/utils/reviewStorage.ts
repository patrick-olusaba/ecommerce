const STORAGE_KEY = 'avytrendy_reviews';

export interface Review {
  id: string;
  productId: number;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export function getReviews(productId: number): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Review[] = raw ? JSON.parse(raw) : [];
    return all.filter((r) => r.productId === productId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

export function getReviewStats(productId: number): { avgRating: number; totalReviews: number } {
  const reviews = getReviews(productId);
  if (reviews.length === 0) return { avgRating: 0, totalReviews: 0 };
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { avgRating: Math.round(avg * 10) / 10, totalReviews: reviews.length };
}

export function addReview(review: Review): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Review[] = raw ? JSON.parse(raw) : [];
    all.push(review);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage full or unavailable
  }
}
