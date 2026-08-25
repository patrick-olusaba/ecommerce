import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useCart } from './context/CartContext';
import { useToast } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import WhatsAppButton from './components/WhatsAppButton/WhatsAppButton';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import CompareBar from './components/CompareBar/CompareBar';
import MobileBottomNav from './components/MobileBottomNav/MobileBottomNav';
import EmptyState from './components/EmptyState/EmptyState';
import Home from './pages/Home/Home';
import Shop from './pages/Shop/Shop';
import Wishlist from './pages/Wishlist/Wishlist';
import About from './pages/About/About';
import Contact from './pages/Contact/Contact';
import FAQ from './pages/FAQ/FAQ';
import Search from './pages/Search/Search';
import Auth from './pages/Auth/Auth';
import Account from './pages/Account/Account';
import Privacy from './pages/Privacy/Privacy';
import SizeGuide from './pages/SizeGuide/SizeGuide';
import Product from './pages/Product/Product';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import TrackOrder from './pages/TrackOrder/TrackOrder';
import Admin from './pages/Admin/Admin';
import NotFound from './pages/NotFound/NotFound';
import { formatKSh } from './utils/currency';
import './App.css';

function CartDrawer() {
  const { items, isOpen, closeCart, itemCount, total } = useCart();

  return (
    <>
      <div
        className={`cart-drawer__overlay ${isOpen ? 'cart-drawer__overlay--open' : ''}`}
        onClick={closeCart}
      />
      <div className={`cart-drawer ${isOpen ? 'cart-drawer--open' : ''}`}>
        <div className="cart-drawer__header">
          <h3 className="cart-drawer__title">Cart ({itemCount})</h3>
          <button className="cart-drawer__close" onClick={closeCart} aria-label="Close cart">
            &times;
          </button>
        </div>
        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <EmptyState
              icon="cart"
              title="Your cart is empty"
              message="Looks like you haven't added anything yet. Start browsing our collection."
              cta={{ label: 'Browse Products', href: '/shop' }}
            />
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}-${item.color}`} className="cart-drawer__item">
                  <img src={item.product.images[0]} alt={item.product.name} className="cart-drawer__item-img" />
                  <div className="cart-drawer__item-info">
                    <span className="cart-drawer__item-name">{item.product.name}</span>
                    <span className="cart-drawer__item-meta">{item.size} / {item.color}</span>
                    <span className="cart-drawer__item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="cart-drawer__item-price">
                    {formatKSh(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="cart-drawer__footer">
              <div className="cart-drawer__total">
                <span>Total</span>
                <span>{formatKSh(total)}</span>
              </div>
              <a href="/cart" className="btn btn--primary btn--full" onClick={closeCart}>
                View Cart
              </a>
              <a href="/checkout" className="btn btn--outline-dark btn--full" onClick={closeCart}>
                Checkout
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ScrollToTopOnMount() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="page-transition" key={pathname}>
      {children}
    </div>
  );
}

function StoreLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <main className="main">
        <PageTransition>
          <Routes>
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
    );
  }

  return (
    <>
      <Header />
      <CartDrawer />
      <ToastContainer />
      <main className="main">
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:category" element={<Shop />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/search" element={<Search />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/account" element={<Account />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/size-guide" element={<SizeGuide />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
      <WhatsAppButton />
      <ScrollToTop />
      <CompareBar />
      <MobileBottomNav />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <ScrollToTopOnMount />
        <StoreLayout />
      </div>
    </ErrorBoundary>
  );
}
