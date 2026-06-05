export interface Meal {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  image: string;
}

export interface PaginatedMeals {
  items: Meal[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
