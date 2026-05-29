import useDocumentTitle from '../../hooks/useDocumentTitle';
import './About.css';

const VALUES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: 'Quality First',
    desc: 'Every product is handpicked and quality-checked before it reaches you. We partner with trusted Kenyan and international suppliers.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    title: 'Customer Love',
    desc: 'Your satisfaction is our priority. From easy returns to responsive support, we go the extra mile for every shopper.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="8" y="15" width="11" height="7" rx="2"/><polygon points="17 15 14 19 20 19 17 15"/>
      </svg>
    ),
    title: 'Kenyan Roots',
    desc: 'Born and operated in Nairobi. We understand the local market and bring you fashion that fits the Kenyan lifestyle.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: 'Fast Delivery',
    desc: 'Orders within Nairobi delivered in 24-48 hours. Nationwide shipping available with real-time tracking on every order.',
  },
];

const STATS = [
  { value: '500+', label: 'Products' },
  { value: '2,500+', label: 'Happy Customers' },
  { value: '47', label: 'Counties Reached' },
  { value: '98%', label: 'Satisfaction Rate' },
];

export default function About() {
  useDocumentTitle('About');
  return (
    <div className="about">
      <div className="about__container">
        {/* Hero */}
        <div className="about__hero">
          <span className="about__overline">Our Story</span>
          <h1 className="about__title">Bringing Style to Every Kenyan</h1>
          <p className="about__subtitle">
            AVYTRENDY was founded in Nairobi with a simple mission: make quality fashion
            accessible and affordable for everyone. What started as a small online storefront
            has grown into a trusted destination for watches, dresses, pants, shirts, t-shirts,
            and sweaters — curated for the modern Kenyan wardrobe.
          </p>
        </div>

        {/* Story Banner */}
        <div className="about__banner">
          <div className="about__banner-img-wrap">
            <img src="/hero/ourstory1.jpg" alt="Our story" className="about__banner-img" />
          </div>
          <div className="about__banner-img-wrap about__banner-img-wrap--tall">
            <img src="/hero/ourstory2.jpg" alt="Our story" className="about__banner-img" />
          </div>
          <div className="about__banner-img-wrap">
            <img src="/hero/ourstory3.jpg" alt="Our story" className="about__banner-img" />
          </div>
        </div>

        {/* Stats */}
        <div className="about__stats">
          {STATS.map((s) => (
            <div key={s.label} className="about__stat">
              <span className="about__stat-value">{s.value}</span>
              <span className="about__stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="about__mission">
          <div className="about__mission-text">
            <h2 className="about__section-title">Our Mission</h2>
            <p>
              We believe everyone deserves to look and feel their best without breaking the bank.
              Our team carefully selects each item in our catalog — balancing quality, style,
              and affordability. Whether you're shopping for a statement watch, a versatile dress,
              or everyday essentials, we want you to find pieces that express who you are.
            </p>
            <p>
              Behind every order is a team that cares. From our warehouse crew in Nairobi to our
              customer support team, we're all working toward the same goal: putting a smile on
              your face when you open that AVYTRENDY package.
            </p>
          </div>
          <div className="about__mission-visual">
            <div className="about__mission-card">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <span>Founded 2024</span>
            </div>
            <div className="about__mission-card">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 6.5h-11a4 4 0 0 0-4 4v3a4 4 0 0 0 4 4h11a4 4 0 0 0 4-4v-3a4 4 0 0 0-4-4Z"/>
                <circle cx="15.5" cy="12" r="1.5"/>
              </svg>
              <span>M-Pesa & COD</span>
            </div>
            <div className="about__mission-card">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              <span>Nationwide Delivery</span>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="about__values">
          <h2 className="about__section-title">Why Shop With Us</h2>
          <div className="about__values-grid">
            {VALUES.map((v) => (
              <div key={v.title} className="about__value-card">
                <div className="about__value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
