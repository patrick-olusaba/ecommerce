import { useState, useEffect } from 'react';
import { getAdminProducts, saveAdminProduct, updateAdminProduct, deleteAdminProduct, getNextAdminId } from '../../utils/adminStorage';
import { getAllProducts } from '../../data/products';
import { useAdminAuth } from '../../context/AdminAuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getSales, getTodaySales, getWeekSales, getMonthSales, getSalesTotal, getItemsSold, getDailyRevenue, getTopProducts, getSalesForPeriod, getOrderStatus, updateOrderStatus, syncOrders } from '../../utils/salesStorage';
import { formatKSh } from '../../utils/currency';
import { getDocuments, getDocument } from '../../firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../types';
import type { Sale } from '../../utils/salesStorage';
import './Admin.css';

function exportCSV(sales: Sale[]) {
  const header = 'Order ID,Date,Items,Total,Status';
  const rows = sales.map((s) => {
    const statusLabels = ['', 'Placed', 'Processing', 'Shipped', 'Delivered'];
    return `${s.id},"${new Date(s.date).toLocaleDateString()}",${s.itemCount},${s.total},${statusLabels[getOrderStatus(s)]}`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `avytrendy-sales-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportSubscribersCSV(subs: { email: string; date: string }[]) {
  const header = 'Email,Date Subscribed';
  const rows = subs.map((s) => `${s.email},"${new Date(s.date).toLocaleDateString()}"`);
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `avytrendy-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getLocalSubscribers(): { email: string; date: string }[] {
  try {
    const raw = localStorage.getItem('avytrendy_subscribers');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

const emptyForm = {
  name: '',
  category: 'watches' as Product['category'],
  price: '',
  originalPrice: '',
  badge: '',
  description: '',
  sizes: '',
  colors: '',
  featured: false,
  rating: '4.0',
  reviews: '0',
  stock: '',
};

const CATEGORIES = ['watches', 'dresses', 'pants', 'blouses', 'tshirts', 'sweaters'] as const;

const categoryLabel: Record<string, string> = { blouses: 'Shirts' };

function catDisplay(cat: string) {
  return categoryLabel[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

/* ===== Login ===== */
function AdminLogin() {
  useDocumentTitle('Admin Login');
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
  useDocumentTitle('Admin');
  const { logout } = useAdminAuth();
  const [adminProducts, setAdminProducts] = useState<Product[]>(getAdminProducts());
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'add' | 'sales' | 'orders' | 'subscribers' | 'messages' | 'reviews'>('overview');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  // Only the setter is used — bumping it re-runs the getSales() reads below.
  const [, setSalesRefresh] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [orderSearch, setOrderSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [batchStatus, setBatchStatus] = useState(2);
  const [firestoreSubs, setFirestoreSubs] = useState<{ email: string; date: string }[]>([]);
  const [firestoreMessages, setFirestoreMessages] = useState<{ id: string; name: string; email: string; subject: string; message: string; date: string }[]>([]);
  const [firestoreReviews, setFirestoreReviews] = useState<{ id: string; productId: number; name: string; rating: number; comment: string; date: string }[]>([]);

  // Pull orders placed on customers' devices into the local cache the dashboard reads.
  useEffect(() => {
    void syncOrders().then(() => setSalesRefresh((n) => n + 1));
  }, []);

  useEffect(() => {
    (async () => {
      const subs = await getDocuments<{ email: string; createdAt: string }>('subscribers');
      setFirestoreSubs(subs.map((s) => ({ email: s.email, date: s.createdAt })));
      const msgs = await getDocuments<{ id: string; name: string; email: string; subject: string; message: string; createdAt: string }>('messages');
      setFirestoreMessages(msgs.map((m) => ({ id: m.id, name: m.name, email: m.email, subject: m.subject, message: m.message, date: m.createdAt })));
      const revs = await getDocuments<{ id: string; productId: number; name: string; rating: number; comment: string; createdAt: string }>('reviews');
      setFirestoreReviews(revs.map((r) => ({ id: r.id, productId: r.productId, name: r.name, rating: r.rating, comment: r.comment, date: r.createdAt })));
    })();
  }, [activeTab]);

  const localSubs = getLocalSubscribers();
  const subscribersList = [...localSubs, ...firestoreSubs.filter((fs) => !localSubs.some((ls) => ls.email === fs.email))];
  const localMessages = JSON.parse(localStorage.getItem('avytrendy_contact_messages') || '[]');
  const messagesList = [...localMessages, ...firestoreMessages.filter((fm) => !localMessages.some((lm: { id: string }) => lm.id === fm.id))];
  const localReviews = JSON.parse(localStorage.getItem('avytrendy_reviews') || '[]');
  const reviewsList = [...localReviews, ...firestoreReviews.filter((fr: { id: string }) => !localReviews.some((lr: { id: string }) => lr.id === fr.id))];

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

  const today = new Date().toISOString().split('T')[0];
  const badgeCounts = {
    activeOrders: allSales.filter((s) => getOrderStatus(s) < 4).length,
    ordersToday: allSales.filter((s) => s.date.startsWith(today)).length,
    unreadMessages: messagesList.filter((m: { date: string }) => m.date.startsWith(today)).length,
    newSubsToday: subscribersList.filter((s) => s.date.startsWith(today)).length,
  };

  const orderStatusCounts = {
    placed: allSales.filter((s) => getOrderStatus(s) === 1).length,
    processing: allSales.filter((s) => getOrderStatus(s) === 2).length,
    shipped: allSales.filter((s) => getOrderStatus(s) === 3).length,
    delivered: allSales.filter((s) => getOrderStatus(s) === 4).length,
  };

  const aov = allSales.length > 0 ? allSales.reduce((sum, s) => sum + s.total, 0) / allSales.length : 0;

  const periodLabel = period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month';
  const periodRevenue = period === 'today' ? todayRevenue : period === 'week' ? weekRevenue : monthRevenue;
  const periodItems = period === 'today' ? todayItems : period === 'week' ? weekItems : monthItems;

  const filteredOrders = allSales.filter((s) => {
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return s.id.toLowerCase().includes(q);
  });

  const lowStockProducts = allProducts.filter((p) => p.stock != null && p.stock <= 5);

  const filteredMessages = messagesList.filter((m: { id: string; name: string; email: string; subject: string; message: string; date: string }) => {
    if (!messageSearch) return true;
    const q = messageSearch.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q) || m.message.toLowerCase().includes(q);
  });

  const toggleOrderSelect = (id: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((s) => s.id)));
    }
  };

  const handleBatchStatusUpdate = () => {
    selectedOrders.forEach((id) => updateOrderStatus(id, batchStatus));
    setSalesRefresh((n) => n + 1);
    setSelectedOrders(new Set());
  };

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

  const MAX_DIM = 800;
  const JPEG_QUALITY = 0.7;

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > MAX_DIM || height > MAX_DIM) {
            const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setMessage('Please fill in name and price.');
      return;
    }

    const productData: Product = {
      id: editingId ?? getNextAdminId(),
      name: form.name,
      category: form.category,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      badge: form.badge || undefined,
      description: form.description || 'Stylish and affordable, available now at Avytrendy.',
      images: [],
      sizes: form.sizes ? form.sizes.split(',').map((s) => s.trim()) : ['One Size'],
      colors: form.colors ? form.colors.split(',').map((c) => c.trim()) : ['Default'],
      featured: form.featured,
      rating: Number(form.rating),
      reviews: Number(form.reviews),
      stock: form.stock ? Number(form.stock) : undefined,
    };

    if (editingId) {
      if (images.length > 0) {
        const imageUrls = await Promise.all(images.map(compressImage));
        productData.images = imageUrls;
      } else {
        const existing = adminProducts.find((p) => p.id === editingId);
        productData.images = existing?.images ?? [];
      }
      updateAdminProduct(editingId, productData);
      setMessage('Product updated successfully!');
    } else {
      if (images.length === 0) {
        setMessage('Please upload at least one image.');
        return;
      }
      const imageUrls = await Promise.all(images.map(compressImage));
      productData.images = imageUrls;
      saveAdminProduct(productData);
      setMessage('Product added successfully!');
    }

    setAdminProducts(getAdminProducts());
    setForm(emptyForm);
    setImages([]);
    setPreviews([]);
    setExistingImages([]);
    setEditingId(null);
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      badge: product.badge || '',
      description: product.description,
      sizes: product.sizes.join(', '),
      colors: product.colors.join(', '),
      featured: product.featured,
      rating: String(product.rating),
      reviews: String(product.reviews),
      stock: product.stock != null ? String(product.stock) : '',
    });
    setEditingId(product.id);
    setExistingImages(product.images);
    setPreviews([]);
    setActiveTab('add');
    setMessage('');
  };

  const handleDelete = (id: number) => {
    deleteAdminProduct(id);
    setAdminProducts(getAdminProducts());
    setMessage('Product deleted.');
  };

  return (
    <div className={`dashboard ${sidebarCollapsed ? 'dashboard--sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <nav className="dashboard__navbar">
        <div className="dashboard__navbar-inner">
          <div className="dashboard__brand">
            <img src="/logo/logo.png" alt="Avytrendy" className="dashboard__brand-logo" />
          </div>

          <button
            className="dashboard__collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            )}
          </button>

          <div className="dashboard__nav">
            <div className="dashboard__nav-section">Store</div>
            <button
              className={`dashboard__nav-btn ${activeTab === 'overview' ? 'dashboard__nav-btn--active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span>Overview</span>
            </button>
            <button
              className={`dashboard__nav-btn ${activeTab === 'products' ? 'dashboard__nav-btn--active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <span>Products</span>
            </button>
            <button
              className={`dashboard__nav-btn ${activeTab === 'add' ? 'dashboard__nav-btn--active' : ''}`}
              onClick={() => { setActiveTab('add'); setEditingId(null); setForm(emptyForm); setImages([]); setPreviews([]); setExistingImages([]); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <span>Add Product</span>
            </button>

            <div className="dashboard__nav-section">Analytics</div>
            <button
              className={`dashboard__nav-btn ${activeTab === 'sales' ? 'dashboard__nav-btn--active' : ''}`}
              onClick={() => setActiveTab('sales')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <span>Sales</span>
            </button>
            <button
              className={`dashboard__nav-btn ${activeTab === 'orders' ? 'dashboard__nav-btn--active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Orders</span>
              {badgeCounts.activeOrders > 0 && (
                <span className={`dashboard__nav-badge ${badgeCounts.activeOrders > 3 ? 'dashboard__nav-badge--live' : 'dashboard__nav-badge--highlight'}`}>
                  {badgeCounts.activeOrders}
                </span>
              )}
            </button>

            <div className="dashboard__nav-section">Communication</div>
            <button
              className={`dashboard__nav-btn ${activeTab === 'subscribers' ? 'dashboard__nav-btn--active' : ''}`}
              onClick={() => setActiveTab('subscribers')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Subscribers</span>
              {badgeCounts.newSubsToday > 0 && (
                <span className="dashboard__nav-badge dashboard__nav-badge--highlight">{badgeCounts.newSubsToday}</span>
              )}
            </button>
            <button
              className={`dashboard__nav-btn ${activeTab === 'messages' ? 'dashboard__nav-btn--active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Messages</span>
              {badgeCounts.unreadMessages > 0 && (
                <span className="dashboard__nav-badge dashboard__nav-badge--live">{badgeCounts.unreadMessages}</span>
              )}
            </button>
            <button
              className={`dashboard__nav-btn ${activeTab === 'reviews' ? 'dashboard__nav-btn--active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>Reviews</span>
            </button>
          </div>
          <button className="dashboard__logout" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="dashboard__main">
        {/* Quick Stats Bar */}
        <div className="dashboard__quick-stats">
          <div className="dashboard__quick-stat">
            <span className="dashboard__quick-stat-icon dashboard__quick-stat-icon--green" />
            <strong>{formatKSh(todayRevenue)}</strong> today
          </div>
          <div className="dashboard__quick-stat">
            <span className="dashboard__quick-stat-icon dashboard__quick-stat-icon--amber" />
            <strong>{badgeCounts.activeOrders}</strong> active orders
          </div>
          <div className="dashboard__quick-stat">
            <span className="dashboard__quick-stat-icon dashboard__quick-stat-icon--blue" />
            <strong>{badgeCounts.ordersToday}</strong> orders today
          </div>
          <div className="dashboard__quick-stat">
            <span className="dashboard__quick-stat-icon dashboard__quick-stat-icon--purple" />
            <strong>{allProducts.length}</strong> products
          </div>
        </div>

        <header className="dashboard__header">
          <h1 className="dashboard__title">
            {activeTab === 'overview' ? 'Dashboard' : activeTab === 'products' ? 'All Products' : activeTab === 'add' ? 'Add Product' : activeTab === 'sales' ? 'Sales' : activeTab === 'orders' ? 'Order Management' : activeTab === 'subscribers' ? 'Subscribers' : activeTab === 'messages' ? 'Messages' : 'Reviews'}
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
            {/* Period Toggle */}
            <div className="period-toggle">
              {(['today', 'week', 'month'] as const).map((p) => (
                <button
                  key={p}
                  className={`period-toggle__btn ${period === p ? 'period-toggle__btn--active' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>

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
                  <span className="stat-card__value">{formatKSh(periodRevenue)}</span>
                  <span className="stat-card__label">{periodLabel} Revenue</span>
                  <span className="stat-card__sub">{periodItems} items</span>
                </div>
              </div>
              <div className="stat-card stat-card--green">
                <div className="stat-card__icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="stat-card__body">
                  <span className="stat-card__value">{formatKSh(aov)}</span>
                  <span className="stat-card__label">Avg Order Value</span>
                  <span className="stat-card__sub">{allSales.length} orders</span>
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

            {/* Order Status Summary */}
            <div className="order-status-cards">
              <div className="order-status-card order-status-card--placed">
                <span className="order-status-card__count">{orderStatusCounts.placed}</span>
                <span className="order-status-card__label">Order Placed</span>
              </div>
              <div className="order-status-card order-status-card--processing">
                <span className="order-status-card__count">{orderStatusCounts.processing}</span>
                <span className="order-status-card__label">Processing</span>
              </div>
              <div className="order-status-card order-status-card--shipped">
                <span className="order-status-card__count">{orderStatusCounts.shipped}</span>
                <span className="order-status-card__label">Shipped</span>
              </div>
              <div className="order-status-card order-status-card--delivered">
                <span className="order-status-card__count">{orderStatusCounts.delivered}</span>
                <span className="order-status-card__label">Delivered</span>
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <div className="low-stock-alert">
                <div className="low-stock-alert__header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span>Low Stock Alert &mdash; {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} running low</span>
                </div>
                <div className="low-stock-alert__list">
                  {lowStockProducts.map((p) => (
                    <span key={p.id} className="low-stock-alert__item">
                      {p.name} ({p.stock} left)
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                <div className="revenue-chart">
                  <div className="revenue-chart__grid">
                    <div className="revenue-chart__grid-line" />
                    <div className="revenue-chart__grid-line" />
                    <div className="revenue-chart__grid-line" />
                    <div className="revenue-chart__grid-line" />
                  </div>
                  {dailyRevenue.map((d, i) => {
                    const today = new Date().toISOString().split('T')[0];
                    const dayKey = new Date();
                    dayKey.setDate(dayKey.getDate() - (dailyRevenue.length - 1 - i));
                    const isToday = dayKey.toISOString().split('T')[0] === today;
                    return (
                      <div key={d.day} className="revenue-chart__bar-wrap">
                        <span className="revenue-chart__value">{d.revenue > 0 ? formatKSh(d.revenue) : ''}</span>
                        <div
                          className={`revenue-chart__bar ${d.revenue === 0 ? 'revenue-chart__bar--zero' : ''} ${isToday ? 'revenue-chart__bar--today' : ''}`}
                          style={{ height: `${d.revenue > 0 ? Math.max((d.revenue / maxDaily) * 148, 3) : 2}px` }}
                          title={`${d.day}: ${formatKSh(d.revenue)}`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="revenue-chart__labels">
                  {dailyRevenue.map((d) => (
                    <span key={d.day} className={`revenue-chart__label ${d.day === new Date().toLocaleDateString('en-US', { weekday: 'short' }) ? 'revenue-chart__label--today' : ''}`}>{d.day}</span>
                  ))}
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
                      <span className="dashboard__bar-label">{catDisplay(cat)}</span>
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
                    recentOrders.map((sale) => {
                      const os = getOrderStatus(sale);
                      const statusLabel = ['', 'Placed', 'Processing', 'Shipped', 'Delivered'][os];
                      return (
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
                          <span className={`recent-orders__status recent-orders__status--${os}`}>{statusLabel}</span>
                          <span className="recent-orders__total">{formatKSh(sale.total)}</span>
                        </div>
                      );
                    })
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
                      className="admin__card-edit"
                      onClick={() => handleEdit(p)}
                      aria-label="Edit product"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
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
              <div className="admin__section-header">
                <h2 className="admin__section-title" style={{ margin: 0 }}>
                  Recent Orders ({allSales.length})
                </h2>
                <button className="admin__export-btn" onClick={() => exportCSV(allSales)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export CSV
                </button>
              </div>
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
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...allSales].reverse().map((sale) => {
                        const currentStatus = getOrderStatus(sale);
                        const statusLabels: Record<number, string> = {
                          1: 'Order Placed',
                          2: 'Processing',
                          3: 'Shipped',
                          4: 'Delivered',
                        };
                        return (
                        <tr key={sale.id}>
                          <td className="sales-table__id">{sale.id}</td>
                          <td>{new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td>{sale.itemCount} item{sale.itemCount !== 1 ? 's' : ''}</td>
                          <td className="sales-table__total">{formatKSh(sale.total)}</td>
                          <td>
                            <select
                              className={`order-status-select order-status-select--${currentStatus}`}
                              value={currentStatus}
                              onChange={(e) => {
                                updateOrderStatus(sale.id, Number(e.target.value));
                                setSalesRefresh((n) => n + 1);
                              }}
                            >
                              <option value={1}>{statusLabels[1]}</option>
                              <option value={2}>{statusLabels[2]}</option>
                              <option value={3}>{statusLabels[3]}</option>
                              <option value={4}>{statusLabels[4]}</option>
                            </select>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === Orders Tab === */}
        {activeTab === 'orders' && (
          <div className="orders-tab">
            <div className="dashboard__stats">
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
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--sales-today">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{allSales.filter((s) => getOrderStatus(s) < 4).length}</span>
                  <span className="dashboard__stat-label">Active Orders</span>
                </div>
              </div>
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{allSales.filter((s) => getOrderStatus(s) === 4).length}</span>
                  <span className="dashboard__stat-label">Delivered</span>
                </div>
              </div>
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--sales-month">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{todaySales.length}</span>
                  <span className="dashboard__stat-label">Today's Orders</span>
                </div>
              </div>
            </div>

            <div className="admin__list" style={{ marginTop: 24 }}>
              <div className="admin__section-header">
                <h2 className="admin__section-title" style={{ margin: 0 }}>
                  All Orders ({allSales.length})
                </h2>
                <button className="admin__export-btn" onClick={() => exportCSV(allSales)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export CSV
                </button>
              </div>
              <div className="admin__search-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className="admin__search"
                  type="text"
                  placeholder="Search orders by ID..."
                  value={orderSearch}
                  onChange={(e) => { setOrderSearch(e.target.value); setSelectedOrders(new Set()); }}
                />
                {orderSearch && (
                  <button className="admin__search-clear" onClick={() => setOrderSearch('')}>&times;</button>
                )}
              </div>
              {selectedOrders.size > 0 && (
                <div className="batch-bar">
                  <span className="batch-bar__count">{selectedOrders.size} selected</span>
                  <select
                    className="batch-bar__select"
                    value={batchStatus}
                    onChange={(e) => setBatchStatus(Number(e.target.value))}
                  >
                    <option value={2}>Processing</option>
                    <option value={3}>Shipped</option>
                    <option value={4}>Delivered</option>
                  </select>
                  <button className="batch-bar__apply" onClick={handleBatchStatusUpdate}>
                    Apply
                  </button>
                  <button className="batch-bar__cancel" onClick={() => setSelectedOrders(new Set())}>
                    Cancel
                  </button>
                </div>
              )}
              {allSales.length === 0 ? (
                <p className="admin__empty">No orders yet. Orders will appear here when customers place them.</p>
              ) : filteredOrders.length === 0 ? (
                <p className="admin__empty">No orders match your search.</p>
              ) : (
                <div className="sales-table-wrap">
                  <table className="sales-table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>
                          <input
                            type="checkbox"
                            checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                            onChange={toggleAllOrders}
                          />
                        </th>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...filteredOrders].reverse().map((sale) => {
                        const currentStatus = getOrderStatus(sale);
                        const statusLabels: Record<number, string> = {
                          1: 'Order Placed',
                          2: 'Processing',
                          3: 'Shipped',
                          4: 'Delivered',
                        };
                        const isExpanded = expandedOrder === sale.id;
                        return (
                          <tr key={sale.id} className={`sales-table__row ${isExpanded ? 'sales-table__row--expanded' : ''}`}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedOrders.has(sale.id)}
                                onChange={() => toggleOrderSelect(sale.id)}
                              />
                            </td>
                            <td className="sales-table__id">{sale.id}</td>
                            <td>{new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td>{sale.itemCount} item{sale.itemCount !== 1 ? 's' : ''}</td>
                            <td className="sales-table__total">{formatKSh(sale.total)}</td>
                            <td>
                              <select
                                className={`order-status-select order-status-select--${currentStatus}`}
                                value={currentStatus}
                                onChange={(e) => {
                                  updateOrderStatus(sale.id, Number(e.target.value));
                                  setSalesRefresh((n) => n + 1);
                                }}
                              >
                                <option value={1}>{statusLabels[1]}</option>
                                <option value={2}>{statusLabels[2]}</option>
                                <option value={3}>{statusLabels[3]}</option>
                                <option value={4}>{statusLabels[4]}</option>
                              </select>
                            </td>
                            <td>
                              <button
                                className="sales-table__expand-btn"
                                onClick={() => setExpandedOrder(isExpanded ? null : sale.id)}
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? '−' : '+'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {/* Expanded detail panel */}
                  {expandedOrder && [...allSales].reverse().filter((s) => s.id === expandedOrder).map((sale) => (
                    <div key={`detail-${sale.id}`} className="order-detail">
                      <h4 className="order-detail__title">Order {sale.id} — Line Items</h4>
                      <table className="order-detail__items">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sale.items.map((item, i) => (
                            <tr key={i}>
                              <td>{item.name}</td>
                              <td>{item.quantity}</td>
                              <td>{formatKSh(item.price)}</td>
                              <td className="order-detail__subtotal">{formatKSh(item.price * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} className="order-detail__total-label">Total</td>
                            <td className="order-detail__total-value">{formatKSh(sale.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === Subscribers Tab === */}
        {activeTab === 'subscribers' && (
          <div className="subscribers-tab">
            <div className="dashboard__stats">
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--orders">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{subscribersList.length}</span>
                  <span className="dashboard__stat-label">Total Subscribers</span>
                </div>
              </div>
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{subscribersList.filter((s) => s.date.startsWith(new Date().toISOString().split('T')[0])).length}</span>
                  <span className="dashboard__stat-label">New Today</span>
                </div>
              </div>
            </div>

            <div className="admin__list" style={{ marginTop: 24 }}>
              <div className="admin__section-header">
                <h2 className="admin__section-title" style={{ margin: 0 }}>
                  All Subscribers ({subscribersList.length})
                </h2>
                <button className="admin__export-btn" onClick={() => exportSubscribersCSV(subscribersList)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export CSV
                </button>
              </div>
              {subscribersList.length === 0 ? (
                <p className="admin__empty">No subscribers yet. Subscribers will appear when someone signs up via the newsletter form.</p>
              ) : (
                <div className="sales-table-wrap">
                  <table className="sales-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Email</th>
                        <th>Date Subscribed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...subscribersList].reverse().map((sub, i) => (
                        <tr key={i}>
                          <td className="sales-table__id">{subscribersList.length - i}</td>
                          <td>{sub.email}</td>
                          <td>{new Date(sub.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === Messages Tab === */}
        {activeTab === 'messages' && (
          <div className="subscribers-tab">
            <div className="dashboard__stats">
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--orders">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{messagesList.length}</span>
                  <span className="dashboard__stat-label">Total Messages</span>
                </div>
              </div>
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{messagesList.filter((m: { date: string }) => m.date.startsWith(new Date().toISOString().split('T')[0])).length}</span>
                  <span className="dashboard__stat-label">New Today</span>
                </div>
              </div>
            </div>

            <div className="admin__list" style={{ marginTop: 24 }}>
              <h2 className="admin__section-title">
                All Messages ({messagesList.length})
              </h2>
              <div className="admin__search-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className="admin__search"
                  type="text"
                  placeholder="Search messages by name, email, or content..."
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                />
                {messageSearch && (
                  <button className="admin__search-clear" onClick={() => setMessageSearch('')}>&times;</button>
                )}
              </div>
              {messagesList.length === 0 ? (
                <p className="admin__empty">No messages yet. Messages will appear when someone submits the contact form.</p>
              ) : filteredMessages.length === 0 ? (
                <p className="admin__empty">No messages match your search.</p>
              ) : (
                <div className="sales-table-wrap">
                  <table className="sales-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...filteredMessages].reverse().map((msg: { id: string; name: string; email: string; subject: string; message: string; date: string }, i: number) => {
                        const isExpanded = expandedMessage === msg.id;
                        const preview = msg.message.length > 100 ? `${msg.message.slice(0, 100)}…` : msg.message;
                        return (
                          <tr
                            key={msg.id || i}
                            className={`sales-table__row ${isExpanded ? 'sales-table__row--expanded' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setExpandedMessage(isExpanded ? null : msg.id)}
                          >
                            <td className="sales-table__id">{messagesList.length - i}</td>
                            <td className="admin__msg-name">
                              <span className="admin__msg-name-text">{msg.name}</span>
                              <span className="admin__msg-email">{msg.email}</span>
                            </td>
                            <td className="admin__msg-preview">
                              <span className="admin__msg-subject">{msg.subject || 'No subject'}</span>
                              <span className="admin__msg-snippet">{preview}</span>
                            </td>
                            <td>{new Date(msg.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td>
                              <button
                                className="sales-table__expand-btn"
                                onClick={(e) => { e.stopPropagation(); setExpandedMessage(isExpanded ? null : msg.id); }}
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? '−' : '+'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {expandedMessage && [...messagesList].reverse().filter((m: { id: string }) => m.id === expandedMessage).map((msg: { id: string; name: string; email: string; subject: string; message: string; date: string }) => (
                    <div key={`detail-${msg.id}`} className="order-detail">
                      <h4 className="order-detail__title">Message from {msg.name}</h4>
                      <div className="order-detail__meta">
                        <span>{msg.email}</span>
                        <span>{new Date(msg.date).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</span>
                      </div>
                      <p className="order-detail__message">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === Reviews Tab === */}
        {activeTab === 'reviews' && (
          <div className="subscribers-tab">
            <div className="dashboard__stats">
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--gold">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">{reviewsList.length}</span>
                  <span className="dashboard__stat-label">Total Reviews</span>
                </div>
              </div>
              <div className="dashboard__stat">
                <div className="dashboard__stat-icon dashboard__stat-icon--green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="dashboard__stat-body">
                  <span className="dashboard__stat-value">
                    {reviewsList.length > 0
                      ? (reviewsList.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewsList.length).toFixed(1)
                      : '0.0'}
                  </span>
                  <span className="dashboard__stat-label">Average Rating</span>
                </div>
              </div>
            </div>

            <div className="admin__list" style={{ marginTop: 24 }}>
              <h2 className="admin__section-title">
                All Reviews ({reviewsList.length})
              </h2>
              {reviewsList.length === 0 ? (
                <p className="admin__empty">No reviews yet. Reviews will appear when customers submit them on product pages.</p>
              ) : (
                <div className="sales-table-wrap">
                  <table className="sales-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Name</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...reviewsList].reverse().map((rev: { id: string; productId: number; name: string; rating: number; comment: string; date: string }, i: number) => {
                        const product = allProducts.find((p) => p.id === rev.productId);
                        return (
                          <tr key={rev.id || i}>
                            <td className="sales-table__id">{product?.name ?? `Product #${rev.productId}`}</td>
                            <td>{rev.name}</td>
                            <td>
                              <span className="admin__rating">
                                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                              </span>
                            </td>
                            <td className="admin__review-comment">{rev.comment}</td>
                            <td>{new Date(rev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          </tr>
                        );
                      })}
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
            <div className="admin__section-header">
              <h2 className="admin__section-title" style={{ margin: 0 }}>
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              {editingId && (
                <button
                  className="admin__cancel-btn"
                  onClick={() => {
                    setForm(emptyForm);
                    setImages([]);
                    setPreviews([]);
                    setExistingImages([]);
                    setEditingId(null);
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

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
                    <option key={c} value={c}>{catDisplay(c)}</option>
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
              <div className="admin__field">
                <label className="admin__label">Stock</label>
                <input
                  className="admin__input"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="admin__row">
              <div className="admin__field">
                <label className="admin__label">Original Price (KSh)</label>
                <input
                  className="admin__input"
                  type="number"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                  placeholder="Leave empty if no discount"
                />
              </div>
              <div className="admin__field">
                <label className="admin__label">Badge</label>
                <select
                  className="admin__input admin__select"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                >
                  <option value="">None</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="New Arrival">New Arrival</option>
                  <option value="Trending">Trending</option>
                </select>
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
              <label className="admin__label">
                Images{editingId ? '' : ' *'}
              </label>
              {editingId && existingImages.length > 0 && (
                <>
                  <p className="admin__label-hint">Current images (upload new ones to replace, or leave empty to keep):</p>
                  <div className="admin__previews">
                    {existingImages.map((src, i) => (
                      <img key={`existing-${i}`} src={src} alt={`Current ${i + 1}`} className="admin__preview-img" />
                    ))}
                  </div>
                </>
              )}
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
                    <img key={i} src={src} alt={`New ${i + 1}`} className="admin__preview-img" />
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
              {editingId ? 'Update Product' : 'Add Product'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

/* ===== Firebase admin identity ===== */
// The password above is a client-side gate — Firestore rules can't trust it, so remote
// reads run as whoever is signed in with Firebase. This says so out loud instead of
// letting the dashboard look empty for no visible reason.
function FirebaseAdminBanner() {
  const { user, loginWithGoogle } = useAuth();
  const [status, setStatus] = useState<'checking' | 'ok' | 'not-listed'>('checking');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getDocument('admins', user.uid).then((doc) => {
      if (!cancelled) setStatus(doc ? 'ok' : 'not-listed');
    });
    return () => { cancelled = true; };
  }, [user]);

  if (!db) return null; // Firebase not configured — local-only is the expected mode
  if (user && status !== 'not-listed') return null; // checking, or all good

  const copyUid = async () => {
    if (!user) return;
    await navigator.clipboard.writeText(user.uid);
    setCopied(true);
  };

  // A fresh sign-in doesn't retrigger the data effects, so reload once it lands.
  const signIn = async () => {
    try {
      if (await loginWithGoogle()) window.location.reload();
    } catch {
      // popup closed or blocked — nothing to do
    }
  };

  return (
    <div className="admin-identity">
      <strong className="admin-identity__title">Showing local data only</strong>
      {!user ? (
        <>
          <p className="admin-identity__text">
            Orders, messages and reviews from customers live in Firestore, which needs a
            signed-in admin account. This browser isn't signed in.
          </p>
          <button className="admin-identity__btn" onClick={signIn}>Sign in with Google</button>
        </>
      ) : (
        <>
          <p className="admin-identity__text">
            Signed in as <strong>{user.email}</strong>, but this account isn't an admin yet.
            In the Firebase console create a document at <code>admins/{user.uid}</code>
            {' '}(any contents), then reload.
          </p>
          <button className="admin-identity__btn" onClick={copyUid}>
            {copied ? 'Copied' : 'Copy my UID'}
          </button>
        </>
      )}
    </div>
  );
}

/* ===== Router ===== */
export default function Admin() {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <>
      <FirebaseAdminBanner />
      <Dashboard />
    </>
  );
}
