import { PaginatedMeals } from '../types/meal';

interface FetchMealsParams {
  keyword?: string;
  page?: number;
  limit?: number;
}

export const fetchMeals = async (
  params: FetchMealsParams
): Promise<PaginatedMeals> => {
  const query = new URLSearchParams();
  if (params.keyword) query.append('keyword', params.keyword);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  const res = await fetch(`/api/meals?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch meals');
  }

  return res.json();
};
