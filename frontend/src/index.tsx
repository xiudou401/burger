import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { CartProvider } from './store/cart/cart-provider';
import { AuthProvider } from './store/auth/auth-provider';
import { ToastProvider } from './components/UI/Toast/ToastContext';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>,
);
