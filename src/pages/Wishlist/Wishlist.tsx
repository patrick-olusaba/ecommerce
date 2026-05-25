import { useWishlist } from '../../context/WishlistContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import EmptyState from '../../components/EmptyState/EmptyState';
import './Wishlist.css';

export default function Wishlist() {
  const { items, count } = useWishlist();

  if (count === 0) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-page__empty">
          <EmptyState
            icon="wishlist"
            title="Your wishlist is empty"
            message="Save your favorite items here. Click the heart icon on any product to add it to your wishlist."
            cta={{ label: 'Browse Products', href: '/shop' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-page__header">
        <h1 className="wishlist-page__title">My Wishlist</h1>
        <span className="wishlist-page__count">{count} {count === 1 ? 'item' : 'items'}</span>
      </div>
      <div className="product-grid">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
