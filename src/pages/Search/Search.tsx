import { useSearchParams } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { searchProducts } from '../../data/products';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import ProductCard from '../../components/ProductCard/ProductCard';
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard';
import EmptyState from '../../components/EmptyState/EmptyState';
import './Search.css';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  useDocumentTitle(query ? `Search: ${query}` : 'Search');
  const [inputValue, setInputValue] = useState(query);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInputValue(query);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchProducts(query.trim());
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setLoading(true);
      setSearchParams({ q: inputValue.trim() });
    }
  };

  return (
    <div className="search-page">
      <div className="search-page__container">
        <div className="search-page__hero">
          <h1 className="search-page__title">Search Products</h1>
          <form className="search-page__form" onSubmit={handleSubmit}>
            <svg className="search-page__form-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="search-page__input"
              placeholder="Search for watches, dresses, shirts..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
            <button type="submit" className="search-page__btn">Search</button>
          </form>
        </div>

        {!query.trim() ? (
          <div className="search-page__empty-state">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <h2>Search for products</h2>
            <p>Type something in the search bar above to find products across all categories.</p>
          </div>
        ) : loading ? (
          <div className="product-grid">
            {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon="search"
            title={`No results for "${query}"`}
            message="Try a different search term or browse our categories."
            cta={{ label: 'Browse All Products', href: '/shop' }}
          />
        ) : (
          <>
            <p className="search-page__count">{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
            <div className="product-grid">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
