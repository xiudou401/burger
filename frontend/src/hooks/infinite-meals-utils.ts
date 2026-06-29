import type { Meal } from '../types/meal';

export const buildInfiniteMealsLoadKey = (
  keyword: string,
  category: string,
  page: number,
  limit: number,
  reloadKey: number,
) => `${keyword}::${category}::${page}::${limit}::${reloadKey}`;

export const mergeUniqueMeals = (current: Meal[], incoming: Meal[]) => {
  const existingIds = new Set(current.map((meal) => meal.id));
  const newItems = incoming.filter((meal) => !existingIds.has(meal.id));

  return [...current, ...newItems];
};
