import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <h1 className="not-found-page__code">404</h1>
      <h2 className="not-found-page__title">Page Not Found</h2>
      <p className="not-found-page__desc">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn--primary">Back to Home</Link>
    </div>
  );
}
