import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatKSh } from '../../utils/currency';
import './QuickView.css';

interface Props {
  product: Product;
  onClose: () => void;
}

export default function QuickView({ product, onClose }: Props) {
  const { addItem } = useCart();
  const { addToast } = useToast();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? '');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] ?? '');
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleAdd = () => {
    addItem(product, selectedSize, selectedColor, 1);
    addToast(`${product.name} added to cart`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(product.rating));

  return (
    <div className="qv-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="qv-modal">
        <button className="qv-close" onClick={onClose} aria-label="Close">&times;</button>

        <div className="qv-layout">
          {/* Images */}
          <div className="qv-gallery">
            <div className="qv-gallery__main">
              <img src={product.images[activeImage]} alt={product.name} />
            </div>
            <div className="qv-gallery__thumbs">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`qv-gallery__thumb ${i === activeImage ? 'qv-gallery__thumb--active' : ''}`}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={img} alt={`View ${i + 1}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="qv-info">
            <span className="qv-info__category">{product.category}</span>
            <h2 className="qv-info__name">{product.name}</h2>

            <div className="qv-info__rating">
              <span className="qv-info__stars">
                {stars.map((filled, i) => (
                  <span key={i} className={filled ? 'star-filled' : 'star-empty'}>
                    {filled ? '★' : '☆'}
                  </span>
                ))}
              </span>
              <span className="qv-info__reviews">{product.rating} ({product.reviews} reviews)</span>
            </div>

            <p className="qv-info__price">{formatKSh(product.price)}</p>
            <p className="qv-info__desc">{product.description}</p>

            {/* Color */}
            <div className="qv-info__option">
              <span className="qv-info__label">Color: <strong>{selectedColor}</strong></span>
              <div className="qv-info__swatches">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className={`qv-swatch ${color === selectedColor ? 'qv-swatch--active' : ''}`}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="qv-info__option">
              <span className="qv-info__label">Size: <strong>{selectedSize}</strong></span>
              <div className="qv-info__sizes">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`qv-size ${size === selectedSize ? 'qv-size--active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="qv-info__actions">
              <button className="btn btn--primary btn--lg" onClick={handleAdd} style={{ flex: 1 }}>
                {added ? 'Added!' : 'Add to Cart'}
              </button>
              <Link
                to={`/product/${product.id}`}
                className="btn btn--outline-dark btn--lg"
                onClick={onClose}
              >
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
