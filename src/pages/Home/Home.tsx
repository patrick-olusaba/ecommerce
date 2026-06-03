import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllProducts } from '../../data/products';
import { useToast } from '../../context/ToastContext';
import { formatKSh } from '../../utils/currency';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { addDocument } from '../../firebase/firestore';
import ProductCard from '../../components/ProductCard/ProductCard';
import RecentlyViewed from '../../components/RecentlyViewed/RecentlyViewed';
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard';
import './Home.css';

const highlights = [
  {
    image: '/hero/watch.png',
    overline: 'NEW ARRIVALS',
    title: 'Timeless style,\nyou\'ll love.',
    accent: 'Prices you\'ll trust.',
    startsAt: 'Starts from',
    category: 'watches',
    link: '/shop/watches',
    linkText: 'SHOP WATCHES',
    color: '#ecfdf3',
    chipBg: '#d1fae5',
    chipColor: '#16a34a',
  },
  {
    image: '/hero/dress.png',
    overline: 'TRENDING',
    title: 'Dresses that\nturn heads.',
    accent: 'Elegant & affordable.',
    startsAt: 'Starts from',
    category: 'dresses',
    link: '/shop/dresses',
    linkText: 'SHOP DRESSES',
    color: '#fdf2f8',
    chipBg: '#fce7f3',
    chipColor: '#db2777',
  },
  {
    image: '/hero/hero1.png',
    overline: 'BEST SELLERS',
    title: 'Style that\nspeaks volumes.',
    accent: 'Curated looks for you.',
    startsAt: 'From',
    category: 'watches',
    link: '/shop',
    linkText: 'EXPLORE COLLECTION',
    color: '#f5f0eb',
    chipBg: '#e8d9cc',
    chipColor: '#8b6914',
  },
  {
    image: '/hero/hero2.png',
    overline: 'COLLECTION',
    title: 'Fresh fits,\nbold moves.',
    accent: 'Wardrobe essentials.',
    startsAt: 'From',
    category: 'dresses',
    link: '/shop',
    linkText: 'DISCOVER MORE',
    color: '#f0f4ff',
    chipBg: '#dbe4ff',
    chipColor: '#4c51bf',
  },
  {
    image: '/hero/hero3.png',
    overline: 'SALE',
    title: 'Up to 20% off\non top picks.',
    accent: 'Limited time offer.',
    startsAt: 'From',
    category: 'tshirts',
    link: '/shop',
    linkText: 'SHOP DEALS',
    color: '#fff5f5',
    chipBg: '#fed7d7',
    chipColor: '#c53030',
  },
  {
    image: '/hero/hero4.png',
    overline: 'AVYTRENDY',
    title: 'Your style,\nyour story.',
    accent: 'Kenyan fashion, redefined.',
    startsAt: 'Discover',
    category: 'dresses',
    link: '/shop',
    linkText: 'EXPLORE ALL',
    color: '#f0f4ff',
    chipBg: '#dbe4ff',
    chipColor: '#3b82f6',
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
  useDocumentTitle('Home');
  useScrollReveal();
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const allProducts = getAllProducts();
  const bestSellers = [...allProducts].sort((a, b) => b.reviews - a.reviews).slice(0, 8);
  const newArrivals = useMemo(() => {
    const arrivals = allProducts.filter((p) => p.badge === 'New Arrival');
    const byCategory: Record<string, typeof arrivals> = {};
    arrivals.forEach((p) => {
      if (!byCategory[p.category]) byCategory[p.category] = [];
      byCategory[p.category].push(p);
    });
    const cats = Object.keys(byCategory);
    const result: typeof arrivals = [];
    let idx = 0;
    while (result.length < 8) {
      let added = false;
      for (const cat of cats) {
        if (byCategory[cat][idx]) {
          result.push(byCategory[cat][idx]);
          added = true;
          if (result.length >= 8) break;
        }
      }
      if (!added) break;
      idx++;
    }
    return result;
  }, [allProducts]);

  const slidePrices = useMemo(() => {
    return highlights.map((h) => {
      const catProducts = allProducts.filter((p) => p.category === h.category);
      return catProducts.length ? Math.min(...catProducts.map((p) => p.price)) : null;
    });
  }, [allProducts]);

  const [newsletterEmail, setNewsletterEmail] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    const subs = JSON.parse(localStorage.getItem('avytrendy_subscribers') || '[]');
    const cleanEmail = newsletterEmail.trim().toLowerCase();
    if (subs.some((s: { email: string }) => s.email.toLowerCase() === cleanEmail)) {
      addToast('You\'re already subscribed!', 'info');
      setNewsletterEmail('');
      return;
    }
    subs.push({ email: cleanEmail, date: new Date().toISOString() });
    localStorage.setItem('avytrendy_subscribers', JSON.stringify(subs));
    await addDocument('subscribers', { email: cleanEmail });
    addToast('Subscribed! You\'ll receive our latest updates.');
    setNewsletterEmail('');
  };

  const [paused, setPaused] = useState(false);
  const next = useCallback(() => setSlide((s) => (s + 1) % highlights.length), []);
  const prev = useCallback(() => setSlide((s) => (s - 1 + highlights.length) % highlights.length), []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, paused]);

  const s = highlights[slide];

  return (
    <div className="home">
      {/* Hero */}
      <section
        className="hero"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="hero__grid">
          {/* Main Card */}
          <div className="hero__main" style={{ background: s.color }}>
            <div className="hero__main-content" key={slide}>
              <div className="hero__chip" style={{ background: s.chipBg, color: s.chipColor }}>
                <span className="hero__chip-dot" style={{ background: s.chipColor }}>{s.overline}</span>
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
              <p className="hero__price">{slidePrices[slide] ? formatKSh(slidePrices[slide]) : ''}</p>
              <Link to={s.link} className="hero__cta">{s.linkText}</Link>
            </div>
            <div className="hero__main-image">
              <img src={s.image} alt="" key={s.image} />
            </div>

            {/* Arrow Buttons */}
            <button className="hero__arrow hero__arrow--left" onClick={prev} aria-label="Previous slide">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <button className="hero__arrow hero__arrow--right" onClick={next} aria-label="Next slide">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>

          {/* Side Cards */}
          <div className="hero__side reveal">
            <Link to="/shop/watches" className="hero__side-card hero__side-card--orange">
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
            <Link to="/shop/dresses" className="hero__side-card hero__side-card--blue">
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
        <div className="hero__dots">
          {highlights.map((_, i) => (
            <button
              key={i}
              className={`hero__dot ${i === slide ? 'hero__dot--active' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
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
