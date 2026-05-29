import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatKSh } from '../../utils/currency';
import { getProductBadge } from '../../data/products';
import QuickView from '../QuickView/QuickView';
import './ProductCard.css';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useCompare();
  const { addToast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const badge = useMemo(() => getProductBadge(product), [product]);
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(product.rating));
  const hasSale = badge?.type === 'sale';
  const hasAltImage = product.images.length > 1;
  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, product.sizes[0], product.colors[0], 1);
    addToast(`${product.name} added to cart`);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    addToast(inWishlist ? `Removed from wishlist` : `Added to wishlist`);
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = toggleCompare(product.id);
    if (!ok) {
      addToast('You can compare up to 4 products', 'info');
    } else {
      addToast(inCompare ? 'Removed from compare' : 'Added to compare', 'info');
    }
  };

  return (
    <div className="product-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Link to={`/product/${product.id}`} className="product-card__link">
        <div className="product-card__image-wrap">
          {!imageLoaded && <div className="product-card__shimmer" />}
          <img
            src={product.images[0]}
            alt={product.name}
            className={`product-card__image ${imageLoaded ? 'product-card__image--loaded' : ''}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.currentTarget;
              target.src = `https://placehold.co/600x800/f5f0e8/8b7355?text=${encodeURIComponent(product.name)}`;
              setImageLoaded(true);
            }}
          />
          {hasAltImage && (
            <img
              src={product.images[1]}
              alt={`${product.name} alternate`}
              className={`product-card__image-alt ${hovered ? 'product-card__image-alt--visible' : ''}`}
              loading="lazy"
            />
          )}
          {badge && (
            <span className={`product-card__badge product-card__badge--${badge.type}`}>
              {badge.label}
            </span>
          )}
          <div className="product-card__actions">
            <button
              className={`product-card__compare-btn ${inCompare ? 'product-card__compare-btn--active' : ''}`}
              onClick={handleCompareToggle}
              aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="8" height="12" rx="1"/>
                <rect x="14" y="7" width="8" height="8" rx="1"/>
              </svg>
            </button>
            {user && (
              <button
                className={`product-card__wishlist-btn ${inWishlist ? 'product-card__wishlist-btn--active' : ''}`}
                onClick={handleWishlistToggle}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            )}
            <button
              className="product-card__qv-btn"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
              aria-label="Quick view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button className="product-card__cart-btn" onClick={handleAddToCart} aria-label="Add to cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Color dots */}
        <div className="product-card__colors">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color}
              className="product-card__color-dot"
              style={{ background: getColorHex(color) }}
              title={color}
            />
          ))}
          {product.colors.length > 4 && (
            <span className="product-card__color-count">+{product.colors.length - 4}</span>
          )}
        </div>

        <div className="product-card__info">
          <div className="product-card__rating">
            <span className="product-card__stars">
              {stars.map((filled, i) => (
                <span key={i} className={filled ? 'star-filled' : 'star-empty'}>
                  {filled ? '★' : '☆'}
                </span>
              ))}
            </span>
            <span className="product-card__reviews">({product.reviews})</span>
          </div>
          <h3 className="product-card__name">{product.name}</h3>
          <div className="product-card__pricing">
            <span className="product-card__price">{formatKSh(product.price)}</span>
            {hasSale && (
              <span className="product-card__original-price">{formatKSh(product.originalPrice!)}</span>
            )}
          </div>
        </div>
      </Link>
      {quickViewOpen && createPortal(
        <QuickView product={product} onClose={() => setQuickViewOpen(false)} />,
        document.body
      )}
    </div>
  );
}

function getColorHex(color: string): string {
  const map: Record<string, string> = {
    'Black': '#1a1a1e',
    'White': '#f5f5f5',
    'Grey': '#999',
    'Navy': '#1e3a5f',
    'Blue': '#3b82f6',
    'Red': '#dc2626',
    'Green': '#16a34a',
    'Brown': '#8b5a2b',
    'Beige': '#d4c5a9',
    'Khaki': '#c3b091',
    'Olive': '#556b2f',
    'Silver': '#c0c0c0',
    'Gold': '#d4a853',
    'Rose Gold': '#e0b4a4',
    'Burgundy': '#6b1d2d',
    'Cream': '#fdf5e6',
    'Camel': '#c19a6b',
    'Charcoal': '#36454f',
    'Champagne': '#f7e7ce',
    'Blush': '#de5d83',
    'Ivory': '#fffff0',
    'Lavender': '#b39bc8',
    'Lilac': '#c8a2c8',
    'Terracotta': '#cc6b49',
    'Sage': '#9c9e7b',
    'Mocha': '#6b4c3a',
    'Dusty Pink': '#c9a1b0',
    'Dusty Rose': '#c4a3a0',
    'Emerald': '#2e5a3b',
    'Ruby': '#9b111e',
    'Cobalt Blue': '#0047ab',
    'Sky Blue': '#87ceeb',
    'Ocean Blue': '#006994',
    'Sunflower': '#f4d03f',
    'Sand': '#c2b280',
    'Heather Grey': '#b8b8b8',
    'Rust': '#8b3103',
    'Lime': '#84cc16',
    'Nude': '#e8d5c4',
    'Hot Pink': '#ff69b4',
    'Rose': '#ff6b8a',
    'Natural Linen': '#e8dcc8',
    'Midnight Black': '#0a0a0f',
    'Starlight White': '#f8f4f0',
    'Light Wash': '#8fadc4',
    'Medium Wash': '#5a7d9a',
    'Dark Wash': '#2c4d6b',
    'Washed Grey': '#a8a8a8',
    'Vintage Black': '#1f1f24',
    'Grey Marl': '#b0b0b0',
    'Dusty Blue': '#6b8fa3',
    'Natural': '#e8dcc8',
    'Chambray Blue': '#7c9ec0',
    'Floral Blue': '#7ba4c9',
    'Floral Pink': '#e8b4c4',
    'Floral Green': '#8db6a3',
    'Blue Stripe': '#6b8fad',
    'Navy/White': '#2c4d6b',
    'Black/White': '#2a2a2a',
    'Red/Navy': '#8b1111',
    'Pink': '#f0b4c4',
  };
  return map[color] || '#ccc';
}
