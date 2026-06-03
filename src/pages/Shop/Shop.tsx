import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { getProductsByCategory, sortProducts, getAllProducts, getProductBadge } from '../../data/products';
import type { SortOption } from '../../types';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import ProductCard from '../../components/ProductCard/ProductCard';
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard';
import EmptyState from '../../components/EmptyState/EmptyState';
import { formatKSh } from '../../utils/currency';
import './Shop.css';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'One Size'];
const ALL_COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Pink', 'Beige', 'Brown', 'Grey', 'Navy'];

const categoryHero: Record<string, { image: string; title: string; subtitle: string; bg: string }> = {
  watches: {
    image: '/hero/watch.png',
    title: 'Watches',
    subtitle: 'Timeless pieces for every wrist.',
    bg: 'linear-gradient(135deg, #ecfdf3 0%, #d1fae5 100%)',
  },
  dresses: {
    image: '/hero/dress.png',
    title: 'Dresses',
    subtitle: 'Elegant styles for any occasion.',
    bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  },
  pants: {
    image: '/hero/hero2.png',
    title: 'Pants',
    subtitle: 'From tailored to casual, find your fit.',
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  },
  blouses: {
    image: '/hero/shirt.png',
    title: 'Shirts',
    subtitle: 'Versatile tops for every wardrobe.',
    bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  },
  tshirts: {
    image: '/hero/tshirt.png',
    title: 'T-Shirts',
    subtitle: 'Everyday comfort, endless style.',
    bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  },
  sweaters: {
    image: '/hero/hero1.png',
    title: 'Sweaters',
    subtitle: 'Stay cozy and stylish.',
    bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
  },
};

export default function Shop() {
  const { category } = useParams();
  useDocumentTitle(category ? (category === 'blouses' ? 'Shirts' : category.charAt(0).toUpperCase() + category.slice(1)) : 'Shop');
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'rating');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [saleOnly, setSaleOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const items = category ? getProductsByCategory(category) : getAllProducts();

  // Available sizes and colors in the current product set
  const availableSizes = useMemo(() => {
    const s = new Set<string>();
    items.forEach((p) => p.sizes.forEach((sz) => s.add(sz)));
    return ALL_SIZES.filter((sz) => s.has(sz));
  }, [items]);

  const availableColors = useMemo(() => {
    const c = new Set<string>();
    items.forEach((p) => p.colors.forEach((cl) => c.add(cl)));
    return ALL_COLORS.filter((cl) => c.has(cl));
  }, [items]);

  const filtered = useMemo(() => {
    let result = items.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedSizes.size > 0) {
      result = result.filter((p) => p.sizes.some((sz) => selectedSizes.has(sz)));
    }
    if (selectedColors.size > 0) {
      result = result.filter((p) => p.colors.some((cl) => selectedColors.has(cl)));
    }
    if (saleOnly) {
      result = result.filter((p) => getProductBadge(p)?.type === 'sale');
    }

    return sortProducts(result, sort);
  }, [items, sort, priceRange, selectedSizes, selectedColors, saleOnly]);

  const maxPrice = Math.max(...items.map((p) => p.price), 50000);

  const handleSort = (val: SortOption) => {
    setSort(val);
    searchParams.set('sort', val);
    setSearchParams(searchParams);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      next.has(size) ? next.delete(size) : next.add(size);
      return next;
    });
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      next.has(color) ? next.delete(color) : next.add(color);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedSizes(new Set());
    setSelectedColors(new Set());
    setSaleOnly(false);
    setPriceRange([0, maxPrice]);
  };

  const hasActiveFilters = selectedSizes.size > 0 || selectedColors.size > 0 || saleOnly;

  const title = category ? (category === 'blouses' ? 'Shirts' : category.charAt(0).toUpperCase() + category.slice(1)) : 'All Products';

  return (
    <div className="shop">
      {category && categoryHero[category] ? (
        <div className="shop__hero" style={{ background: categoryHero[category].bg }}>
          <div className="shop__hero-content">
            <h1 className="shop__hero-title">{categoryHero[category].title}</h1>
            <p className="shop__hero-subtitle">{categoryHero[category].subtitle}</p>
            <p className="shop__hero-count">{filtered.length} products</p>
          </div>
          <div className="shop__hero-image">
            <img src={categoryHero[category].image} alt={categoryHero[category].title} />
          </div>
        </div>
      ) : (
        <div className="shop__hero" style={{ background: 'linear-gradient(135deg, #f8f6f2 0%, #f0ebe0 100%)' }}>
          <div className="shop__hero-content">
            <h1 className="shop__hero-title">{title}</h1>
            <p className="shop__hero-subtitle">Discover our entire collection in one place.</p>
            <p className="shop__hero-count">{filtered.length} products</p>
          </div>
          <div className="shop__hero-image">
            <img src="/hero/allproducts.png" alt="All Products" />
          </div>
        </div>
      )}

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
              {['watches', 'dresses', 'pants', 'blouses', 'tshirts', 'sweaters'].map((cat) => {
                const display = cat === 'blouses' ? 'Shirts' : cat.charAt(0).toUpperCase() + cat.slice(1);
                return (
                <a
                  key={cat}
                  href={`/shop/${cat}`}
                  className={`filter__cat ${category === cat ? 'filter__cat--active' : ''}`}
                >
                  {display}
                </a>
                );
              })}
            </div>
          </div>

          {availableSizes.length > 0 && (
            <div className="filter">
              <h4 className="filter__title">Size</h4>
              <div className="filter__checks">
                {availableSizes.map((size) => (
                  <label key={size} className="filter__check">
                    <input
                      type="checkbox"
                      checked={selectedSizes.has(size)}
                      onChange={() => toggleSize(size)}
                    />
                    <span>{size}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {availableColors.length > 0 && (
            <div className="filter">
              <h4 className="filter__title">Color</h4>
              <div className="filter__checks">
                {availableColors.map((color) => (
                  <label key={color} className="filter__check">
                    <input
                      type="checkbox"
                      checked={selectedColors.has(color)}
                      onChange={() => toggleColor(color)}
                    />
                    <span>{color}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="filter">
            <h4 className="filter__title">Deals</h4>
            <button
              className={`filter__sale-btn ${saleOnly ? 'filter__sale-btn--active' : ''}`}
              onClick={() => setSaleOnly(!saleOnly)}
            >
              On Sale
              {saleOnly && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m18 6-12 12"/><path d="m6 6 12 12"/>
                </svg>
              )}
            </button>
          </div>

          {hasActiveFilters && (
            <button className="filter__clear" onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
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
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="No products found"
              message="Try adjusting your filters or browse a different category."
              cta={{ label: 'View All Products', href: '/shop' }}
            />
          ) : loading ? (
            <div className="product-grid">
              {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
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
