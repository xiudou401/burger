import { CartMeal } from '../../../types/cart';

export const calculateTotals = (meals: CartMeal[]) => {
  const totalQuantity = meals.reduce((s, m) => s + m.quantity, 0);
  const totalCents = meals.reduce((s, m) => s + m.priceCents * m.quantity, 0);
  return { totalQuantity, totalCents };
};
