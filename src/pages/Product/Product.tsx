import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { getProductById, getRelatedProducts } from '../../data/products';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import { formatKSh, FREE_SHIPPING_THRESHOLD } from '../../utils/currency';
import './Product.css';

export default function Product() {
  const { id } = useParams();
  const product = id ? getProductById(Number(id)) : undefined;
  const { addItem } = useCart();

  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] ?? '');
  const [selectedColor, setSelectedColor] = useState(product?.colors[0] ?? '');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="not-found">
        <h2>Product not found</h2>
        <Link to="/shop">Back to Shop</Link>
      </div>
    );
  }

  const related = getRelatedProducts(product);
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(product.rating));

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedColor, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="product-page">
      <div className="product-page__breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to={`/shop/${product.category}`}>{product.category}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="product-page__main">
        {/* Gallery */}
        <div className="product-gallery">
          <div className="product-gallery__main">
            <img src={product.images[activeImage]} alt={product.name} className="product-gallery__image" />
          </div>
          <div className="product-gallery__thumbs">
            {product.images.map((img, i) => (
              <button
                key={i}
                className={`product-gallery__thumb ${i === activeImage ? 'product-gallery__thumb--active' : ''}`}
                onClick={() => setActiveImage(i)}
              >
                <img src={img} alt={`${product.name} view ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="product-info">
          <span className="product-info__category">{product.category}</span>
          <h1 className="product-info__name">{product.name}</h1>

          <div className="product-info__rating">
            <span className="product-info__stars">
              {stars.map((filled, i) => (
                <span key={i} className={filled ? 'star-filled' : 'star-empty'}>
                  {filled ? '★' : '☆'}
                </span>
              ))}
            </span>
            <span className="product-info__reviews">
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>

          <p className="product-info__price">{formatKSh(product.price)}</p>
          <p className="product-info__desc">{product.description}</p>

          {/* Color */}
          <div className="product-info__option">
            <span className="product-info__label">Color: <strong>{selectedColor}</strong></span>
            <div className="product-info__swatches">
              {product.colors.map((color) => (
                <button
                  key={color}
                  className={`swatch ${color === selectedColor ? 'swatch--active' : ''}`}
                  onClick={() => setSelectedColor(color)}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="product-info__option">
            <span className="product-info__label">Size: <strong>{selectedSize}</strong></span>
            <div className="product-info__sizes">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`size-btn ${size === selectedSize ? 'size-btn--active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Add to Cart */}
          <div className="product-info__cart-row">
            <div className="qty-control">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className="btn btn--primary btn--lg" onClick={handleAddToCart}>
              {added ? 'Added!' : 'Add to Cart'}
            </button>
          </div>

          {/* Extras */}
          <div className="product-info__extras">
            <div className="product-info__extra">
              &#128666; Free shipping on orders over {formatKSh(FREE_SHIPPING_THRESHOLD)}
            </div>
            <div className="product-info__extra">
              &#8635; 30-day easy returns
            </div>
            <div className="product-info__extra">
              &#128274; Secure checkout
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="related section">
          <h2 className="section__title">You May Also Like</h2>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
