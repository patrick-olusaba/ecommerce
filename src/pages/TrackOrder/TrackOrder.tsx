import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { getSales, getOrderStatus } from '../../utils/salesStorage';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatKSh } from '../../utils/currency';
import './TrackOrder.css';

const STEPS = [
  { label: 'Order Placed', desc: 'We received your order' },
  { label: 'Processing', desc: 'Packing your items' },
  { label: 'Shipped', desc: 'On the way to you' },
  { label: 'Delivered', desc: 'Enjoy your purchase' },
];

export default function TrackOrder() {
  useDocumentTitle('Track Order');
  const [orderNumber, setOrderNumber] = useState('');
  const [tracking, setTracking] = useState<ReturnType<typeof getSales>[number] | null>(null);
  const [searched, setSearched] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const allSales = useMemo(() => getSales(), [refreshKey]);
  const demoIds = useMemo(() => allSales.slice(0, 3).map((s) => s.id), [allSales]);

  const refreshTracking = useCallback(() => {
    setRefreshKey((n) => n + 1);
    setTracking((prev) => {
      if (!prev) return null;
      const updated = getSales().find((s) => s.id === prev.id);
      return updated ?? prev;
    });
  }, []);

  // Auto-refresh every 60s while tracking an order
  useEffect(() => {
    if (tracking) {
      autoRef.current = setInterval(refreshTracking, 60000);
      return () => clearInterval(autoRef.current);
    }
  }, [tracking, refreshTracking]);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = orderNumber.trim().toUpperCase();
    // Always read fresh for a new search
    const fresh = getSales();
    const result = fresh.find((s) => s.id === normalized) ?? null;
    setTracking(result);
    setSearched(true);
    setRefreshKey((n) => n + 1);
  };

  const handleDemoClick = (orderId: string) => {
    setOrderNumber(orderId);
    const fresh = getSales();
    const result = fresh.find((s) => s.id === orderId) ?? null;
    setTracking(result);
    setSearched(true);
    setRefreshKey((n) => n + 1);
  };

  const status = tracking ? getOrderStatus(tracking) : 0;

  return (
    <div className="track-order">
      <div className="track-order__bg" />

      <div className="track-order__container">
        {/* Header */}
        <div className="track-order__header">
          <div className="track-order__header-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <h1 className="track-order__title">Track Your Order</h1>
          <p className="track-order__subtitle">
            Enter your AVYTRENDY order number to see real-time delivery updates.
          </p>
        </div>

        {/* Search Card */}
        <div className="track-order__card">
          <form className="track-order__form" onSubmit={handleTrack}>
            <div className="track-order__input-group">
              <svg className="track-order__input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <line x1="8" y1="8" x2="16" y2="8"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="8" y1="16" x2="12" y2="16"/>
              </svg>
              <input
                type="text"
                className="track-order__input"
                placeholder="Enter order number (e.g. AVT-100101)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="track-order__btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              Track Order
            </button>
          </form>

          <div className="track-order__demos">
            <span className="track-order__demos-label">Try a demo:</span>
            {demoIds.map((id) => (
              <button key={id} className="track-order__demo-chip" onClick={() => handleDemoClick(id)}>
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Not Found */}
        {searched && !tracking && (
          <div className="track-order__error">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>Order Not Found</h3>
            <p>We couldn't find an order with that number. Double-check and try again, or try one of the demo orders above.</p>
          </div>
        )}

        {/* Tracking Result */}
        {tracking && (
          <div className="track-order__result">
            {/* Order Info Bar */}
            <div className="track-order__meta">
              <div className="track-order__meta-item">
                <span className="track-order__meta-label">Order Number</span>
                <span className="track-order__meta-value">{tracking.id}</span>
              </div>
              <div className="track-order__meta-divider" />
              <div className="track-order__meta-item">
                <span className="track-order__meta-label">Placed On</span>
                <span className="track-order__meta-value">{new Date(tracking.date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="track-order__meta-divider" />
              <div className="track-order__meta-item">
                <span className="track-order__meta-label">Items</span>
                <span className="track-order__meta-value">{tracking.itemCount} item{tracking.itemCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="track-order__meta-divider" />
              <div className="track-order__meta-item">
                <span className="track-order__meta-label">Total</span>
                <span className="track-order__meta-value">{formatKSh(tracking.total)}</span>
              </div>
              <button
                className="track-order__refresh-btn"
                onClick={refreshTracking}
                title="Refresh status"
                aria-label="Refresh order status"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Refresh
              </button>
            </div>

            {/* Progress Tracker */}
            <div className="track-order__progress">
              {STEPS.map((step, i) => {
                const stepIndex = i + 1;
                const done = stepIndex <= status;
                const current = stepIndex === status;
                return (
                  <div
                    key={step.label}
                    className={`track-step ${done ? 'track-step--done' : ''} ${current ? 'track-step--current' : ''}`}
                  >
                    <div className="track-step__node">
                      {done && !current ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : current ? (
                        <div className="track-step__pulse" />
                      ) : (
                        <div className="track-step__dot" />
                      )}
                    </div>
                    <div className="track-step__content">
                      <span className="track-step__label">{step.label}</span>
                      <span className="track-step__desc">{step.desc}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`track-step__line ${done ? 'track-step__line--filled' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Delivered Banner */}
            {status === 4 && (
              <div className="track-order__delivered">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <div>
                  <strong>Delivery Confirmed</strong>
                  <span>Your order has been delivered. Thank you for shopping with AVYTRENDY!</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
