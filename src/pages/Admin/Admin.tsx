import { useState } from 'react';
import { getAdminProducts, saveAdminProduct, deleteAdminProduct, getNextAdminId } from '../../utils/adminStorage';
import { getAllProducts } from '../../data/products';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getSales, getTodaySales, getWeekSales, getMonthSales, getSalesTotal, getItemsSold, getDailyRevenue, getTopProducts, getSalesForPeriod } from '../../utils/salesStorage';
import { formatKSh } from '../../utils/currency';
import type { Product } from '../../types';
import './Admin.css';

const emptyForm = {
  name: '',
  category: 'watches' as Product['category'],
  price: '',
  description: '',
  sizes: '',
  colors: '',
  featured: false,
  rating: '4.0',
  reviews: '0',
};

const CATEGORIES = ['watches', 'dresses', 'pants', 'blouses', 'tshirts', 'sweaters'] as const;

/* ===== Login ===== */
function AdminLogin() {
  const { login } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    const ok = login(username, password);
    if (!ok) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 className="admin-login__title">Admin Panel</h1>
        <p className="admin-login__subtitle">Sign in to manage your store</p>
        {error && <div className="admin-login__error">{error}</div>}
        <form className="admin-login__form" onSubmit={handleSubmit}>
          <div className="admin-login__field">
            <label className="admin-login__label">Username</label>
            <input
              className="admin-login__input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div className="admin-login__field">
            <label className="admin-login__label">Password</label>
            <input
              className="admin-login__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="········"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="admin-login__btn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

/* ===== Dashboard ===== */
function Dashboard() {
  const { logout } = useAdminAuth();
  const [adminProducts, setAdminProducts] = useState<Product[]>(getAdminProducts());
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'add' | 'sales'>('overview');

  const allProducts = getAllProducts();
  const adminOnly = adminProducts;

  const allSales = getSales();
  const todaySales = getTodaySales();
  const weekSales = getWeekSales();
  const monthSales = getMonthSales();
  const todayRevenue = getSalesTotal(todaySales);
  const weekRevenue = getSalesTotal(weekSales);
  const monthRevenue = getSalesTotal(monthSales);
  const todayItems = getItemsSold(todaySales);
  const weekItems = getItemsSold(weekSales);
  const monthItems = getItemsSold(monthSales);

  const prevWeekSales = getSalesForPeriod(14).filter((s) => {
    const d = new Date(s.date);
    const daysAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo > 7;
  });
  const prevWeekRevenue = getSalesTotal(prevWeekSales);
  const weekTrend = prevWeekRevenue > 0 ? ((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100 : 0;

  const dailyRevenue = getDailyRevenue(14);
  const maxDaily = Math.max(...dailyRevenue.map((d) => d.revenue), 1);
  const topProducts = getTopProducts(5);
  const recentOrders = [...allSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const categoryCounts = CATEGORIES.map((cat) => ({
    cat,
    total: allProducts.filter((p) => p.category === cat).length,
    admin: adminOnly.filter((p) => p.category === cat).length,
  }));

  const featuredCount = allProducts.filter((p) => p.featured).length;
  const avgRating = allProducts.length > 0
    ? (allProducts.reduce((sum, p) => sum + p.rating, 0) / allProducts.length).toFixed(1)
    : '0.0';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || images.length === 0) {
      setMessage('Please fill in name, price, and upload at least one image.');
      return;
    }

    const imageUrls = await Promise.all(images.map(convertToBase64));

    const product: Product = {
      id: getNextAdminId(),
      name: form.name,
      category: form.category,
      price: Number(form.price),
      description: form.description || 'Stylish and affordable, available now at Avytrendy.',
      images: imageUrls,
      sizes: form.sizes ? form.sizes.split(',').map((s) => s.trim()) : ['One Size'],
      colors: form.colors ? form.colors.split(',').map((c) => c.trim()) : ['Default'],
      featured: form.featured,
      rating: Number(form.rating),
      reviews: Number(form.reviews),
    };

    saveAdminProduct(product);
    setAdminProducts(getAdminProducts());
    setForm(emptyForm);
    setImages([]);
    setPreviews([]);
    setMessage('Product added successfully!');
  };

  const handleDelete = (id: number) => {
    deleteAdminProduct(id);
    setAdminProducts(getAdminProducts());
    setMessage('Product deleted.');
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard__sidebar">
        <div className="dashboard__brand">
          <span className="dashboard__brand-icon">&#x25C7;</span>
          <span className="dashboard__brand-name">AVYTRENDY</span>
        </div>
        <nav className="dashboard__nav">
          <button
            className={`dashboard__nav-btn ${activeTab === 'overview' ? 'dashboard__nav-btn--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Overview
          </button>
          <button
            className={`dashboard__nav-btn ${activeTab === 'products' ? 'dashboard__nav-btn--active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            Products
          </button>
          <button
            className={`dashboard__nav-btn ${activeTab === 'add' ? 'dashboard__nav-btn--active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Add Product
          </button>
          <button
            className={`dashboard__nav-btn ${activeTab === 'sales' ? 'dashboard__nav-btn--active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Sales
          </button>
        </nav>
        <button className="dashboard__logout" onClick={logout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="dashboard__main">
        <header className="dashboard__header">
          <h1 className="dashboard__title">
            {activeTab === 'overview' ? 'Dashboard' : activeTab === 'products' ? 'All Products' : activeTab === 'add' ? 'Add Product' : 'Sales'}
          </h1>
          <span className="dashboard__header-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </header>

        {message && (
          <div className="admin__message" onClick={() => setMessage('')}>
            {message}
          </div>
        )}

        {/* === Overview Tab === */}
        {activeTab === 'overview' && (
          <div className="dashboard__overview">
            {/* Stat Cards — gradient style */}
            <div className="stat-cards">
              <div className="stat-card stat-card--blue">
                <div className="stat-card__icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                <div className="stat-card__body">
                  <span className="stat-card__value">{allProducts.length}</span>
                  <span className="stat-card__label">Total Products</span>
                  <span className="stat-card__sub">{CATEGORIES.length} categories</span>
                </div>
              </div>
              <div className="stat-card stat-card--gold">
                <div className="stat-card__icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <div className="stat-card__body">
                  <span className="stat-card__value">{formatKSh(monthRevenue)}</span>
                  <span className="stat-card__label">Monthly Revenue</span>
                  <span className="stat-card__sub">{allSales.length} orders</span>
                </div>
              </div>
              <div className="stat-card stat-card--green">
                <div className="stat-card__icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <div className="stat-card__body">
                  <span className="stat-card__value">{formatKSh(todayRevenue)}</span>
                  <span className="stat-card__label">Today's Revenue</span>
                  <span className="stat-card__sub">{todayItems} items sold today</span>
                </div>
              </div>
              <div className="stat-card stat-card--purple">
                <div className="stat-card__icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="stat-card__body">
                  <span className="stat-card__value">{avgRating}</span>
                  <span className="stat-card__label">Average Rating</span>
                  <span className="stat-card__sub">{featuredCount} featured products</span>
                </div>
              </div>
            </div>

            {/* Sales stat row with trends */}
            <div className="dashboard__stats">
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--sales-today">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{formatKSh(todayRevenue)}</span>
                  <span className="dashboard__stat-label">Today &middot; {todayItems} items</span>
                </div>
              </div>
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--sales-week">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{formatKSh(weekRevenue)}</span>
                  <span className="dashboard__stat-label">
                    This Week &middot; {weekItems} items
                    <span className={`dashboard__trend ${weekTrend >= 0 ? 'dashboard__trend--up' : 'dashboard__trend--down'}`}>
                      {weekTrend >= 0 ? '↑' : '↓'} {Math.abs(weekTrend).toFixed(0)}%
                    </span>
                  </span>
                </div>
              </div>
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--sales-month">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{formatKSh(monthRevenue)}</span>
                  <span className="dashboard__stat-label">This Month &middot; {monthItems} items</span>
                </div>
              </div>
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--orders">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{allSales.length}</span>
                  <span className="dashboard__stat-label">Total Orders</span>
                </div>
              </div>
            </div>

            {/* Sparkline + Top Products */}
            <div className="dashboard__row">
              <div className="dashboard__card dashboard__card--chart">
                <div className="dashboard__card-header">
                  <h3 className="dashboard__card-title">Revenue Trend</h3>
                  <span className="dashboard__card-badge">Last 14 days</span>
                </div>
                <div className="sparkline">
                  <svg viewBox="0 0 280 120" preserveAspectRatio="xMidYMid meet" className="sparkline__svg">
                    <defs>
                      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c9a96e" stopOpacity="0.35"/>
                        <stop offset="100%" stopColor="#c9a96e" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    {/* Baseline */}
                    <line x1="10" y1="105" x2="270" y2="105" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4"/>
                    {/* Area fill */}
                    <path
                      d={`M10,${105 - (dailyRevenue[0]?.revenue || 0) / maxDaily * 95} ${dailyRevenue.map((d, i) => `L${10 + i * (260 / (dailyRevenue.length - 1))},${105 - d.revenue / maxDaily * 95}`).join(' ')} L270,105 L10,105 Z`}
                      fill="url(#sparkGrad)"
                    />
                    {/* Line */}
                    <polyline
                      points={dailyRevenue.map((d, i) => `${10 + i * (260 / (dailyRevenue.length - 1))},${105 - d.revenue / maxDaily * 95}`).join(' ')}
                      fill="none"
                      stroke="#c9a96e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Dots */}
                    {dailyRevenue.map((d, i) => {
                      const cx = 10 + i * (260 / (dailyRevenue.length - 1));
                      const cy = 105 - d.revenue / maxDaily * 95;
                      return d.revenue > 0 ? (
                        <circle key={i} cx={cx} cy={cy} r="3.5" fill="#fff" stroke="#c9a96e" strokeWidth="2"/>
                      ) : null;
                    })}
                    {/* Last dot highlight */}
                    {(() => {
                      const last = dailyRevenue[dailyRevenue.length - 1];
                      const lx = 10 + (dailyRevenue.length - 1) * (260 / (dailyRevenue.length - 1));
                      const ly = 105 - last.revenue / maxDaily * 95;
                      if (last.revenue <= 0) return null;
                      return (
                        <>
                          <circle cx={lx} cy={ly} r="6" fill="#c9a96e" opacity="0.2"/>
                          <circle cx={lx} cy={ly} r="3.5" fill="#c9a96e" stroke="#fff" strokeWidth="2"/>
                        </>
                      );
                    })()}
                  </svg>
                  <div className="sparkline__labels">
                    {dailyRevenue.filter((_, i) => i % 2 === 0).map((d, i) => (
                      <span key={i} className="sparkline__label">{d.day}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="dashboard__card">
                <div className="dashboard__card-header">
                  <h3 className="dashboard__card-title">Top Products</h3>
                  <span className="dashboard__card-badge">By revenue</span>
                </div>
                <div className="top-products">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="top-products__item">
                      <span className="top-products__rank">#{i + 1}</span>
                      <div className="top-products__info">
                        <span className="top-products__name">{p.name}</span>
                        <span className="top-products__meta">{p.count} sold</span>
                      </div>
                      <span className="top-products__revenue">{formatKSh(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Bars + Recent Orders */}
            <div className="dashboard__row">
              <div className="dashboard__card">
                <div className="dashboard__card-header">
                  <h3 className="dashboard__card-title">Products by Category</h3>
                </div>
                <div className="dashboard__category-bars">
                  {categoryCounts.map(({ cat, total, admin }) => (
                    <div key={cat} className="dashboard__bar-row">
                      <span className="dashboard__bar-label">{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                      <div className="dashboard__bar-track">
                        <div
                          className="dashboard__bar-fill"
                          style={{ width: `${allProducts.length > 0 ? (total / allProducts.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="dashboard__bar-count">{total}</span>
                      {admin > 0 && <span className="dashboard__bar-admin">+{admin}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="dashboard__card">
                <div className="dashboard__card-header">
                  <h3 className="dashboard__card-title">Recent Orders</h3>
                  <span className="dashboard__card-badge">{allSales.length} total</span>
                </div>
                <div className="recent-orders">
                  {recentOrders.length === 0 ? (
                    <p className="admin__empty">No orders yet.</p>
                  ) : (
                    recentOrders.map((sale) => (
                      <div key={sale.id} className="recent-orders__item">
                        <div className="recent-orders__avatar">
                          {sale.id.slice(-2)}
                        </div>
                        <div className="recent-orders__info">
                          <span className="recent-orders__id">{sale.id}</span>
                          <span className="recent-orders__meta">
                            {sale.itemCount} item{sale.itemCount !== 1 ? 's' : ''} &middot; {new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span className="recent-orders__total">{formatKSh(sale.total)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === Products Tab === */}
        {activeTab === 'products' && (
          <div className="admin__list">
            <h2 className="admin__section-title">
              Your Products ({adminOnly.length})
            </h2>
            {adminOnly.length === 0 ? (
              <p className="admin__empty">No products added yet. Switch to "Add Product" to create one.</p>
            ) : (
              <div className="admin__grid">
                {adminOnly.map((p) => (
                  <div key={p.id} className="admin__card">
                    <img src={p.images[0]} alt={p.name} className="admin__card-img" />
                    <div className="admin__card-info">
                      <span className="admin__card-name">{p.name}</span>
                      <span className="admin__card-meta">
                        {p.category} &middot; {formatKSh(p.price)}
                      </span>
                    </div>
                    <button
                      className="admin__card-delete"
                      onClick={() => handleDelete(p.id)}
                      aria-label="Delete product"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === Sales Tab === */}
        {activeTab === 'sales' && (
          <div className="sales-tab">
            <div className="dashboard__stats">
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--sales-today">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{formatKSh(todayRevenue)}</span>
                  <span className="dashboard__stat-label">Today &middot; {todayItems} items</span>
                </div>
              </div>
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--sales-week">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{formatKSh(weekRevenue)}</span>
                  <span className="dashboard__stat-label">This Week &middot; {weekItems} items</span>
                </div>
              </div>
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--sales-month">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{formatKSh(monthRevenue)}</span>
                  <span className="dashboard__stat-label">This Month &middot; {monthItems} items</span>
                </div>
              </div>
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--orders">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{allSales.length}</span>
                  <span className="dashboard__stat-label">Total Orders</span>
                </div>
              </div>
            </div>

            <div className="admin__list" style={{ marginTop: 24 }}>
              <h2 className="admin__section-title">
                Recent Orders ({allSales.length})
              </h2>
              {allSales.length === 0 ? (
                <p className="admin__empty">No sales recorded yet. Sales will appear here when customers place orders.</p>
              ) : (
                <div className="sales-table-wrap">
                  <table className="sales-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...allSales].reverse().map((sale) => (
                        <tr key={sale.id}>
                          <td className="sales-table__id">{sale.id}</td>
                          <td>{new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td>{sale.itemCount} item{sale.itemCount !== 1 ? 's' : ''}</td>
                          <td className="sales-table__total">{formatKSh(sale.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === Add Product Tab === */}
        {activeTab === 'add' && (
          <form className="admin__form" onSubmit={handleSubmit}>
            <h2 className="admin__section-title">Add New Product</h2>

            <div className="admin__row">
              <div className="admin__field">
                <label className="admin__label">Product Name *</label>
                <input
                  className="admin__input"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Curren Ladies Watch"
                  required
                />
              </div>
              <div className="admin__field">
                <label className="admin__label">Category *</label>
                <select
                  className="admin__input admin__select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Product['category'] })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin__row admin__row--3">
              <div className="admin__field">
                <label className="admin__label">Price (KSh) *</label>
                <input
                  className="admin__input"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="2500"
                  required
                />
              </div>
              <div className="admin__field">
                <label className="admin__label">Rating</label>
                <input
                  className="admin__input"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
              </div>
              <div className="admin__field">
                <label className="admin__label">Reviews</label>
                <input
                  className="admin__input"
                  type="number"
                  value={form.reviews}
                  onChange={(e) => setForm({ ...form, reviews: e.target.value })}
                />
              </div>
            </div>

            <div className="admin__field">
              <label className="admin__label">Description</label>
              <textarea
                className="admin__input admin__textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Product description..."
                rows={3}
              />
            </div>

            <div className="admin__row">
              <div className="admin__field">
                <label className="admin__label">Sizes (comma separated)</label>
                <input
                  className="admin__input"
                  type="text"
                  value={form.sizes}
                  onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                  placeholder="XS, S, M, L, XL"
                />
              </div>
              <div className="admin__field">
                <label className="admin__label">Colors (comma separated)</label>
                <input
                  className="admin__input"
                  type="text"
                  value={form.colors}
                  onChange={(e) => setForm({ ...form, colors: e.target.value })}
                  placeholder="Red, Blue, Black"
                />
              </div>
            </div>

            <div className="admin__field">
              <label className="admin__label">Images *</label>
              <input
                className="admin__input admin__file"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              {previews.length > 0 && (
                <div className="admin__previews">
                  {previews.map((src, i) => (
                    <img key={i} src={src} alt={`Preview ${i + 1}`} className="admin__preview-img" />
                  ))}
                </div>
              )}
            </div>

            <label className="admin__checkbox">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              <span>Featured product (appears on homepage)</span>
            </label>

            <button type="submit" className="btn btn--primary btn--lg">
              Add Product
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

/* ===== Router ===== */
export default function Admin() {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <Dashboard />;
}
