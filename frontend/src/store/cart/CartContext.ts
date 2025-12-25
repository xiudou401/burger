import { createContext } from 'react';
import { CartContextValue } from '../../types/cart';

export const CartContext = createContext<CartContextValue | null>(null);
