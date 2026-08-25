import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { recordSale } from '../../utils/salesStorage';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatKSh, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../../utils/currency';
import './Checkout.css';

/** Posts to the Vercel function in api/send-order-email.js. False = nothing was sent. */
async function sendOrderEmail(
  to: string,
  orderId: string,
  items: { name: string; quantity: number; price: number }[],
  total: number,
  shipping: number
): Promise<boolean> {
  if (!to) return false;
  try {
    const res = await fetch('/api/send-order-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        orderId,
        items: items.map(({ name, quantity, price }) => ({ name, quantity, price })),
        total,
        shipping,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.sent === true;
  } catch {
    return false; // no api route in dev, or offline
  }
}

export default function Checkout() {
  useDocumentTitle('Checkout');
  const { items, total, clearCart, removeItem } = useCart();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [placed, setPlaced] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cod'>('mpesa');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [placedItems, setPlacedItems] = useState<typeof items>([]);
  const [placedGrandTotal, setPlacedGrandTotal] = useState(0);
  const orderNumber = useRef(`AVT-${Math.floor(Math.random() * 900000) + 100000}`);

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const grandTotal = total + shipping;
  const orderDate = useRef(new Date());

  const KENYA_PHONE_RE = /^(?:\+?254|0)(7\d{8})$/;

  const handlePlaceOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPhoneError('');

    if (paymentMethod === 'mpesa') {
      const raw = mpesaPhone.trim().replace(/[\s-]/g, '');
      if (!KENYA_PHONE_RE.test(raw)) {
        setPhoneError('Enter a valid Kenyan phone number (e.g. +254 712 345 678 or 0712 345 678)');
        return;
      }
    }

    const form = new FormData(e.currentTarget);
    const field = (name: string) => (form.get(name) as string | null)?.trim() || undefined;

    setSubmitting(true);
    orderDate.current = new Date();
    const saleItems = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
    }));
    const buyerEmail = email.trim();

    // Both writes are best-effort: the order is already in this browser either way.
    const [, mailed] = await Promise.all([
      recordSale({
        id: orderNumber.current,
        date: orderDate.current.toISOString(),
        items: saleItems,
        total: grandTotal,
        itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        uid: user?.uid,
        email: buyerEmail || undefined,
        phone: paymentMethod === 'mpesa' ? mpesaPhone.trim() : field('phone'),
        paymentMethod,
        customer: {
          name: [field('firstName'), field('lastName')].filter(Boolean).join(' ') || undefined,
          address: field('address'),
          city: field('city'),
          postalCode: field('postalCode'),
        },
      }),
      sendOrderEmail(buyerEmail, orderNumber.current, saleItems, grandTotal, shipping),
    ]);

    setEmailSent(mailed);
    setPlacedItems([...items]);
    setPlacedGrandTotal(grandTotal);
    setPlaced(true);
    setSubmitting(false);
    clearCart();
  };

  const receiptHTML = useMemo(() => {
    const placedTotal = placedItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt ${orderNumber.current}</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 480px; margin: 40px auto; padding: 0 20px; color: #1a1a2e; }
  h1 { font-size: 1.4rem; margin: 0 0 4px; }
  .id { color: #94a3b8; font-size: 0.88rem; margin: 0 0 24px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { text-align: left; padding: 10px 8px; font-size: 0.9rem; }
  th { color: #94a3b8; font-weight: 500; border-bottom: 2px solid #e2e8f0; }
  td { border-bottom: 1px solid #f1f5f9; }
  .total-row td { font-weight: 700; font-size: 1rem; border-top: 2px solid #1a1a2e; border-bottom: none; }
  .footer { margin-top: 24px; font-size: 0.8rem; color: #94a3b8; text-align: center; }
</style></head><body>
  <h1>Avytrendy</h1>
  <p class="id">Order #${orderNumber.current} &middot; ${orderDate.current.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  ${email ? `<p style="color:#64748b;font-size:0.9rem;">Email: ${email}</p>` : ''}
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Price</th></tr></thead>
    <tbody>
      ${placedItems.map((item) => `<tr><td>${item.product.name}<br><small style="color:#94a3b8">${item.size} / ${item.color}</small></td><td>${item.quantity}</td><td style="text-align:right">${formatKSh(item.product.price * item.quantity)}</td></tr>`).join('')}
      <tr><td colspan="2">Subtotal</td><td style="text-align:right">${formatKSh(placedTotal)}</td></tr>
      <tr><td colspan="2">Shipping</td><td style="text-align:right">${placedTotal >= FREE_SHIPPING_THRESHOLD ? 'Free' : formatKSh(SHIPPING_COST)}</td></tr>
      <tr class="total-row"><td colspan="2">Total</td><td style="text-align:right">${formatKSh(placedGrandTotal)}</td></tr>
    </tbody>
  </table>
  <p class="footer">Thank you for shopping with Avytrendy!</p>
</body></html>`;
  }, [placedItems, placedGrandTotal, email]);

  const handleDownloadReceipt = () => {
    const blob = new Blob([receiptHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avytrendy-receipt-${orderNumber.current}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (items.length === 0 && !placed) {
    return (
      <div className="checkout">
        <div className="checkout__container">
          <h1 className="checkout__title">Checkout</h1>
          <div className="checkout-empty">
            <div className="empty-cart-illustration">
              <svg width="100" height="90" viewBox="0 0 200 180" fill="none">
                <rect x="40" y="60" width="120" height="90" rx="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2.5"/>
                <circle cx="75" cy="160" r="18" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2.5"/>
                <circle cx="75" cy="160" r="6" fill="#cbd5e1"/>
                <circle cx="145" cy="160" r="18" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2.5"/>
                <circle cx="145" cy="160" r="6" fill="#cbd5e1"/>
                <line x1="55" y1="60" x2="40" y2="20" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round"/>
                <line x1="145" y1="60" x2="160" y2="20" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round"/>
                <line x1="40" y1="20" x2="160" y2="20" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
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
            <div className="checkout-success__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1>Order Confirmed!</h1>
            <p className="checkout-success__number">Order #{orderNumber.current}</p>
            {email && (
              <p className="checkout-success__email">
                {emailSent ? (
                  <>A confirmation has been sent to <strong>{email}</strong></>
                ) : (
                  <>We'll contact you on <strong>{email}</strong> to confirm this order</>
                )}
              </p>
            )}
            <div className="checkout-success__summary">
              <h3>Order Summary</h3>
              <div className="checkout-success__items">
                {placedItems.map((item) => (
                  <div key={`${item.product.id}-${item.size}-${item.color}`} className="checkout-success__item">
                    <span>{item.product.name} <small>x{item.quantity}</small></span>
                    <span>{formatKSh(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="checkout-success__totals">
                <div><span>Subtotal</span> <span>{formatKSh(placedItems.reduce((s, i) => s + i.product.price * i.quantity, 0))}</span></div>
                <div><span>Shipping</span> <span>{placedItems.reduce((s, i) => s + i.product.price * i.quantity, 0) >= FREE_SHIPPING_THRESHOLD ? 'Free' : formatKSh(SHIPPING_COST)}</span></div>
                <div className="checkout-success__grand"><span>Total</span> <span>{formatKSh(placedGrandTotal)}</span></div>
              </div>
            </div>
            <div className="checkout-success__actions">
              <button className="btn btn--outline-dark" onClick={handleDownloadReceipt}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Receipt
              </button>
              <Link to="/shop" className="btn btn--primary">Continue Shopping</Link>
            </div>
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
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  className="checkout__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="checkout__row">
                <input type="tel" name="phone" placeholder="Phone number" className="checkout__input" />
              </div>
            </fieldset>

            {/* Shipping */}
            <fieldset className="checkout__section">
              <legend className="checkout__section-title">Shipping Address</legend>
              <div className="checkout__row checkout__row--half">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  required
                  className="checkout__input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input type="text" name="lastName" placeholder="Last name" required className="checkout__input" />
              </div>
              <div className="checkout__row">
                <input type="text" name="address" placeholder="Address" required className="checkout__input" />
              </div>
              <div className="checkout__row checkout__row--half">
                <input type="text" name="city" placeholder="City" required className="checkout__input" />
                <input type="text" name="postalCode" placeholder="Postal code" required className="checkout__input" />
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
