export type MealCategory = 'burger' | 'side' | 'drink' | 'dessert' | 'combo';

export interface Meal {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  image: string;
  category: MealCategory;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface PaginatedMeals {
  items: Meal[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
