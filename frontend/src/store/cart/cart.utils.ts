import { CartMeal } from '../../types/cart';

export const updateTotals = (cartMeals: CartMeal[]) => {
  const totalQuantity = cartMeals.reduce(
    (sumQuantity, meal) => sumQuantity + meal.quantity,
    0
  );
  const totalPrice = cartMeals.reduce(
    (sumPrice, meal) => sumPrice + meal.price * meal.quantity,
    0
  );
  return { totalQuantity, totalPrice };
};
