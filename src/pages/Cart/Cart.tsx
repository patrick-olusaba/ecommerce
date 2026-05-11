import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItemCard from '../../components/CartItem/CartItem';
import { formatKSh, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../../utils/currency';
import './Cart.css';

export default function Cart() {
  const { items, itemCount, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-page__container">
          <h1 className="cart-page__title">Shopping Cart</h1>
          <div className="cart-empty">
            <div className="cart-empty__icon">&#128722;</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet.</p>
            <Link to="/shop" className="btn btn--primary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-page__container">
        <div className="cart-page__header">
          <h1 className="cart-page__title">Shopping Cart ({itemCount})</h1>
          <button onClick={clearCart} className="cart-page__clear">Clear Cart</button>
        </div>

        <div className="cart-page__layout">
          <div className="cart-page__items">
            {items.map((item) => (
              <CartItemCard key={`${item.product.id}-${item.size}-${item.color}`} item={item} />
            ))}
          </div>

          <aside className="cart-page__summary">
            <div className="cart-summary">
              <h3 className="cart-summary__title">Order Summary</h3>
              <div className="cart-summary__row">
                <span>Subtotal ({itemCount} items)</span>
                <span>{formatKSh(total)}</span>
              </div>
              <div className="cart-summary__row">
                <span>Shipping</span>
                <span className="cart-summary__shipping">
                  {total >= FREE_SHIPPING_THRESHOLD ? 'Free' : formatKSh(SHIPPING_COST)}
                </span>
              </div>
              <div className="cart-summary__row cart-summary__row--total">
                <span>Total</span>
                <span>{formatKSh(total >= FREE_SHIPPING_THRESHOLD ? total : total + SHIPPING_COST)}</span>
              </div>
              <Link to="/checkout" className="btn btn--primary btn--full">
                Proceed to Checkout
              </Link>
              <Link to="/shop" className="cart-summary__continue">
                &larr; Continue Shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
