import { request } from './request';
import { PaginatedMeals } from '../types/meal';

interface FetchMealsParams {
  keyword?: string;
  page?: number;
  limit?: number;
}

export const fetchMeals = (params: FetchMealsParams) => {
  const query = new URLSearchParams();

  if (params.keyword) query.append('keyword', params.keyword);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  return request<PaginatedMeals>(`/meals?${query.toString()}`);
};
