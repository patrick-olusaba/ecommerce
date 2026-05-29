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
