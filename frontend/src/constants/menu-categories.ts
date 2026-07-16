import type { MenuItemCategory } from '../types/menu-item';

export const MENU_CATEGORIES = [
  {
    value: 'burger',
    label: 'Grillhouse Burger',
    pluralLabel: 'Burgers',
    shortPluralLabel: 'Burgers',
  },
  {
    value: 'side',
    label: 'Snack & Side',
    pluralLabel: 'Snacks & Sides',
    shortPluralLabel: 'Sides',
  },
  {
    value: 'drink',
    label: 'Shake & Drink',
    pluralLabel: 'Shakes & Drinks',
    shortPluralLabel: 'Drinks',
  },
  {
    value: 'dessert',
    label: 'Dessert',
    pluralLabel: 'Desserts',
    shortPluralLabel: 'Desserts',
  },
  {
    value: 'combo',
    label: 'Burger Combo',
    pluralLabel: 'Burger Combos',
    shortPluralLabel: 'Combos',
  },
] satisfies Array<{
  value: MenuItemCategory;
  label: string;
  pluralLabel: string;
  shortPluralLabel: string;
}>;
