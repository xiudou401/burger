import type { MenuItem } from '../types/menu-item';

export const buildInfiniteMenuItemsLoadKey = (
  keyword: string,
  category: string,
  page: number,
  limit: number,
  reloadKey: number,
) => `${keyword}::${category}::${page}::${limit}::${reloadKey}`;

export const mergeUniqueMenuItems = (
  current: MenuItem[],
  incoming: MenuItem[],
) => {
  const existingIds = new Set(current.map((menuItem) => menuItem.id));
  const newItems = incoming.filter((menuItem) => !existingIds.has(menuItem.id));

  return [...current, ...newItems];
};
