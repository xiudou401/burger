import { MealModel } from '../models/meal.model';
import { AppError } from '../errors/AppError';
import { getMenuVersion } from './menu.service'; // ✅ 新增

interface CartStoredItem {
  id: string;
  quantity: number;
}

export const validateCart = async (
  items: CartStoredItem[],
  clientMenuVersion: number,
) => {
  const currentVersion = await getMenuVersion();

  if (clientMenuVersion !== currentVersion) {
    throw new AppError('Menu updated', 409);
  }

  const ids = items.map((i) => i.id);

  const meals = await MealModel.find({ _id: { $in: ids } }).lean();

  const mealMap = new Map(meals.map((meal) => [meal._id.toString(), meal]));

  let total = 0;

  const result = items.map((item) => {
    const meal = mealMap.get(item.id);

    if (!meal) {
      throw new AppError('Meal removed', 400);
    }

    const subtotal = meal.price * item.quantity;

    total += subtotal;

    return {
      id: meal._id.toString(),
      name: meal.name,
      image: meal.image,
      price: meal.price,
      quantity: item.quantity,
      subtotal,
    };
  });

  return {
    items: result,
    total,
    menuVersion: currentVersion,
  };
};
