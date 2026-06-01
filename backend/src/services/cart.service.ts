import { getMenuVersion } from './menu.service';
import { ServiceError } from '../errors/ServiceError';
import { mealRepository } from '../repositories/meal.repository';

export interface CartStoredItem {
  id: string;
  quantity: number;
}

export interface ValidatedCartMeal {
  id: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface ValidateCartResult {
  items: ValidatedCartMeal[];
  total: number;
  menuVersion: number;
}

export const validateCart = async (
  items: CartStoredItem[],
  menuVersion: number,
): Promise<ValidateCartResult> => {
  const currentVersion = await getMenuVersion();

  if (menuVersion !== currentVersion) {
    throw new ServiceError('Menu updated', 409);
  }

  if (items.length === 0) {
    return {
      items: [],
      total: 0,
      menuVersion: currentVersion,
    };
  }

  const ids = items.map((item) => item.id);

  const meals = await mealRepository.findByIds(ids);

  const mealMap = new Map(meals.map((meal) => [meal._id.toString(), meal]));

  let total = 0;

  const result: ValidatedCartMeal[] = items.map((item) => {
    const meal = mealMap.get(item.id);

    if (!meal) {
      throw new ServiceError('Meal removed', 400);
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
