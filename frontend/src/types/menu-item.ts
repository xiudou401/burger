export type MenuItemCategory =
  | 'burger'
  | 'side'
  | 'drink'
  | 'dessert'
  | 'combo';
export type MenuItemServingSize = 'light' | 'regular' | 'filling' | 'share';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  image: string;
  category: MenuItemCategory;
  isAvailable: boolean;
  tags?: string[];
  dietary?: string[];
  allergens?: string[];
  spiceLevel?: number;
  servingSize?: MenuItemServingSize;
  pairingIds?: string[];
  comboItemIds?: string[];
}

export interface PaginatedMenuItems {
  items: MenuItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
