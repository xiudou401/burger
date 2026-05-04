import { createContext } from 'use-context-selector';
import type { CartContextValue } from '../../types/cart';

export const CartContext = createContext<CartContextValue | null>(null);
