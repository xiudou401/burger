import {
  buildInfiniteMealsLoadKey,
  mergeUniqueMeals,
} from './infinite-meals-utils';
import type { Meal } from '../types/meal';

const meal = (id: string): Meal => ({
  id,
  name: `Meal ${id}`,
  description: '',
  priceCents: 1000,
  image: '',
});

describe('infinite meals utilities', () => {
  test('builds stable request keys', () => {
    expect(buildInfiniteMealsLoadKey('chicken', 2, 4, 3)).toBe(
      'chicken::2::4::3',
    );
  });

  test('appends only meals that are not already present', () => {
    expect(
      mergeUniqueMeals([meal('1'), meal('2')], [meal('2'), meal('3')]),
    ).toEqual([meal('1'), meal('2'), meal('3')]);
  });
});
