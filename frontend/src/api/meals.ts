import { request } from './request';
import { Meal, PaginatedMeals } from '../types/meal';

interface FetchMealsParams {
  keyword?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export const fetchMeals = (params: FetchMealsParams) => {
  const query = new URLSearchParams();

  if (params.keyword) query.append('keyword', params.keyword);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  return request<PaginatedMeals>(`/meals?${query.toString()}`, {
    signal: params.signal,
  });
};

export interface MealPayload {
  name: string;
  description: string;
  price: number;
  image: string;
}

export const createMeal = (payload: MealPayload) => {
  return request<{ meal: Meal }>('/meals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateMeal = (mealId: string, payload: MealPayload) => {
  return request<{ meal: Meal }>(`/meals/${mealId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const deleteMeal = (mealId: string) => {
  return request<{ meal: Meal }>(`/meals/${mealId}`, {
    method: 'DELETE',
  });
};
