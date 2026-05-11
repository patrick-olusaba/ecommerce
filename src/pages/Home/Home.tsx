import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllProducts } from '../../data/products';
import { useToast } from '../../context/ToastContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import RecentlyViewed from '../../components/RecentlyViewed/RecentlyViewed';
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard';
import './Home.css';

const highlights = [
  {
    image: '/hero/watch.png',
    overline: 'NEWS',
    title: 'Timeless style,\nyou\'ll love.',
    accent: 'Prices you\'ll trust.',
    startsAt: 'Starts from',
    price: 'KSh 700',
    link: '/shop',
    linkText: 'SHOP NOW',
  },
  {
    image: '/hero/dress.png',
    overline: 'NEWS',
    title: 'Dresses that\nturn heads.',
    accent: 'Prices you\'ll trust.',
    startsAt: 'Starts from',
    price: 'KSh 2,200',
    link: '/shop/dresses',
    linkText: 'SHOP DRESSES',
  },
];

const categories = ['watches', 'dresses', 'pants', 'blouses', 'tshirts', 'sweaters'];

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

export default function Home() {
  useScrollReveal();
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const allProducts = getAllProducts();
  const bestSellers = [...allProducts].sort((a, b) => b.reviews - a.reviews).slice(0, 8);
  const newArrivals = [...allProducts].sort((a, b) => b.id - a.id).slice(0, 8);

  const [newsletterEmail, setNewsletterEmail] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    const subs = JSON.parse(localStorage.getItem('avytrendy_subscribers') || '[]');
    subs.push({ email: newsletterEmail.trim(), date: new Date().toISOString() });
    localStorage.setItem('avytrendy_subscribers', JSON.stringify(subs));
    addToast('Subscribed! You\'ll receive our latest updates.');
    setNewsletterEmail('');
  };

  const next = useCallback(() => setSlide((s) => (s + 1) % highlights.length), []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const s = highlights[slide];

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__grid">
          {/* Main Card */}
          <div className="hero__main">
            <div className="hero__main-content" key={slide}>
              <div className="hero__chip">
                <span className="hero__chip-dot">{s.overline}</span>
                Free Shipping on Orders Above KSh 5,000!
                <svg className="hero__chip-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
              <h2 className="hero__title">
                {s.title.split('\n').map((line, i) => (
                  <span key={i}>
                    {i === 1 ? <span className="hero__title-accent">{line}</span> : line}
                    {i < s.title.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </h2>
              <p className="hero__start-from">{s.startsAt}</p>
              <p className="hero__price">{s.price}</p>
              <Link to={s.link} className="hero__cta">{s.linkText}</Link>
            </div>
            <div className="hero__main-image">
              <img src={s.image} alt="" />
            </div>
          </div>

          {/* Side Cards */}
          <div className="hero__side reveal">
            <Link to="/shop" className="hero__side-card hero__side-card--orange">
              <div>
                <p className="hero__side-title">Best<br />products</p>
                <p className="hero__side-link">
                  View more
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </p>
              </div>
              <img
                src="/hero/tshirt.png"
                alt="Best products"
                className="hero__side-image"
              />
            </Link>
            <Link to="/shop" className="hero__side-card hero__side-card--blue">
              <div>
                <p className="hero__side-title">20%<br />discounts</p>
                <p className="hero__side-link">
                  View more
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </p>
              </div>
              <img
                src="/hero/shirt.png"
                alt="Discounts"
                className="hero__side-image"
              />
            </Link>
          </div>
        </div>

        {/* Slide dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {highlights.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: 'none',
                background: i === slide ? '#1a1a2e' : '#d1d5db',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </section>

      {/* Marquee Category Bar */}
      <div className="categories-marquee reveal">
        <div className="categories-marquee__fade-left" />
        <div className="categories-marquee__fade-right" />
        <div className="categories-marquee__track">
          {[...categories, ...categories, ...categories].map((cat, i) => (
            <button
              key={`${cat}-${i}`}
              className="categories-marquee__pill"
              onClick={() => navigate(`/shop/${cat}`)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Best Sellers */}
      <section className="section reveal">
        <div className="section__header">
          <h2 className="section__title">Best Selling</h2>
          <div className="section__subtitle">
            <span>Showing {bestSellers.length} of {allProducts.length} products</span>
            <Link to="/shop">
              View more
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
        <div className="product-grid reveal">
          {loading
            ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
            : bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
          }
        </div>
      </section>

      {/* New Arrivals */}
      <section className="section reveal">
        <div className="section__header">
          <h2 className="section__title">New Arrivals</h2>
          <div className="section__subtitle">
            <span>Showing {newArrivals.length} of {allProducts.length} products</span>
            <Link to="/shop">
              View more
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
        <div className="product-grid reveal">
          {loading
            ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
            : newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
          }
        </div>
      </section>

      {/* Features */}
      <section className="features reveal">
        <div className="features__header">
          <h2 className="features__title">Our Specifications</h2>
          <p className="features__desc">
            We offer top-tier service and convenience to ensure your shopping experience is smooth, secure, and completely hassle-free.
          </p>
        </div>
        <div className="features__grid reveal">
          <div className="features__card">
            <div className="features__icon features__icon--green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/>
                <path d="m21.854 2.147-10.94 10.939"/>
              </svg>
            </div>
            <h3 className="features__card-title">Free Shipping</h3>
            <p className="features__card-text">Enjoy fast, free delivery on every order — no conditions, just reliable doorstep delivery.</p>
          </div>
          <div className="features__card">
            <div className="features__icon features__icon--orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 7.38 16.75"/>
                <path d="M12 6v6l4 2"/>
                <path d="M2.5 8.875a10 10 0 0 0-.5 3"/>
                <path d="M2.83 16a10 10 0 0 0 2.43 3.4"/>
                <path d="M4.636 5.235a10 10 0 0 1 .891-.857"/>
                <path d="M8.644 21.42a10 10 0 0 0 7.631-.38"/>
              </svg>
            </div>
            <h3 className="features__card-title">7-Day Easy Returns</h3>
            <p className="features__card-text">Change your mind? No worries. Return any item within 7 days, no questions asked.</p>
          </div>
          <div className="features__card">
            <div className="features__icon features__icon--purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/>
                <path d="M21 16v2a4 4 0 0 1-4 4h-5"/>
              </svg>
            </div>
            <h3 className="features__card-title">24/7 Customer Support</h3>
            <p className="features__card-text">We're here for you. Get expert help anytime with our dedicated customer support team.</p>
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Newsletter */}
      <section className="newsletter reveal">
        <h2 className="newsletter__title">Join Newsletter</h2>
        <p className="newsletter__desc">
          Subscribe to get exclusive deals, new arrivals, and insider updates delivered straight to your inbox every week.
        </p>
        <form className="newsletter__form" onSubmit={handleNewsletterSubmit}>
          <input
            className="newsletter__input"
            type="email"
            placeholder="Enter your email address"
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
          />
          <button className="newsletter__btn" type="submit">Get Updates</button>
        </form>
      </section>
    </div>
  );
}
