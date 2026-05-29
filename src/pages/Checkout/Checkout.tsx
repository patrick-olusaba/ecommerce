import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { recordSale } from '../../utils/salesStorage';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatKSh, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../../utils/currency';
import './Checkout.css';

export default function Checkout() {
  useDocumentTitle('Checkout');
  const { items, total, clearCart, removeItem } = useCart();
  const { addToast } = useToast();
  const [placed, setPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cod'>('mpesa');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const orderNumber = useRef(`AVT-${Math.floor(Math.random() * 900000) + 100000}`);

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const grandTotal = total + shipping;

  const KENYA_PHONE_RE = /^(?:\+?254|0)(7\d{8})$/;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    if (paymentMethod === 'mpesa') {
      const raw = mpesaPhone.trim().replace(/[\s-]/g, '');
      if (!KENYA_PHONE_RE.test(raw)) {
        setPhoneError('Enter a valid Kenyan phone number (e.g. +254 712 345 678 or 0712 345 678)');
        return;
      }
    }

    setSubmitting(true);
    recordSale({
      id: orderNumber.current,
      date: new Date().toISOString(),
      items: items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
      total: grandTotal,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    });
    setPlaced(true);
    clearCart();
  };

  if (items.length === 0 && !placed) {
    return (
      <div className="checkout">
        <div className="checkout__container">
          <h1 className="checkout__title">Checkout</h1>
          <div className="checkout-empty">
            <p>Your cart is empty.</p>
            <Link to="/shop" className="btn btn--primary">Go Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="checkout">
        <div className="checkout__container">
          <div className="checkout-success">
            <div className="checkout-success__icon">&#10003;</div>
            <h1>Order Confirmed!</h1>
            <p>Thank you for your purchase. You'll receive a confirmation email shortly.</p>
            <p className="checkout-success__number">Order #{orderNumber.current}</p>
            <Link to="/shop" className="btn btn--primary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout">
      <div className="checkout__container">
        <h1 className="checkout__title">Checkout</h1>

        <div className="checkout__layout">
          <form className="checkout__form" onSubmit={handlePlaceOrder}>
            {/* Contact */}
            <fieldset className="checkout__section">
              <legend className="checkout__section-title">Contact Information</legend>
              <div className="checkout__row">
                <input type="email" placeholder="Email address" required className="checkout__input" />
              </div>
              <div className="checkout__row">
                <input type="tel" placeholder="Phone number" className="checkout__input" />
              </div>
            </fieldset>

            {/* Shipping */}
            <fieldset className="checkout__section">
              <legend className="checkout__section-title">Shipping Address</legend>
              <div className="checkout__row checkout__row--half">
                <input type="text" placeholder="First name" required className="checkout__input" />
                <input type="text" placeholder="Last name" required className="checkout__input" />
              </div>
              <div className="checkout__row">
                <input type="text" placeholder="Address" required className="checkout__input" />
              </div>
              <div className="checkout__row checkout__row--half">
                <input type="text" placeholder="City" required className="checkout__input" />
                <input type="text" placeholder="Postal code" required className="checkout__input" />
              </div>
              <div className="checkout__row">
                <select required className="checkout__input checkout__select" defaultValue="KE">
                  <option value="KE">Kenya</option>
                </select>
              </div>
            </fieldset>

            {/* Payment */}
            <fieldset className="checkout__section">
              <legend className="checkout__section-title">Payment Method</legend>
              <div className="checkout__radio-group">
                <label className="checkout__radio">
                  <input
                    type="radio"
                    name="payment"
                    value="mpesa"
                    checked={paymentMethod === 'mpesa'}
                    onChange={() => setPaymentMethod('mpesa')}
                  />
                  <span>M-Pesa</span>
                </label>
                <label className="checkout__radio">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <span>Cash on Delivery</span>
                </label>
              </div>
              {paymentMethod === 'mpesa' && (
                <div className="checkout__row" style={{ marginTop: 12 }}>
                  <input
                    type="tel"
                    placeholder="M-Pesa phone number (e.g. +254 712 345 678)"
                    required
                    className="checkout__input"
                    value={mpesaPhone}
                    onChange={(e) => { setMpesaPhone(e.target.value); setPhoneError(''); }}
                  />
                  {phoneError && (
                    <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>{phoneError}</span>
                  )}
                </div>
              )}
            </fieldset>

            <button type="submit" className="btn btn--primary btn--lg btn--full" disabled={submitting}>
              {submitting ? 'Placing Order...' : `Place Order — ${formatKSh(grandTotal)}`}
            </button>
          </form>

          {/* Order Summary Sidebar */}
          <aside className="checkout__sidebar">
            <div className="checkout-summary">
              <div className="checkout-summary__header">
                <h3 className="checkout-summary__title">Your Order</h3>
                <button
                  className={`checkout-summary__clear ${clearConfirm ? 'checkout-summary__clear--confirm' : ''}`}
                  onClick={() => {
                    if (clearConfirm) { clearCart(); addToast('Cart cleared'); setClearConfirm(false); }
                    else { setClearConfirm(true); setTimeout(() => setClearConfirm(false), 3000); }
                  }}
                  aria-label="Clear all items"
                >
                  {clearConfirm ? 'Confirm?' : 'Clear All'}
                </button>
              </div>
              <div className="checkout-summary__items">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}-${item.color}`} className="checkout-summary__item">
                    <div className="checkout-summary__item-img-wrap">
                      <img src={item.product.images[0]} alt={item.product.name} />
                      <span className="checkout-summary__item-qty">{item.quantity}</span>
                    </div>
                    <div className="checkout-summary__item-info">
                      <span className="checkout-summary__item-name">{item.product.name}</span>
                      <span className="checkout-summary__item-meta">
                        {item.size} / {item.color}
                      </span>
                    </div>
                    <span className="checkout-summary__item-price">
                      {formatKSh(item.product.price * item.quantity)}
                    </span>
                    <button
                      className="checkout-summary__item-remove"
                      onClick={() => { removeItem(item.product.id, item.size, item.color); addToast(`Removed ${item.product.name} from cart`); }}
                      aria-label={`Remove ${item.product.name}`}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="checkout-summary__totals">
                <div className="checkout-summary__row">
                  <span>Subtotal</span>
                  <span>{formatKSh(total)}</span>
                </div>
                <div className="checkout-summary__row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatKSh(shipping)}</span>
                </div>
                <div className="checkout-summary__row checkout-summary__row--total">
                  <span>Total</span>
                  <span>{formatKSh(grandTotal)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
