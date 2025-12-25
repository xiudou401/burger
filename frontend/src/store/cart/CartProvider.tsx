import { ReactNode, useEffect, useReducer } from 'react';
import { CartContext } from './CartContext';
import {
  CartReducer,
  getInitialCartState,
  initialCartState,
} from './CartReducer';

interface CartContextProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartContextProviderProps) => {
  const [state, cartDispatch] = useReducer(
    CartReducer,
    initialCartState,
    getInitialCartState
  );

  useEffect(() => {
    localStorage.setItem('CartState', JSON.stringify(state));
  }, [state]);

  return (
    <CartContext.Provider value={{ ...state, cartDispatch }}>
      {children}
    </CartContext.Provider>
  );
};
