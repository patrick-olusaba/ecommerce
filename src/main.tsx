import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { ToastProvider } from './context/ToastContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';
import { syncAdminProducts } from './utils/adminStorage';
import { syncReviews } from './utils/reviewStorage';
import { syncProductOverrides } from './utils/productOverrides';
import { getAllProducts } from './data/products';

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

// Pages read products and reviews synchronously from the cache, so refresh it before the
// first render, then preload fonts and the first product images behind the #splash loader.
// Never hold the shop hostage: after 5s render with what we have.
const preload = async () => {
  await Promise.all([syncAdminProducts(), syncReviews(), syncProductOverrides()]);
  await Promise.all([
    document.fonts.ready,
    ...getAllProducts().slice(0, 12).map((p) => preloadImage(p.images[0])),
  ]);
};
await Promise.race([preload(), new Promise((resolve) => setTimeout(resolve, 5000))]).catch(
  () => undefined
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
            <ToastProvider>
            <AdminAuthProvider>
            <App />
          </AdminAuthProvider>
          </ToastProvider>
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

const splash = document.getElementById('splash');
splash?.classList.add('done');
setTimeout(() => splash?.remove(), 400);
