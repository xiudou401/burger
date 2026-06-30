export type MenuItemCategory =
  | 'burger'
  | 'side'
  | 'drink'
  | 'dessert'
  | 'combo';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  image: string;
  category: MenuItemCategory;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface PaginatedMenuItems {
  items: MenuItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
