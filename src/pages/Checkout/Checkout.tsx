import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { imagesForColor, getProductById } from '../../data/products';
import { recordSale, getCodAccess, normalizePhone } from '../../utils/salesStorage';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatKSh, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../../utils/currency';
import './Checkout.css';
import '../Cart/Cart.css'; // trust-strip styles

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
    if (!res.ok) {
      console.warn(`[order email] /api/send-order-email returned HTTP ${res.status}.` +
        ' On "npm run dev" this is expected — Vite does not run Vercel functions. Use `npx vercel dev` or the deployed site.');
      return false;
    }
    const data = await res.json();
    if (data?.sent !== true) console.warn('[order email] not sent:', data?.error ?? data);
    return data?.sent === true;
  } catch (err) {
    console.warn('[order email] request failed:', err);
    return false;
  }
}

// M-Pesa stays off until a live Paybill/Till exists: set VITE_MPESA_ENABLED=true in Vercel and redeploy.
const MPESA_ENABLED = import.meta.env.VITE_MPESA_ENABLED === 'true';

/** Sends the STK push, then polls the server until the customer pays, cancels, or ~90s pass. */
async function payWithMpesa(phone: string, items: { productId: number; quantity: number }[], expected: number): Promise<{ ok: boolean; message?: string }> {
  const post = async (url: string, body: object) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return res.json();
  };
  try {
    const start = await post('/api/mpesa-stk', { phone, items });
    if (!start.checkoutRequestId) return { ok: false, message: start.error ?? 'Could not start M-Pesa payment' };
    // The server prices the order itself; if it disagrees with the page, stop before anyone pays.
    if (start.amount !== expected) return { ok: false, message: 'Prices have changed. Please review your cart and try again.' };
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const r = await post('/api/mpesa-status', { checkoutRequestId: start.checkoutRequestId });
      if (r.status === 'paid') return { ok: true };
      if (r.status === 'failed') return { ok: false, message: r.message };
    }
    return { ok: false, message: 'No response from your phone. Please try again.' };
  } catch {
    return { ok: false, message: 'Could not reach M-Pesa. Please try again or choose Cash on Delivery.' };
  }
}

// AVT-###### for humans, plus a random suffix so the id can't be enumerated (orders are publicly gettable by id).
function newOrderNumber(): string {
  const [n, tail] = crypto.getRandomValues(new Uint32Array(2));
  return `AVT-${100000 + (n % 900000)}-${tail.toString(36).toUpperCase().slice(0, 6).padStart(6, '0')}`;
}

export default function Checkout() {
  useDocumentTitle('Checkout');
  const { items, total, clearCart, removeItem } = useCart();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [placed, setPlaced] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cod'>(MPESA_ENABLED ? 'mpesa' : 'cod');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [waitingForPhone, setWaitingForPhone] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [placedItems, setPlacedItems] = useState<typeof items>([]);
  const [placedGrandTotal, setPlacedGrandTotal] = useState(0);
  const [orderNumber] = useState(newOrderNumber);

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const grandTotal = total + shipping;
  const [orderDate, setOrderDate] = useState(() => new Date());

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

    const short = items.find((i) => {
      const stock = getProductById(i.product.id)?.stock;
      return stock != null && i.quantity > stock;
    });
    if (short) {
      addToast(`Only ${getProductById(short.product.id)?.stock} of "${short.product.name}" left. Lower the quantity in your cart.`, 'error');
      return;
    }

    const form = new FormData(e.currentTarget);
    const field = (name: string) => (form.get(name) as string | null)?.trim() || undefined;

    // Cash on delivery: needs a real phone; numbers with repeated failed deliveries are refused,
    // buyers who've received an order before are trusted, everyone else confirms on WhatsApp.
    let codAccess: 'blocked' | 'trusted' | 'new' = 'new';
    if (paymentMethod === 'cod') {
      const phone = field('phone');
      if (!normalizePhone(phone)) {
        addToast('Enter a valid Kenyan phone number so we can reach you for delivery', 'error');
        return;
      }
      setSubmitting(true);
      codAccess = await getCodAccess(phone!);
      if (codAccess === 'blocked') {
        setSubmitting(false);
        addToast('Cash on Delivery isn’t available for this number. Please contact us on WhatsApp.', 'error');
        return;
      }
      // First orders are prepaid once M-Pesa is live; until then they confirm on WhatsApp instead.
      if (codAccess === 'new' && MPESA_ENABLED) {
        setSubmitting(false);
        setPaymentMethod('mpesa');
        addToast('For your first order please pay with M-Pesa. Cash on Delivery opens after your first delivery.', 'error');
        return;
      }
    }

    setSubmitting(true);
    if (paymentMethod === 'mpesa') {
      setPhoneError('');
      setWaitingForPhone(true);
      const paid = await payWithMpesa(
        mpesaPhone.trim().replace(/[\s-]/g, ''),
        items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        grandTotal,
      );
      setWaitingForPhone(false);
      if (!paid.ok) {
        setSubmitting(false);
        addToast(paid.message ?? 'M-Pesa payment failed', 'error');
        return;
      }
    }
    const now = new Date();
    setOrderDate(now);
    const saleItems = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
    }));
    const buyerEmail = email.trim();

    // Best-effort: the order is already in this browser either way. The email goes out only
    // after the order is saved, because the server checks the address against the stored order.
    const saved = await recordSale({
      id: orderNumber,
      date: now.toISOString(),
      items: saleItems,
      total: grandTotal,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      uid: user?.uid,
      email: buyerEmail || undefined,
      phone: paymentMethod === 'mpesa' ? mpesaPhone.trim() : field('phone'),
      paymentMethod,
      confirmed: paymentMethod === 'cod' ? codAccess === 'trusted' : undefined,
      phoneKey: (paymentMethod === 'cod' && normalizePhone(field('phone'))) || undefined,
      customer: {
        name: [field('firstName'), field('lastName')].filter(Boolean).join(' ') || undefined,
        address: field('address'),
        city: field('city'),
        postalCode: field('postalCode'),
      },
    });
    const mailed = saved && await sendOrderEmail(buyerEmail, orderNumber, saleItems, grandTotal, shipping);

    setEmailSent(mailed);
    setAwaitingConfirm(paymentMethod === 'cod' && codAccess !== 'trusted');
    setPlacedItems([...items]);
    setPlacedGrandTotal(grandTotal);
    setPlaced(true);
    setSubmitting(false);
    clearCart();
  };

  const handleDownloadReceipt = async () => {
    const { jsPDF } = await import('jspdf'); // loaded on click so it stays out of the main bundle
    const pdf = new jsPDF();
    const subtotal = placedItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
    let y = 52;

    // Downscaled JPEG keeps the PDF small; if the logo can't load the receipt still downloads.
    try {
      const img = new Image();
      img.src = '/logo/logo.png';
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = Math.round((600 * img.naturalHeight) / img.naturalWidth);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff'; // JPEG has no alpha: transparent pixels would turn black
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 20, 12, 45, (45 * canvas.height) / canvas.width);
    } catch {
      pdf.setFontSize(20).setFont('helvetica', 'bold').text('Avytrendy', 20, 24);
    }
    pdf.setFontSize(10).setFont('helvetica', 'normal').setTextColor(120);
    pdf.text(`Order #${orderNumber}  |  ${orderDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 20, y);
    if (email) pdf.text(`Email: ${email}`, 20, (y += 6));
    y += 12;

    pdf.setTextColor(120).text('Item', 20, y).text('Qty', 130, y).text('Price', 190, y, { align: 'right' });
    pdf.setDrawColor(200).line(20, y + 2, 190, y + 2);
    y += 9;

    for (const item of placedItems) {
      if (y > 265) { pdf.addPage(); y = 24; }
      const name = pdf.splitTextToSize(item.product.name, 100) as string[];
      pdf.setTextColor(30).text(name, 20, y).text(String(item.quantity), 130, y);
      pdf.text(formatKSh(item.product.price * item.quantity), 190, y, { align: 'right' });
      y += name.length * 5;
      pdf.setFontSize(8).setTextColor(140).text(`${item.size} / ${item.color}`, 20, y);
      pdf.setFontSize(10);
      y += 8;
    }

    pdf.setTextColor(30).line(20, y - 3, 190, y - 3);
    y += 4;
    pdf.text('Subtotal', 20, y).text(formatKSh(subtotal), 190, y, { align: 'right' });
    y += 7;
    pdf.text('Shipping', 20, y).text(subtotal >= FREE_SHIPPING_THRESHOLD ? 'Free' : formatKSh(SHIPPING_COST), 190, y, { align: 'right' });
    y += 9;
    pdf.setFont('helvetica', 'bold').setFontSize(12).text('Total', 20, y).text(formatKSh(placedGrandTotal), 190, y, { align: 'right' });
    pdf.setFont('helvetica', 'normal').setFontSize(9).setTextColor(140).text('Thank you for shopping with Avytrendy!', 105, y + 20, { align: 'center' });

    pdf.save(`avytrendy-receipt-${orderNumber}.pdf`);
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
            <p className="checkout-success__number">Order #{orderNumber}</p>
            {email && (
              <p className="checkout-success__email">
                {emailSent ? (
                  <>A confirmation has been sent to <strong>{email}</strong></>
                ) : (
                  <>We'll contact you on <strong>{email}</strong> to confirm this order</>
                )}
              </p>
            )}
            {awaitingConfirm && (
              <div className="checkout-success__email" style={{ marginBottom: 16 }}>
                <p>
                  <strong>One last step:</strong> confirm your order on WhatsApp. We dispatch once you reply,
                  and you'll need to be available to pay cash when it arrives.
                </p>
                <a
                  className="btn btn--primary"
                  href={`https://wa.me/254715493814?text=${encodeURIComponent(`Hi Avytrendy, I'm confirming my order ${orderNumber}. I'll be available to receive it.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Confirm on WhatsApp
                </a>
              </div>
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
                <input type="tel" name="phone" placeholder="Phone number" required={paymentMethod === 'cod'} className="checkout__input" />
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
                {MPESA_ENABLED && (
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
                )}
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
              {paymentMethod === 'cod' && (
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 12 }}>
                  Please be available to receive and pay for your order. Repeated failed deliveries disable Cash on Delivery for your number.
                </p>
              )}
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
              {waitingForPhone ? 'Check your phone and enter your M-Pesa PIN…' : submitting ? 'Placing Order...' : `Place Order — ${formatKSh(grandTotal)}`}
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
                      <img src={imagesForColor(item.product, item.color)[0]} alt={item.product.name} />
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
              <ul className="trust-strip">
                <li>🔒 Secure checkout</li><li>🚚 Fast delivery</li><li>↩️ 7-day returns</li><li>💵 Pay on delivery</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
