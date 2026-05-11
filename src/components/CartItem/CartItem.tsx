import { Link } from 'react-router-dom';
import type { CartItem as CartItemType } from '../../types';
import { useCart } from '../../context/CartContext';
import { formatKSh } from '../../utils/currency';
import './CartItem.css';

interface Props {
  item: CartItemType;
}

export default function CartItem({ item }: Props) {
  const { updateQuantity, removeItem } = useCart();
  const { product } = item;

  return (
    <div className="cart-item">
      <Link to={`/product/${product.id}`} className="cart-item__image-link">
        <img src={product.images[0]} alt={product.name} className="cart-item__image" />
      </Link>
      <div className="cart-item__details">
        <Link to={`/product/${product.id}`} className="cart-item__name">
          {product.name}
        </Link>
        <p className="cart-item__meta">
          {item.size} &middot; {item.color}
        </p>
        <p className="cart-item__price">{formatKSh(product.price)}</p>
        <div className="cart-item__actions">
          <div className="cart-item__qty">
            <button
              onClick={() => updateQuantity(product.id, item.quantity - 1)}
              className="cart-item__qty-btn"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="cart-item__qty-value">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(product.id, item.quantity + 1)}
              className="cart-item__qty-btn"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            onClick={() => removeItem(product.id)}
            className="cart-item__remove"
            aria-label="Remove item"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
            </svg>
          </button>
        </div>
      </div>
      <p className="cart-item__subtotal">{formatKSh(product.price * item.quantity)}</p>
    </div>
  );
}
