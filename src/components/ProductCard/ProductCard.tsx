import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { formatKSh } from '../../utils/currency';
import './ProductCard.css';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(product.rating));
  const hasSale = product.originalPrice && product.originalPrice > product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, product.sizes[0], product.colors[0], 1);
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-card__link">
        <div className="product-card__image-wrap">
          <img
            src={product.images[0]}
            alt={product.name}
            className="product-card__image"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              target.src = `https://placehold.co/600x800/f5f0e8/8b7355?text=${encodeURIComponent(product.name)}`;
            }}
          />
          {product.badge && <span className="product-card__badge">{product.badge}</span>}
          {hasSale && <span className="product-card__sale-badge">Sale</span>}
          <button className="product-card__cart-btn" onClick={handleAddToCart} aria-label="Add to cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </button>
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
