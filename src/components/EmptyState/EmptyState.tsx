import { Link } from 'react-router-dom';
import './EmptyState.css';

interface Props {
  icon: 'cart' | 'search' | 'shop' | 'checkout' | 'wishlist';
  title: string;
  message: string;
  cta?: { label: string; href: string };
}

export default function EmptyState({ icon, title, message, cta }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        {icon === 'cart' && (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
        )}
        {icon === 'search' && (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21 21-4.34-4.34"/>
            <circle cx="11" cy="11" r="8"/>
            <path d="M8 8h6M8 11h6M8 14h4"/>
          </svg>
        )}
        {icon === 'shop' && (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        )}
        {icon === 'checkout' && (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <path d="M8 21h8a2 2 0 0 0 2-2V9l-3-4H5a2 2 0 0 0-2 2v1"/>
          </svg>
        )}
        {icon === 'wishlist' && (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        )}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__message">{message}</p>
      {cta && (
        <Link to={cta.href} className="btn btn--primary empty-state__cta">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
