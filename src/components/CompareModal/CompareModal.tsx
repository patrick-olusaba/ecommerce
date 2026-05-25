import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { formatKSh } from '../../utils/currency';
import './CompareModal.css';

interface Props {
  onClose: () => void;
}

function getColorHex(color: string): string {
  const map: Record<string, string> = {
    'Black': '#1a1a1e', 'White': '#f5f5f5', 'Grey': '#999', 'Navy': '#1e3a5f',
    'Blue': '#3b82f6', 'Red': '#dc2626', 'Green': '#16a34a', 'Brown': '#8b5a2b',
    'Beige': '#d4c5a9', 'Khaki': '#c3b091', 'Olive': '#556b2f', 'Silver': '#c0c0c0',
    'Gold': '#d4a853', 'Burgundy': '#6b1d2d', 'Cream': '#fdf5e6', 'Camel': '#c19a6b',
    'Charcoal': '#36454f', 'Blush': '#de5d83', 'Pink': '#f0b4c4',
  };
  return map[color] || '#ccc';
}

export default function CompareModal({ onClose }: Props) {
  const { items } = useCompare();

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

  return createPortal(
    <div className="cmp-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmp-modal">
        <button className="cmp-modal__close" onClick={onClose} aria-label="Close compare">&times;</button>
        <h2 className="cmp-modal__title">Compare Products</h2>
        <div className="cmp-modal__grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
          {/* Images */}
          {items.map((p) => (
            <div key={`img-${p.id}`} className="cmp-cell cmp-cell--image">
              <img src={p.images[0]} alt={p.name} />
            </div>
          ))}
          {/* Names */}
          {items.map((p) => (
            <div key={`name-${p.id}`} className="cmp-cell cmp-cell--name">
              <Link to={`/product/${p.id}`} onClick={onClose}>{p.name}</Link>
            </div>
          ))}
          {/* Prices */}
          {items.map((p) => (
            <div key={`price-${p.id}`} className="cmp-cell cmp-cell--price">
              {formatKSh(p.price)}
            </div>
          ))}
          {/* Rating */}
          {items.map((p) => (
            <div key={`rating-${p.id}`} className="cmp-cell cmp-cell--rating">
              <span className="cmp-stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={i < Math.floor(p.rating) ? 'star-filled' : 'star-empty'}>
                    {i < Math.floor(p.rating) ? '★' : '☆'}
                  </span>
                ))}
              </span>
              <span className="cmp-rating-num">{p.rating} ({p.reviews})</span>
            </div>
          ))}
          {/* Description */}
          {items.map((p) => (
            <div key={`desc-${p.id}`} className="cmp-cell cmp-cell--desc">
              {p.description}
            </div>
          ))}
          {/* Sizes */}
          {items.map((p) => (
            <div key={`size-${p.id}`} className="cmp-cell cmp-cell--sizes">
              <span className="cmp-label">Sizes:</span> {p.sizes.join(', ')}
            </div>
          ))}
          {/* Colors */}
          {items.map((p) => (
            <div key={`color-${p.id}`} className="cmp-cell cmp-cell--colors">
              <span className="cmp-label">Colors:</span>
              <span className="cmp-color-dots">
                {p.colors.slice(0, 6).map((c) => (
                  <span
                    key={c}
                    className="cmp-color-dot"
                    style={{ background: getColorHex(c) }}
                    title={c}
                  />
                ))}
                {p.colors.length > 6 && <span className="cmp-color-extra">+{p.colors.length - 6}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
