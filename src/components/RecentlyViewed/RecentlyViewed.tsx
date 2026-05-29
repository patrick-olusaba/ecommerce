import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useRecentlyViewed from '../../hooks/useRecentlyViewed';
import { formatKSh } from '../../utils/currency';
import './RecentlyViewed.css';

export default function RecentlyViewed() {
  const { user } = useAuth();
  const { recentProducts } = useRecentlyViewed();

  if (!user || recentProducts.length === 0) return null;

  return (
    <section className="recently-viewed">
      <h2 className="recently-viewed__title">Recently Viewed</h2>
      <div className="recently-viewed__strip">
        {recentProducts.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            className="rv-card"
          >
            <div className="rv-card__image-wrap">
              <img src={product.images[0]} alt={product.name} className="rv-card__image" loading="lazy" />
            </div>
            <span className="rv-card__name">{product.name}</span>
            <span className="rv-card__price">{formatKSh(product.price)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
