import { useState } from 'react';
import { useCompare } from '../../context/CompareContext';
import CompareModal from '../CompareModal/CompareModal';
import './CompareBar.css';

export default function CompareBar() {
  const { items, count, removeFromCompare, clearCompare } = useCompare();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className={`compare-bar ${count > 0 ? 'compare-bar--visible' : ''}`}>
        <div className="compare-bar__inner">
          <div className="compare-bar__previews">
            {items.map((product) => (
              <div key={product.id} className="compare-bar__preview">
                <img src={product.images[0]} alt={product.name} />
                <button
                  className="compare-bar__preview-remove"
                  onClick={() => removeFromCompare(product.id)}
                  aria-label={`Remove ${product.name}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="compare-bar__actions">
            <span className="compare-bar__hint">
              {count < 2 ? `Add ${2 - count} more to compare` : `${count} of 4 products`}
            </span>
            <button
              className="btn btn--primary"
              disabled={count < 2}
              onClick={() => setModalOpen(true)}
            >
              Compare ({count})
            </button>
            <button className="compare-bar__clear" onClick={clearCompare}>Clear All</button>
          </div>
        </div>
      </div>
      {modalOpen && <CompareModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
