import { Link } from 'react-router-dom';
import './EmptyState.css';

interface Props {
  icon: 'cart' | 'search' | 'shop' | 'checkout' | 'wishlist';
  title: string;
  message: string;
  cta?: { label: string; href: string };
}

function CartIllustration() {
  return (
    <svg width="140" height="120" viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cart body */}
      <rect x="60" y="90" width="160" height="110" rx="14" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3"/>
      {/* Wheels */}
      <circle cx="100" cy="210" r="22" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3"/>
      <circle cx="100" cy="210" r="8" fill="#cbd5e1"/>
      <circle cx="190" cy="210" r="22" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3"/>
      <circle cx="190" cy="210" r="8" fill="#cbd5e1"/>
      {/* Handle */}
      <line x1="85" y1="90" x2="65" y2="35" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round"/>
      <line x1="195" y1="90" x2="215" y2="35" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round"/>
      <line x1="65" y1="35" x2="215" y2="35" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round"/>
      {/* Dust motes */}
      <circle cx="120" cy="60" r="3" fill="#e2e8f0"/>
      <circle cx="150" cy="45" r="2" fill="#e2e8f0"/>
      <circle cx="135" cy="75" r="2.5" fill="#e2e8f0"/>
      {/* Question mark inside cart */}
      <text x="140" y="155" textAnchor="middle" fontSize="40" fontWeight="700" fill="#cbd5e1" fontFamily="serif">?</text>
    </svg>
  );
}

function WishlistIllustration() {
  return (
    <svg width="140" height="120" viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Clipboard */}
      <rect x="75" y="40" width="130" height="170" rx="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3"/>
      {/* Clip */}
      <rect x="115" y="28" width="50" height="24" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2.5"/>
      <circle cx="133" cy="40" r="4" fill="#cbd5e1"/>
      <circle cx="147" cy="40" r="4" fill="#cbd5e1"/>
      {/* Lines on clipboard */}
      <rect x="95" y="75" width="90" height="8" rx="4" fill="#e2e8f0"/>
      <rect x="95" y="95" width="70" height="8" rx="4" fill="#f8fafc"/>
      <rect x="95" y="115" width="80" height="8" rx="4" fill="#f8fafc"/>
      <rect x="95" y="135" width="55" height="8" rx="4" fill="#f8fafc"/>
      {/* Heart floating off */}
      <g transform="translate(185, 85) rotate(15)">
        <path d="M0 10 C0 2 -8 -4 -16 2 C-24 8 -24 20 -16 28 L0 44 L16 28 C24 20 24 8 16 2 C8 -4 0 2 0 10Z" fill="#fecaca" stroke="#f87171" strokeWidth="2"/>
      </g>
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg width="140" height="120" viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Magnifying glass */}
      <circle cx="120" cy="115" r="55" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="4"/>
      <line x1="158" y1="153" x2="205" y2="200" stroke="#cbd5e1" strokeWidth="7" strokeLinecap="round"/>
      {/* Inside the glass - nothing found */}
      <circle cx="120" cy="115" r="30" fill="#fff" stroke="#e2e8f0" strokeWidth="2"/>
      <circle cx="113" cy="108" r="4" fill="#cbd5e1"/>
      <path d="M120 115 L120 118" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Zzz / sleepy */}
      <text x="108" y="148" fontSize="16" fill="#94a3b8" fontFamily="sans-serif" fontWeight="600">…</text>
      {/* Leaves / decoration */}
      <circle cx="55" cy="55" r="6" fill="#e2e8f0"/>
      <circle cx="195" cy="80" r="4" fill="#f1f5f9"/>
    </svg>
  );
}

function ShopIllustration() {
  return (
    <svg width="140" height="120" viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shelf */}
      <rect x="40" y="155" width="200" height="10" rx="5" fill="#e2e8f0"/>
      <rect x="40" y="130" width="200" height="10" rx="5" fill="#e2e8f0"/>
      {/* Empty hangers */}
      <line x1="80" y1="40" x2="80" y2="130" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round"/>
      <path d="M65 40 L80 50 L95 40" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round"/>
      <line x1="140" y1="50" x2="140" y2="130" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round"/>
      <path d="M125 50 L140 60 L155 50" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round"/>
      <line x1="200" y1="35" x2="200" y2="130" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round"/>
      <path d="M185 35 L200 45 L215 35" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round"/>
      {/* Dust particles */}
      <circle cx="110" cy="60" r="2" fill="#e2e8f0"/>
      <circle cx="165" cy="75" r="2.5" fill="#e2e8f0"/>
      <circle cx="230" cy="55" r="1.5" fill="#e2e8f0"/>
    </svg>
  );
}

function CheckoutIllustration() {
  return (
    <svg width="140" height="120" viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Credit card */}
      <rect x="55" y="70" width="170" height="110" rx="16" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3"/>
      {/* Chip */}
      <rect x="75" y="95" width="35" height="25" rx="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
      {/* Lines */}
      <rect x="125" y="100" width="80" height="8" rx="4" fill="#e2e8f0"/>
      <rect x="125" y="115" width="55" height="8" rx="4" fill="#f8fafc"/>
      <rect x="75" y="140" width="60" height="8" rx="4" fill="#f8fafc"/>
      <rect x="75" y="155" width="45" height="8" rx="4" fill="#f8fafc"/>
      {/* Empty shopping bag icon on card */}
      <rect x="200" y="130" width="12" height="14" rx="2" fill="#e2e8f0"/>
      <path d="M196 130 C196 125 200 120 206 120 C212 120 216 125 216 130" fill="none" stroke="#e2e8f0" strokeWidth="2"/>
      {/* Stripe */}
      <rect x="55" y="195" width="170" height="8" rx="4" fill="#cbd5e1"/>
    </svg>
  );
}

export default function EmptyState({ icon, title, message, cta }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state__illustration">
        {icon === 'cart' && <CartIllustration />}
        {icon === 'search' && <SearchIllustration />}
        {icon === 'shop' && <ShopIllustration />}
        {icon === 'checkout' && <CheckoutIllustration />}
        {icon === 'wishlist' && <WishlistIllustration />}
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
