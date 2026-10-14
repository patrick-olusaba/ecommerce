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

// Pages read products and reviews synchronously from the cache, so refresh it before the
// first render — but never hold the shop hostage: after 2s render with what we have.
await Promise.race([
  Promise.all([syncAdminProducts(), syncReviews(), syncProductOverrides()]),
  new Promise((resolve) => setTimeout(resolve, 2000)),
]).catch(() => undefined);

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
