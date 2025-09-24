import { createContext } from 'react';

export const CartContext = createContext({
  items: [],
  totalAmount: 0,
  totalPrice: 0,
  addMeal: () => {},
  removeMeal: () => {},
});
