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
  priceCents: number;
  category: string;
  isAvailable: boolean;
  quantity: number;
  subtotalCents: number;
}

export interface ValidateCartResult {
  items: ValidatedCartMeal[];
  totalCents: number;
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
      totalCents: 0,
      menuVersion: currentVersion,
    };
  }

  const ids = items.map((item) => item.id);

  const meals = await mealRepository.findByIds(ids);

  const mealMap = new Map(meals.map((meal) => [meal._id.toString(), meal]));

  let totalCents = 0;

  const result: ValidatedCartMeal[] = items.map((item) => {
    const meal = mealMap.get(item.id);

    if (!meal) {
      throw new ServiceError('Meal removed', 400);
    }

    if (meal.isAvailable === false) {
      throw new ServiceError(`${meal.name} is currently sold out`, 400);
    }

    const subtotalCents = meal.priceCents * item.quantity;
    totalCents += subtotalCents;

    return {
      id: meal._id.toString(),
      name: meal.name,
      image: meal.image,
      priceCents: meal.priceCents,
      category: meal.category ?? 'burger',
      isAvailable: meal.isAvailable ?? true,
      quantity: item.quantity,
      subtotalCents,
    };
  });

  return {
    items: result,
    totalCents,
    menuVersion: currentVersion,
  };
};
