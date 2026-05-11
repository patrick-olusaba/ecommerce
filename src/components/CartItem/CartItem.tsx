import { Link } from 'react-router-dom';
import type { CartItem as CartItemType } from '../../types';
import { useCart } from '../../context/CartContext';
import { formatKSh } from '../../utils/currency';
import './CartItem.css';

interface Props {
  item: CartItemType;
}

export default function CartItemRow({ item }: Props) {
  const { updateQuantity, removeItem } = useCart();
  const { product } = item;

  return (
    <tr className="cart-item">
      <td className="cart-item__product">
        <div className="cart-item__img-wrap">
          <img src={product.images[0]} alt={product.name} className="cart-item__image" />
        </div>
        <div>
          <Link to={`/product/${product.id}`} className="cart-item__name">
            {product.name}
          </Link>
          <p className="cart-item__category">{product.category}</p>
          <p className="cart-item__price">{formatKSh(product.price)}</p>
        </div>
      </td>
      <td className="cart-item__qty-cell">
        <div className="cart-item__qty">
          <button
            onClick={() => updateQuantity(product.id, item.quantity - 1)}
            className="cart-item__qty-btn"
            aria-label="Decrease"
          >
            -
          </button>
          <span className="cart-item__qty-val">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(product.id, item.quantity + 1)}
            className="cart-item__qty-btn"
            aria-label="Increase"
          >
            +
          </button>
        </div>
      </td>
      <td className="cart-item__total">
        {formatKSh(product.price * item.quantity)}
      </td>
      <td className="cart-item__remove-cell">
        <button
          onClick={() => removeItem(product.id)}
          className="cart-item__remove"
          aria-label="Remove item"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </td>
    </tr>
  );
}
