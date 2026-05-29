import { useParams, Link } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { getProductById, getRelatedProducts, getProductBadge } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import ProductCard from '../../components/ProductCard/ProductCard';
import RecentlyViewed from '../../components/RecentlyViewed/RecentlyViewed';
import useRecentlyViewed from '../../hooks/useRecentlyViewed';
import { formatKSh, FREE_SHIPPING_THRESHOLD } from '../../utils/currency';
import { getReviews, getReviewStats, addReview } from '../../utils/reviewStorage';
import { addDocument } from '../../firebase/firestore';
import type { Review } from '../../utils/reviewStorage';
import './Product.css';

export default function Product() {
  const { id } = useParams();
  const product = id ? getProductById(Number(id)) : undefined;
  useDocumentTitle(product?.name ?? 'Product');
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToast } = useToast();
  const { addToRecentlyViewed } = useRecentlyViewed();

  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] ?? '');
  const [selectedColor, setSelectedColor] = useState(product?.colors[0] ?? '');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('center center');
  const [zooming, setZooming] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleThumbClick = useCallback((i: number) => {
    setActiveImage(i);
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  if (!product) {
    return (
      <div className="not-found">
        <h2>Product not found</h2>
        <Link to="/shop">Back to Shop</Link>
      </div>
    );
  }

  const [reviews, setReviews] = useState<Review[]>(() => getReviews(product.id));
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const reviewStats = useMemo(() => {
    const userStats = getReviewStats(product.id);
    if (userStats.totalReviews === 0) {
      return { avgRating: product.rating, totalReviews: product.reviews };
    }
    // Blend built-in reviews with user reviews
    const totalBuiltInRating = product.rating * product.reviews;
    const totalUserRating = userStats.avgRating * userStats.totalReviews;
    const combinedTotal = product.reviews + userStats.totalReviews;
    return {
      avgRating: Math.round(((totalBuiltInRating + totalUserRating) / combinedTotal) * 10) / 10,
      totalReviews: combinedTotal,
    };
  }, [product.id, product.rating, product.reviews, reviewSubmitted]);

  const badge = useMemo(() => getProductBadge(product), [product]);

  useEffect(() => {
    addToRecentlyViewed(product.id);
  }, [product.id, addToRecentlyViewed]);

  const related = getRelatedProducts(product);
  const displayRating = reviewStats.avgRating || product.rating;
  const displayReviews = reviewStats.totalReviews || product.reviews;
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(displayRating));
  const inWishlist = isInWishlist(product.id);

  const handleWishlistToggle = () => {
    toggleWishlist(product.id);
    addToast(inWishlist ? `Removed from wishlist` : `Added to wishlist`);
  };

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedColor, quantity);
    addToast(`${product.name} added to cart`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) return;
    const newReview: Review = {
      id: `REV-${Date.now()}`,
      productId: product.id,
      name: reviewForm.name.trim(),
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
      date: new Date().toISOString(),
    };
    addReview(newReview);
    await addDocument('reviews', newReview);
    setReviews(getReviews(product.id));
    setReviewForm({ name: '', rating: 5, comment: '' });
    setReviewSubmitted(true);
    addToast('Review submitted! Thank you for your feedback.');
  };

  return (
    <div className="product-page">
      <div className="product-page__breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to={`/shop/${product.category}`}>{product.category === 'blouses' ? 'Shirts' : product.category}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="product-page__main">
        {/* Gallery */}
        <div className="product-gallery">
          <div
            className="product-gallery__main"
            ref={galleryRef}
            onMouseEnter={() => setZooming(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZooming(false)}
          >
            <img
              src={product.images[activeImage]}
              alt={product.name}
              className={`product-gallery__image ${zooming ? 'product-gallery__image--zoomed' : ''}`}
              style={zooming ? { transformOrigin: zoomOrigin } : undefined}
            />
            {badge && (
              <span className={`product-gallery__badge product-gallery__badge--${badge.type}`}>
                {badge.label}
              </span>
            )}
          </div>
          <div className="product-gallery__thumbs">
            {product.images.map((img, i) => (
              <button
                key={i}
                className={`product-gallery__thumb ${i === activeImage ? 'product-gallery__thumb--active' : ''}`}
                onClick={() => handleThumbClick(i)}
              >
                <img src={img} alt={`${product.name} view ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="product-info">
          <span className="product-info__category">{product.category}</span>
          <h1 className="product-info__name">{product.name}</h1>

          <div className="product-info__rating">
            <span className="product-info__stars">
              {stars.map((filled, i) => (
                <span key={i} className={filled ? 'star-filled' : 'star-empty'}>
                  {filled ? '★' : '☆'}
                </span>
              ))}
            </span>
            <span className="product-info__reviews">
              {displayRating} ({displayReviews} reviews)
            </span>
          </div>

          <p className="product-info__price">{formatKSh(product.price)}</p>
          <p className="product-info__desc">{product.description}</p>

          {/* Color */}
          <div className="product-info__option">
            <span className="product-info__label">Color: <strong>{selectedColor}</strong></span>
            <div className="product-info__swatches">
              {product.colors.map((color) => (
                <button
                  key={color}
                  className={`swatch ${color === selectedColor ? 'swatch--active' : ''}`}
                  onClick={() => setSelectedColor(color)}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="product-info__option">
            <span className="product-info__label">Size: <strong>{selectedSize}</strong></span>
            <div className="product-info__sizes">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`size-btn ${size === selectedSize ? 'size-btn--active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Add to Cart */}
          <div className="product-info__cart-row">
            <div className="qty-control">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className="btn btn--primary btn--lg" onClick={handleAddToCart}>
              {added ? 'Added!' : 'Add to Cart'}
            </button>
          </div>

          {/* Wishlist */}
          {user && (
            <button
              className={`product-info__wishlist-btn ${inWishlist ? 'product-info__wishlist-btn--active' : ''}`}
              onClick={handleWishlistToggle}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </button>
          )}

          {/* WhatsApp Share */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Check out this product: ${product.name} — ${window.location.origin}/product/${product.id}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="product-info__whatsapp-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            Share via WhatsApp
          </a>

          {/* Extras */}
          <div className="product-info__extras">
            <div className="product-info__extra">
              &#128666; Free shipping on orders over {formatKSh(FREE_SHIPPING_THRESHOLD)}
            </div>
            <div className="product-info__extra">
              &#8635; 30-day easy returns
            </div>
            <div className="product-info__extra">
              &#128274; Secure checkout
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Bar */}
      <div className="product-sticky-bar">
        <div className="product-sticky-bar__price">
          <span className="product-sticky-bar__label">Price</span>
          <span className="product-sticky-bar__amount">{formatKSh(product.price)}</span>
        </div>
        <button
          className="btn btn--primary btn--lg product-sticky-bar__btn"
          onClick={handleAddToCart}
        >
          {added ? 'Added!' : 'Add to Cart'}
        </button>
      </div>

      {/* Customer Reviews */}
      <section className="product-reviews">
        <h2 className="product-reviews__title">Customer Reviews</h2>

        {/* Review Form */}
        <div className="product-reviews__form-card">
          <h3>Write a Review</h3>
          <form className="product-reviews__form" onSubmit={handleReviewSubmit}>
            <div className="product-reviews__row">
              <div className="product-reviews__field">
                <label>Your Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Wanjiku"
                  value={reviewForm.name}
                  onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="product-reviews__field">
                <label>Rating</label>
                <div className="product-reviews__star-select">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`product-reviews__star-btn ${n <= reviewForm.rating ? 'product-reviews__star-btn--active' : ''}`}
                      onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                      aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="product-reviews__field">
              <label>Your Review *</label>
              <textarea
                placeholder="Share your experience with this product..."
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                required
                rows={3}
              />
            </div>
            <button type="submit" className="product-reviews__submit">
              Submit Review
            </button>
          </form>
        </div>

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="product-reviews__list">
            {reviews.map((review) => (
              <div key={review.id} className="product-reviews__item">
                <div className="product-reviews__item-header">
                  <div className="product-reviews__avatar">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="product-reviews__name">{review.name}</span>
                    <span className="product-reviews__date">
                      {new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="product-reviews__item-stars">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < review.rating ? 'product-reviews__star--filled' : 'product-reviews__star--empty'}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="product-reviews__comment">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="product-reviews__empty">
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="related section">
          <h2 className="section__title">You May Also Like</h2>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed />
    </div>
  );
}
