import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <footer className="footer">
      <button
        className={`footer__back-to-top ${showBackToTop ? 'footer__back-to-top--visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>
      <div className="footer__container">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            <img src="/logo/logo.png" alt="Avytrendy" className="footer__logo-img" />
          </Link>
          <p className="footer__desc">
            Welcome to AVYTRENDY, your ultimate destination for the latest fashion and accessories. From watches and dresses to everyday essentials, we bring you the best in style — all in one place.
          </p>
          <div className="footer__social">
            <a href="#" className="footer__social-link footer__social-link--facebook" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" stroke="none">
                <path d="M15 1.67h-2.5a4.17 4.17 0 0 0-4.17 4.16v2.5H5.83v3.34h2.5v6.66h3.34v-6.66h2.5l.83-3.34h-3.33V5.83c0-.46.37-.83.83-.83h2.5V1.67Z"/>
              </svg>
            </a>
            <a href="#" className="footer__social-link footer__social-link--instagram" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.81.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.81-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.81-.25-2.23-.42a3.73 3.73 0 0 1-1.38-.9 3.73 3.73 0 0 1-.9-1.38c-.17-.42-.37-1.06-.42-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.81.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42 1.27-.06 1.65-.07 4.85-.07ZM12 0C8.74 0 8.33.01 7.05.07c-1.27.06-2.14.26-2.9.56-.79.3-1.46.72-2.13 1.39-.67.67-1.09 1.34-1.39 2.13-.3.76-.5 1.63-.56 2.9C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.14.56 2.9.3.79.72 1.46 1.39 2.13.67.67 1.34 1.09 2.13 1.39.76.3 1.63.5 2.9.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.14-.26 2.9-.56.79-.3 1.46-.72 2.13-1.39.67-.67 1.09-1.34 1.39-2.13.3-.76.5-1.63.56-2.9.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.14-.56-2.9-.3-.79-.72-1.46-1.39-2.13-.67-.67-1.34-1.09-2.13-1.39-.76-.3-1.63-.5-2.9-.56C15.67.01 15.26 0 12 0Zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm4.97-10.4a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z"/>
              </svg>
            </a>
            <a href="#" className="footer__social-link footer__social-link--twitter" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" stroke="none">
                <path d="M11.47 8.48 17.54 1.5h-1.44l-5.27 6.07L6.62 1.5H1.5l6.37 9.18L1.5 18.5h1.44l5.57-6.42 4.45 6.42h5.12l-6.61-9.52Zm-1.97 2.26-.64-.9L3.46 2.6h2.21l4.14 5.85.65.9 5.38 7.6h-2.21l-4.39-6.21Z"/>
              </svg>
            </a>
            <a href="#" className="footer__social-link footer__social-link--linkedin" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" stroke="none">
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
          <Link to="/shop/blouses" className="footer__link">Shirts</Link>
          <Link to="/shop/tshirts" className="footer__link">T-Shirts</Link>
          <Link to="/shop/sweaters" className="footer__link">Sweaters</Link>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">WEBSITE</h4>
          <Link to="/" className="footer__link">Home</Link>
          <Link to="/about" className="footer__link">About Us</Link>
          <Link to="/contact" className="footer__link">Contact</Link>
          <Link to="/track-order" className="footer__link">Track Order</Link>
          <Link to="/faq" className="footer__link">FAQ</Link>
          <Link to="/privacy" className="footer__link">Privacy Policy</Link>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">CONTACT</h4>
          <a href="#" className="footer__link">
            <svg className="footer__contact-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14.67 4.67L8.67 8.48a1 1 0 0 1-1.34 0L1.33 4.67M2.67 2.67h10.66a1.33 1.33 0 0 1 1.34 1.33v8a1.33 1.33 0 0 1-1.34 1.33H2.67a1.33 1.33 0 0 1-1.34-1.33V4a1.33 1.33 0 0 1 1.34-1.33Z"/>
            </svg>
            support@avytrendy.co.ke
          </a>
          <a href="#" className="footer__link">
            <svg className="footer__contact-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.22 11.05a1 1 0 0 1 .81-.2 1 1 0 0 1 .37.15l.23.2a1.19 1.19 0 0 0 1.48.03 1.19 1.19 0 0 0 .38-.43l.24-.4a.83.83 0 0 0-.28-1.11L10.52 8.2a.83.83 0 0 0-1.17.31l-.24.4a.83.83 0 0 1-.62.37.83.83 0 0 1-.72-.24 11.09 11.09 0 0 1-2.85-3.83.67.67 0 0 1 .24-.86l.4-.24a.83.83 0 0 0 .31-1.17L5.63 1.5A.83.83 0 0 0 4.52 1.22l-.4.24A1.19 1.19 0 0 0 3.7 2.63a1.19 1.19 0 0 0 .03.48 11.09 11.09 0 0 0 5.49 7.94Z"/>
            </svg>
            +254 707 855 708
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
          <p className="footer__copy">Copyright 2026 &copy; AVYTRENDY All Right Reserved.</p>
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
