import './SkeletonCard.css';

export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card__image" />
      <div className="skeleton-card__colors">
        <span className="skeleton-card__dot" />
        <span className="skeleton-card__dot" />
        <span className="skeleton-card__dot" />
      </div>
      <div className="skeleton-card__info">
        <div className="skeleton-card__line skeleton-card__line--short" />
        <div className="skeleton-card__line skeleton-card__line--long" />
        <div className="skeleton-card__line skeleton-card__line--medium" />
      </div>
    </div>
  );
}
