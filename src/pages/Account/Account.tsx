import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { queryDocuments } from '../../firebase/firestore';
import { getSales, getOrderStatus, type Sale } from '../../utils/salesStorage';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import EmptyState from '../../components/EmptyState/EmptyState';
import { formatKSh } from '../../utils/currency';
import './Account.css';

const STATUS_LABELS = ['', 'Order Placed', 'Processing', 'Shipped', 'Delivered'];

export default function Account() {
  useDocumentTitle('My Account');
  const { user, loading, logout } = useAuth();
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const remote = await queryDocuments<Sale>('orders', 'uid', user.uid);
      // Orders placed on this device before signing in still belong to this buyer.
      const local = getSales().filter((s) => s.uid === user.uid || (!!user.email && s.email === user.email));
      const byId = new Map(local.map((s) => [s.id, s]));
      for (const order of remote) byId.set(order.id, order);
      if (!cancelled) {
        setOrders([...byId.values()].sort((a, b) => b.date.localeCompare(a.date)));
        setLoadingOrders(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <div className="account"><div className="account__container">Loading…</div></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="account">
      <div className="account__container">
        <header className="account__header">
          {user.photoURL
            ? <img src={user.photoURL} alt="" className="account__avatar account__avatar--img" />
            : <span className="account__avatar">{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</span>}
          <div className="account__identity">
            <h1 className="account__name">{user.displayName || 'My Account'}</h1>
            <span className="account__email">{user.email}</span>
          </div>
          <button className="btn btn--outline-dark" onClick={() => logout()}>Sign Out</button>
        </header>

        <section className="account__section">
          <h2 className="account__section-title">Order History</h2>

          {loadingOrders ? (
            <p className="account__loading">Loading your orders…</p>
          ) : orders.length === 0 ? (
            <EmptyState
              icon="cart"
              title="No orders yet"
              message="When you place an order it will show up here."
              cta={{ label: 'Start Shopping', href: '/shop' }}
            />
          ) : (
            <ul className="account__orders">
              {orders.map((order) => {
                const status = getOrderStatus(order);
                return (
                  <li key={order.id} className="account-order">
                    <div className="account-order__top">
                      <span className="account-order__id">{order.id}</span>
                      <span className={`account-order__status account-order__status--${status}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                    <div className="account-order__meta">
                      <span>{new Date(order.date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span>{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                      <span className="account-order__total">{formatKSh(order.total)}</span>
                    </div>
                    <ul className="account-order__items">
                      {order.items.map((item, i) => (
                        <li key={`${order.id}-${item.productId}-${i}`}>
                          <Link to={`/product/${item.productId}`}>{item.name}</Link>
                          <span>x{item.quantity}</span>
                          <span>{formatKSh(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/track-order" className="account-order__track">Track this order</Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
