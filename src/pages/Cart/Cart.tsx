import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatKSh, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../../utils/currency';
import CartItemRow from '../../components/CartItem/CartItem';
import './Cart.css';

export default function Cart() {
  const { items, itemCount, total } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const discountAmount = appliedCoupon ? (total * appliedCoupon.discount) / 100 : 0;
  const grandTotal = total - discountAmount + shipping;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'WELCOME20') {
      setAppliedCoupon({ code: 'WELCOME20', discount: 20 });
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-page__empty">
          <h1 className="cart-page__heading">My Cart</h1>
          <p className="cart-page__subtitle">Your cart is empty</p>
          <Link to="/shop" className="btn btn--primary" style={{ marginTop: 24 }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="cart-page__header">
        <h1 className="cart-page__heading">My Cart</h1>
        <div className="cart-page__breadcrumb">
          <span>{itemCount} items in your cart</span>
          <Link to="/shop" className="cart-page__add-more">
            Add more
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>

      <div className="cart-page__layout">
        {/* Product Table */}
        <table className="cart-table">
          <thead>
            <tr>
              <th className="cart-table__th">Product</th>
              <th className="cart-table__th cart-table__th--center">Quantity</th>
              <th className="cart-table__th cart-table__th--right">Total Price</th>
              <th className="cart-table__th cart-table__th--remove">Remove</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <CartItemRow key={`${item.product.id}-${item.size}-${item.color}`} item={item} />
            ))}
          </tbody>
        </table>

        {/* Payment Summary */}
        <aside className="cart-summary">
          <h2 className="cart-summary__title">Payment Summary</h2>

          <p className="cart-summary__label">Payment Method</p>
          <div className="cart-summary__radio">
            <input type="radio" id="cod" name="payment" defaultChecked />
            <label htmlFor="cod">Cash on Delivery</label>
          </div>
          <div className="cart-summary__radio">
            <input type="radio" id="stripe" name="payment" />
            <label htmlFor="stripe">M-Pesa / Card Payment</label>
          </div>

          <div className="cart-summary__divider" />

          <div className="cart-summary__rows">
            <div className="cart-summary__row">
              <span>Subtotal:</span>
              <span>{formatKSh(total)}</span>
            </div>
            <div className="cart-summary__row">
              <span>Shipping:</span>
              <span className="cart-summary__free">{shipping === 0 ? 'Free' : formatKSh(shipping)}</span>
            </div>
            {appliedCoupon && (
              <div className="cart-summary__row">
                <span>Coupon:</span>
                <span>-{formatKSh(discountAmount)}</span>
              </div>
            )}
          </div>

          {appliedCoupon ? (
            <div className="cart-summary__coupon-applied">
              <span>Code: <strong>{appliedCoupon.code}</strong></span>
              <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ) : (
            <form className="cart-summary__coupon" onSubmit={handleApplyCoupon}>
              <input
                type="text"
                placeholder="Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button type="submit">Apply</button>
            </form>
          )}

          <div className="cart-summary__divider" />

          <div className="cart-summary__total">
            <span>Total:</span>
            <span>{formatKSh(grandTotal)}</span>
          </div>

          <Link to="/checkout" className="btn btn--primary btn--full" style={{ marginTop: 16 }}>
            Place Order
          </Link>
        </aside>
      </div>
    </div>
  );
}
