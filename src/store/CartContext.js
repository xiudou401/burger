import { createContext } from 'react';

export const CartContext = createContext({
  items: [],
  totalPrice: 0,
  totalAmount: 0,
  addMeal: () => {},
  removeMeal: () => {},
});
