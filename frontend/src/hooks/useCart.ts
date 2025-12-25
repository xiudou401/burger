import { useContext } from 'react';
import { CartContext } from '../store/cart/CartContext';

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used inside an CartProvider');
  }
  return context;
};
