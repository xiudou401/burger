import { CartMeal } from '../../types/cart';
import { Meal } from '../../types/meal';

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

export const addItem = (items: CartMeal[], meal: Meal) => {
  const existing = items.find((item) => item._id === meal._id);
  if (existing) {
    return items.map((item) =>
      item._id === meal._id ? { ...item, quantity: item.quantity + 1 } : item
    );
  } else {
    return [...items, { ...meal, quantity: 1 }];
  }
};
export const removeItem = (items: CartMeal[], _id: string) => {
  return items
    .map((item) =>
      item._id === _id ? { ...item, quantity: item.quantity - 1 } : item
    )
    .filter((item) => item.quantity > 0);
};
export const deleteItem = (items: CartMeal[], _id: string) => {
  return items.filter((item) => item._id !== _id);
};
