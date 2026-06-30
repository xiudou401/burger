import type { MenuItemCategory } from '../types/menu-item';

export const MENU_CATEGORIES = [
  { value: 'burger', label: 'Burger', pluralLabel: 'Burgers' },
  { value: 'side', label: 'Side', pluralLabel: 'Sides' },
  { value: 'drink', label: 'Drink', pluralLabel: 'Drinks' },
  { value: 'dessert', label: 'Dessert', pluralLabel: 'Desserts' },
  { value: 'combo', label: 'Combo', pluralLabel: 'Combos' },
] satisfies Array<{
  value: MenuItemCategory;
  label: string;
  pluralLabel: string;
}>;
