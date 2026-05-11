import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { getProductsByCategory, sortProducts, products } from '../../data/products';
import type { SortOption } from '../../types';
import ProductCard from '../../components/ProductCard/ProductCard';
import { formatKSh } from '../../utils/currency';
import './Shop.css';

export default function Shop() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'rating');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  const items = category ? getProductsByCategory(category) : products;

  const filtered = useMemo(() => {
    let result = items.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    return sortProducts(result, sort);
  }, [items, sort, priceRange]);

  const maxPrice = Math.max(...items.map((p) => p.price), 50000);

  const handleSort = (val: SortOption) => {
    setSort(val);
    searchParams.set('sort', val);
    setSearchParams(searchParams);
  };

  const title = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Products';

  return (
    <div className="shop">
      <div className="shop__banner">
        <h1 className="shop__title">{title}</h1>
        <p className="shop__count">{filtered.length} products</p>
      </div>

      <div className="shop__layout">
        {/* Filters Sidebar */}
        <aside className="shop__filters">
          <div className="filter">
            <h4 className="filter__title">Price Range</h4>
            <div className="filter__price-range">
              <input
                type="range"
                min={0}
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="filter__slider"
              />
              <div className="filter__price-labels">
                <span>{formatKSh(priceRange[0])}</span>
                <span>{formatKSh(priceRange[1])}</span>
              </div>
            </div>
          </div>

          <div className="filter">
            <h4 className="filter__title">Category</h4>
            <div className="filter__cats">
              {['watches', 'dresses', 'pants', 'blouses', 'tshirts'].map((cat) => (
                <a
                  key={cat}
                  href={`/shop/${cat}`}
                  className={`filter__cat ${category === cat ? 'filter__cat--active' : ''}`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="shop__main">
          <div className="shop__toolbar">
            <label className="shop__sort">
              <span className="shop__sort-label">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => handleSort(e.target.value as SortOption)}
                className="shop__select"
              >
                <option value="rating">Top Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="shop__empty">
              <p>No products found.</p>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
