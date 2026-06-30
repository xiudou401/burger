import {
  buildInfiniteMenuItemsLoadKey,
  mergeUniqueMenuItems,
} from './infinite-menu-items-utils';
import type { MenuItem } from '../types/menu-item';

const menuItem = (id: string): MenuItem => ({
  id,
  name: `MenuItem ${id}`,
  description: '',
  priceCents: 1000,
  image: '',
  category: 'burger',
  isAvailable: true,
  isFeatured: false,
});

describe('infinite menu item utilities', () => {
  test('builds stable request keys', () => {
    expect(buildInfiniteMenuItemsLoadKey('chicken', 'burger', 2, 4, 3)).toBe(
      'chicken::burger::2::4::3',
    );
  });

  test('appends only menu items that are not already present', () => {
    expect(
      mergeUniqueMenuItems(
        [menuItem('1'), menuItem('2')],
        [menuItem('2'), menuItem('3')],
      ),
    ).toEqual([menuItem('1'), menuItem('2'), menuItem('3')]);
  });
});
