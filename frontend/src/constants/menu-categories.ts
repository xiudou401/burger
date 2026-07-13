import type { MenuItemCategory } from '../types/menu-item';

export const MENU_CATEGORIES = [
  { value: 'burger', label: 'Grillhouse Burger', pluralLabel: 'Burgers' },
  { value: 'side', label: 'Snack & Side', pluralLabel: 'Snacks & Sides' },
  { value: 'drink', label: 'Shake & Drink', pluralLabel: 'Shakes & Drinks' },
  { value: 'dessert', label: 'Dessert', pluralLabel: 'Desserts' },
  { value: 'combo', label: 'Burger Combo', pluralLabel: 'Burger Combos' },
] satisfies Array<{
  value: MenuItemCategory;
  label: string;
  pluralLabel: string;
}>;
