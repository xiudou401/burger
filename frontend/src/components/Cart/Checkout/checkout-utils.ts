// checkout-utils.ts
import { CartMeal } from '../../../types/cart';

export const calculateTotals = (meals: CartMeal[]) => {
  const totalQuantity = meals.reduce((s, m) => s + m.quantity, 0);
  const totalPrice = meals.reduce((s, m) => s + m.price * m.quantity, 0);
  return { totalQuantity, totalPrice };
};
