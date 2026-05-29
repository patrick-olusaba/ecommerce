import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { getProductsByCategory, searchProducts } from '../../data/products';
import { formatKSh } from '../../utils/currency';
import './Header.css';

const megaMenuData: Record<string, { label: string; href: string }[]> = {
  watches: [
    { label: 'Chronograph', href: '/shop/watches' },
    { label: 'Minimalist', href: '/shop/watches' },
    { label: 'Sport & Diver', href: '/shop/watches' },
    { label: 'Smart Watches', href: '/shop/watches' },
    { label: 'Vintage', href: '/shop/watches' },
    { label: 'Ceramic', href: '/shop/watches' },
  ],
  dresses: [
    { label: 'Midi Dresses', href: '/shop/dresses' },
    { label: 'Maxi Dresses', href: '/shop/dresses' },
    { label: 'Mini Dresses', href: '/shop/dresses' },
    { label: 'Cocktail & Evening', href: '/shop/dresses' },
    { label: 'Shirt Dresses', href: '/shop/dresses' },
    { label: 'Wrap Dresses', href: '/shop/dresses' },
  ],
  pants: [
    { label: 'Wide-Leg', href: '/shop/pants' },
    { label: 'Slim & Skinny', href: '/shop/pants' },
    { label: 'Jeans', href: '/shop/pants' },
    { label: 'Cargo & Utility', href: '/shop/pants' },
    { label: 'Tailored Trousers', href: '/shop/pants' },
    { label: 'Joggers & Loungewear', href: '/shop/pants' },
  ],
  blouses: [
    { label: 'Button-Ups', href: '/shop/blouses' },
    { label: 'Chiffon & Sheer', href: '/shop/blouses' },
    { label: 'Linen Tops', href: '/shop/blouses' },
    { label: 'Peplum', href: '/shop/blouses' },
    { label: 'Tanks & Camis', href: '/shop/blouses' },
    { label: 'Tunics', href: '/shop/blouses' },
  ],
  tshirts: [
    { label: 'Crew Neck', href: '/shop/tshirts' },
    { label: 'V-Neck', href: '/shop/tshirts' },
    { label: 'Graphic Tees', href: '/shop/tshirts' },
    { label: 'Striped & Breton', href: '/shop/tshirts' },
    { label: 'Crop Tops', href: '/shop/tshirts' },
    { label: 'Henley', href: '/shop/tshirts' },
  ],
  sweaters: [
    { label: 'Crew Neck', href: '/shop/sweaters' },
    { label: 'V-Neck', href: '/shop/sweaters' },
    { label: 'Turtleneck', href: '/shop/sweaters' },
    { label: 'Cardigans', href: '/shop/sweaters' },
    { label: 'Pullovers', href: '/shop/sweaters' },
    { label: 'Knit Vests', href: '/shop/sweaters' },
  ],
};

const categoryDisplay: Record<string, string> = {
  blouses: 'Shirts',
};

export default function Header() {
  const { itemCount, cartBounce, toggleCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleMenuEnter = (cat: string) => setMenuOpen(cat);
  const handleMenuLeave = () => setMenuOpen(null);

  const previewProducts = menuOpen ? getProductsByCategory(menuOpen).slice(0, 3) : [];

  const searchResults = searchQuery.length >= 2 ? searchProducts(searchQuery).slice(0, 6) : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const handleSearchBlur = () => {
    setTimeout(() => setSearchOpen(false), 200);
  };

  return (
    <header className="header">
      {/* Promo Bar */}
      {promoOpen && (
        <div className="header__promo-bar">
          <div className="header__promo-inner">
            <p className="header__promo-text">Get 20% OFF on Your First Order!</p>
            <button className="header__promo-cta" type="button">Claim Offer</button>
            <button
              className="header__promo-close"
              type="button"
              onClick={() => setPromoOpen(false)}
              aria-label="Close promo"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="0" y="12.5" width="17.5" height="2" rx="1" transform="rotate(-45 0 12.5)" fill="#fff"/>
                <rect x="12.5" y="14" width="17.5" height="2" rx="1" transform="rotate(-135 12.5 14)" fill="#fff"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Nav */}
      <div className="header__main">
        <div className="header__container">
          <Link to="/" className="header__logo">
            <span className="header__logo-icon">&#x25C7;</span>
            AVY<span className="header__logo-accent">TRENDY</span>
            <span className="header__logo-dot">.</span>
          </Link>

          <nav className="header__nav">
            {Object.keys(megaMenuData).map((cat) => (
              <div
                key={cat}
                className="header__nav-item"
                onMouseEnter={() => handleMenuEnter(cat)}
                onMouseLeave={handleMenuLeave}
              >
                <Link
                  to={`/shop/${cat}`}
                  className={`header__nav-link ${menuOpen === cat ? 'header__nav-link--active' : ''}`}
                >
                  {categoryDisplay[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Link>
              </div>
            ))}
          </nav>

          {/* Search Pill */}
          <div className="header__search" ref={searchRef}>
            <svg className="header__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21 21-4.34-4.34"/>
              <circle cx="11" cy="11" r="8"/>
            </svg>
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: 'flex' }}>
              <input
                className="header__search-input"
                type="text"
                placeholder="Search products"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onBlur={handleSearchBlur}
              />
            </form>
            {/* Search Dropdown */}
            {searchOpen && searchResults.length > 0 && (
              <div className="header__search-dropdown">
                {searchResults.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="header__search-item"
                    onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                  >
                    <img src={p.images[0]} alt={p.name} className="header__search-img" />
                    <div className="header__search-info">
                      <span className="header__search-name">{p.name}</span>
                      <span className="header__search-price">{formatKSh(p.price)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="header__actions">
            <button
              className={`header__hamburger ${mobileMenuOpen ? 'header__hamburger--open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
            <Link to="/track-order" className="header__track-btn" aria-label="Track Order">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </Link>
            {user && (
              <Link to="/wishlist" className="header__wishlist-btn" aria-label="Wishlist">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {wishlistCount > 0 && <span className="header__cart-badge">{wishlistCount}</span>}
              </Link>
            )}
            {/* User Account */}
            {user ? (
              <div className="header__user-menu-wrap" style={{ position: 'relative' }}>
                <button
                  className="header__user-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="Account menu"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="header__user-avatar header__user-avatar--img"
                    />
                  ) : (
                    <span className="header__user-avatar">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>
                {userMenuOpen && (
                  <>
                    <div className="header__user-dialog-overlay" onClick={() => setUserMenuOpen(false)} />
                    <div className="header__user-dialog">
                      <div className="header__user-dialog-header">
                        <span className="header__user-dialog-name">{user.displayName || 'User'}</span>
                        <span className="header__user-dialog-email">{user.email}</span>
                      </div>
                      <div className="header__user-dialog-links">
                        <Link to="/track-order" className="header__user-dialog-link" onClick={() => setUserMenuOpen(false)}>
                          Track Order
                        </Link>
                      </div>
                      <button
                        className="header__user-dialog-logout"
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/auth" className="header__user-btn" aria-label="Sign in">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </Link>
            )}
            <button
              className={`header__cart-btn ${cartBounce ? 'header__cart-btn--bounce' : ''}`}
              onClick={toggleCart}
              aria-label="Open cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
              <span className="header__cart-label">Cart</span>
              {itemCount > 0 && <span className="header__cart-badge">{itemCount}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu__overlay ${mobileMenuOpen ? 'mobile-menu__overlay--open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />
      <div className={`mobile-menu ${mobileMenuOpen ? 'mobile-menu--open' : ''}`}>
        <div className="mobile-menu__header">
          <span className="mobile-menu__title">Menu</span>
          <button
            className="mobile-menu__close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            &times;
          </button>
        </div>
        <div className="mobile-menu__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m21 21-4.34-4.34"/>
            <circle cx="11" cy="11" r="8"/>
          </svg>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                setSearchQuery('');
                setMobileMenuOpen(false);
              }
            }}
            style={{ flex: 1, display: 'flex' }}
          >
            <input
              className="mobile-menu__search-input"
              type="text"
              placeholder="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        <nav className="mobile-menu__nav">
          <Link to="/" className="mobile-menu__link" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/track-order" className="mobile-menu__link" onClick={() => setMobileMenuOpen(false)}>
            Track Order
          </Link>
          {Object.keys(megaMenuData).map((cat) => (
            <Link
              key={cat}
              to={`/shop/${cat}`}
              className="mobile-menu__link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {categoryDisplay[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mega Menu Dropdown */}
      {menuOpen && (
        <div
          className="mega-menu"
          onMouseEnter={() => setMenuOpen(menuOpen)}
          onMouseLeave={handleMenuLeave}
        >
          <div className="mega-menu__container">
            <div className="mega-menu__links">
              <h4 className="mega-menu__heading">
                {categoryDisplay[menuOpen] || menuOpen.charAt(0).toUpperCase() + menuOpen.slice(1)}
              </h4>
              <div className="mega-menu__grid">
                {megaMenuData[menuOpen].map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="mega-menu__link"
                    onClick={handleMenuLeave}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <Link
                to={`/shop/${menuOpen}`}
                className="mega-menu__view-all"
                onClick={handleMenuLeave}
              >
                View All {categoryDisplay[menuOpen] || menuOpen.charAt(0).toUpperCase() + menuOpen.slice(1)} &rarr;
              </Link>
            </div>
            <div className="mega-menu__products">
              {previewProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="mega-menu__product"
                  onClick={handleMenuLeave}
                >
                  <img src={p.images[0]} alt={p.name} className="mega-menu__product-img" />
                  <span className="mega-menu__product-name">{p.name}</span>
                  <span className="mega-menu__product-price">{formatKSh(p.price)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
