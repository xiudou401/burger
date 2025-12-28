export interface Meal {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface PaginatedMeals {
  items: Meal[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
