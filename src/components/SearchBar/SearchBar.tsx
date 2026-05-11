import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchProducts } from '../../data/products';
import { formatKSh } from '../../utils/currency';
import './SearchBar.css';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const results = query.trim() ? searchProducts(query).slice(0, 5) : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (id: number) => {
    setQuery('');
    setOpen(false);
    navigate(`/product/${id}`);
  };

  return (
    <div className="search" ref={ref}>
      <div className="search__input-wrap">
        <svg className="search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="search__input"
        />
        {query && (
          <button className="search__clear" onClick={() => setQuery('')} aria-label="Clear search">
            &times;
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="search__dropdown">
          {results.map((p) => (
            <button key={p.id} className="search__result" onClick={() => handleSelect(p.id)}>
              <img src={p.images[0]} alt={p.name} className="search__result-img" />
              <div className="search__result-info">
                <span className="search__result-name">{p.name}</span>
                <span className="search__result-price">{formatKSh(p.price)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query && results.length === 0 && (
        <div className="search__dropdown">
          <p className="search__empty">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
