import { Routes, Route } from 'react-router-dom';
import { useCart } from './context/CartContext';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import WhatsAppButton from './components/WhatsAppButton/WhatsAppButton';
import Home from './pages/Home/Home';
import Shop from './pages/Shop/Shop';
import Product from './pages/Product/Product';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
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
            <p>Your cart is empty.</p>
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

export default function App() {
  return (
    <div className="app">
      <Header />
      <CartDrawer />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<Shop />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
