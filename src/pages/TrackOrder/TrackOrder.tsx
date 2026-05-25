import { useState } from 'react';
import './TrackOrder.css';

const DEMO_ORDERS: Record<string, { status: number; date: string }> = {
  'AVT-100001': { status: 3, date: '2026-05-20' },
  'AVT-100002': { status: 2, date: '2026-05-21' },
  'AVT-100003': { status: 1, date: '2026-05-22' },
};

const STEPS = [
  { label: 'Order Placed', icon: '📋' },
  { label: 'Processing', icon: '📦' },
  { label: 'Shipped', icon: '🚚' },
  { label: 'Delivered', icon: '✅' },
];

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [tracking, setTracking] = useState<{ status: number; date: string } | null>(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = orderNumber.trim().toUpperCase();
    const result = DEMO_ORDERS[normalized];
    setTracking(result ?? null);
    setSearched(true);
  };

  return (
    <div className="track-order">
      <div className="track-order__container">
        <h1 className="track-order__title">Track Your Order</h1>
        <p className="track-order__subtitle">
          Enter your order number to check delivery status.
        </p>

        <form className="track-order__form" onSubmit={handleTrack}>
          <input
            type="text"
            className="track-order__input"
            placeholder="e.g. AVT-100001"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
          <button type="submit" className="btn btn--primary btn--lg">
            Track Order
          </button>
        </form>

        <p className="track-order__hint">
          Try demo orders: <button onClick={() => { setOrderNumber('AVT-100001'); setTracking(DEMO_ORDERS['AVT-100001']); setSearched(true); }}>AVT-100001</button>,{' '}
          <button onClick={() => { setOrderNumber('AVT-100002'); setTracking(DEMO_ORDERS['AVT-100002']); setSearched(true); }}>AVT-100002</button>,{' '}
          <button onClick={() => { setOrderNumber('AVT-100003'); setTracking(DEMO_ORDERS['AVT-100003']); setSearched(true); }}>AVT-100003</button>
        </p>

        {searched && !tracking && (
          <div className="track-order__not-found">
            <p>Order not found. Please check your order number and try again.</p>
          </div>
        )}

        {tracking && (
          <div className="track-order__result">
            <div className="track-order__info">
              <span className="track-order__order-num">{orderNumber}</span>
              <span className="track-order__order-date">Placed on {tracking.date}</span>
            </div>

            <div className="track-order__progress">
              {STEPS.map((step, i) => {
                const stepIndex = i + 1;
                const done = stepIndex <= tracking.status;
                const current = stepIndex === tracking.status;
                return (
                  <div
                    key={step.label}
                    className={`track-step ${done ? 'track-step--done' : ''} ${current ? 'track-step--current' : ''}`}
                  >
                    <div className="track-step__icon">{step.icon}</div>
                    <div className="track-step__label">{step.label}</div>
                    <div className="track-step__bar-wrap">
                      <div className={`track-step__bar ${done ? 'track-step__bar--filled' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {tracking.status === 4 && (
              <div className="track-order__delivered">
                Your order has been delivered. Thank you for shopping with AVYTRENDY!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
