import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            AVY<span className="footer__logo-accent">TREDY</span>
            <span style={{ color: '#22c55e', fontSize: '1.8rem', lineHeight: 0 }}>.</span>
          </Link>
          <p className="footer__desc">
            Welcome to AVYTREDY, your ultimate destination for the latest fashion and accessories. From watches and dresses to everyday essentials, we bring you the best in style — all in one place.
          </p>
          <div className="footer__social">
            <a href="#" className="footer__social-link" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 1.67h-2.5a4.17 4.17 0 0 0-4.17 4.16v2.5H5.83v3.34h2.5v6.66h3.34v-6.66h2.5l.83-3.34h-3.33V5.83c0-.46.37-.83.83-.83h2.5V1.67Z"/>
              </svg>
            </a>
            <a href="#" className="footer__social-link" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.58 5.42h.01M5.83 1.67h8.34a4.17 4.17 0 0 1 4.16 4.16v8.34a4.17 4.17 0 0 1-4.16 4.16H5.83a4.17 4.17 0 0 1-4.16-4.16V5.83a4.17 4.17 0 0 1 4.16-4.16Zm7.5 7.81a5.01 5.01 0 1 1-9.93-1.18 5.01 5.01 0 0 1 9.93 1.18Z"/>
              </svg>
            </a>
            <a href="#" className="footer__social-link" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.33 3.33s-.58 1.75-1.66 2.84c1.33 8.33-7.84 14.41-15 9.66 1.83.09 3.67-.5 5-1.66-4.17-1.25-6.25-6.17-4.17-10 1.84 2.16 4.67 3.41 7.5 3.33-.75-3.5 3.33-5.5 5.83-3.17.92 0 2.5-1 2.5-1Z"/>
              </svg>
            </a>
            <a href="#" className="footer__social-link" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.33 6.67a5 5 0 0 1 5 5v5.83h-3.33v-5.83a1.67 1.67 0 0 0-3.34 0v5.83H8.33v-5.83a5 5 0 0 1 5-5Z"/>
                <path d="M5 7.5H1.67v10H5v-10Z"/><path d="M3.33 5a1.67 1.67 0 1 0 0-3.33 1.67 1.67 0 0 0 0 3.33Z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">PRODUCTS</h4>
          <Link to="/shop/watches" className="footer__link">Watches</Link>
          <Link to="/shop/dresses" className="footer__link">Dresses</Link>
          <Link to="/shop/pants" className="footer__link">Pants</Link>
          <Link to="/shop/blouses" className="footer__link">Blouses</Link>
          <Link to="/shop/tshirts" className="footer__link">T-Shirts</Link>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">WEBSITE</h4>
          <Link to="/" className="footer__link">Home</Link>
          <a href="#" className="footer__link">Privacy Policy</a>
          <a href="#" className="footer__link">Become a Seller</a>
          <a href="#" className="footer__link">Create Your Store</a>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">CONTACT</h4>
          <a href="#" className="footer__link">
            <svg className="footer__contact-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14.67 4.67L8.67 8.48a1 1 0 0 1-1.34 0L1.33 4.67M2.67 2.67h10.66a1.33 1.33 0 0 1 1.34 1.33v8a1.33 1.33 0 0 1-1.34 1.33H2.67a1.33 1.33 0 0 1-1.34-1.33V4a1.33 1.33 0 0 1 1.34-1.33Z"/>
            </svg>
            support@avytredy.co.ke
          </a>
          <a href="#" className="footer__link">
            <svg className="footer__contact-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.22 11.05a1 1 0 0 1 .81-.2 1 1 0 0 1 .37.15l.23.2a1.19 1.19 0 0 0 1.48.03 1.19 1.19 0 0 0 .38-.43l.24-.4a.83.83 0 0 0-.28-1.11L10.52 8.2a.83.83 0 0 0-1.17.31l-.24.4a.83.83 0 0 1-.62.37.83.83 0 0 1-.72-.24 11.09 11.09 0 0 1-2.85-3.83.67.67 0 0 1 .24-.86l.4-.24a.83.83 0 0 0 .31-1.17L5.63 1.5A.83.83 0 0 0 4.52 1.22l-.4.24A1.19 1.19 0 0 0 3.7 2.63a1.19 1.19 0 0 0 .03.48 11.09 11.09 0 0 0 5.49 7.94Z"/>
            </svg>
            +254 712 345 678
          </a>
          <a href="#" className="footer__link">
            <svg className="footer__contact-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13.33 6.67a5.33 5.33 0 0 0-4.93-5.32 5.33 5.33 0 0 0-4.93 5.32c0 3.33 3.7 6.8 5.87 7.87a1.33 1.33 0 0 0 1.2 0c2.17-1.07 5.87-4.54 5.87-7.87Z"/>
              <path d="M8 8.67a1.33 1.33 0 1 0 0-2.67 1.33 1.33 0 0 0 0 2.67Z"/>
            </svg>
            Nairobi, Kenya
          </a>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <p className="footer__copy">Copyright 2025 &copy; AVYTREDY All Right Reserved.</p>
          <div className="footer__payments">
            <span className="footer__payment-icon">VISA</span>
            <span className="footer__payment-icon">MC</span>
            <span className="footer__payment-icon">MPESA</span>
            <span className="footer__payment-icon">PayPal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
