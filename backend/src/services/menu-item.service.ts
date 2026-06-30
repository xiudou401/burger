import { AppError } from '../errors/AppError';
import { ServiceError } from '../errors/ServiceError';

import type { SortOrder } from 'mongoose';
import { getMenuVersion } from './menu.service';
import { menuItemRepository } from '../repositories/menu-item.repository';
import type { MenuItemPayload } from '../validation/menu-item.schema';

interface MenuItemQuery {
  keyword?: string;
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  page?: number;
  limit?: number;
  sort?: SortOption;
}

export type SortOption =
  | 'price_asc'
  | 'price_desc'
  | 'created_asc'
  | 'created_desc';

const SORT_MAP: Record<SortOption, Record<string, SortOrder>> = {
  price_asc: { priceCents: 1 },
  price_desc: { priceCents: -1 },
  created_asc: { createdAt: 1 },
  created_desc: { createdAt: -1 },
};

export const findAllMenuItems = async (query: MenuItemQuery = {}) => {
  try {
    const {
      keyword,
      category,
      minPriceCents,
      maxPriceCents,
      page = 1,
      limit = 8,
      sort,
    } = query;

    const sortOption: Record<string, SortOrder> = sort
      ? SORT_MAP[sort]
      : { createdAt: -1 };

    const mongoQuery: Record<string, any> = {};

    if (category) {
      mongoQuery.category = category;
    }

    if (keyword) {
      mongoQuery.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (minPriceCents !== undefined || maxPriceCents !== undefined) {
      mongoQuery.priceCents = {};
      if (minPriceCents !== undefined) {
        mongoQuery.priceCents.$gte = minPriceCents;
      }
      if (maxPriceCents !== undefined) {
        mongoQuery.priceCents.$lte = maxPriceCents;
      }
    }

    const skip = (page - 1) * limit;

    const [items, total, menuVersion] = await Promise.all([
      menuItemRepository.findPage({
        query: mongoQuery,
        sort: sortOption,
        skip,
        limit,
      }),
      menuItemRepository.count(mongoQuery),
      getMenuVersion(),
    ]);

    return {
      menuVersion,
      items: items.map((menuItem) => ({
        id: menuItem._id.toString(),
        name: menuItem.name,
        description: menuItem.description,
        priceCents: menuItem.priceCents,
        image: menuItem.image,
        category: menuItem.category ?? 'burger',
        isAvailable: menuItem.isAvailable ?? true,
        isFeatured: menuItem.isFeatured ?? false,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Menu item pagination failed:', error);
    throw new AppError(
      'Could not load menu items. Please try again later.',
      500,
    );
  }
};

const toPublicMenuItem = (menuItem: {
  _id: unknown;
  name: string;
  description?: string;
  priceCents: number;
  image?: string;
  category?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
}) => ({
  id: String(menuItem._id),
  name: menuItem.name,
  description: menuItem.description,
  priceCents: menuItem.priceCents,
  image: menuItem.image,
  category: menuItem.category ?? 'burger',
  isAvailable: menuItem.isAvailable ?? true,
  isFeatured: menuItem.isFeatured ?? false,
});

export const createMenuItem = async (payload: MenuItemPayload) => {
  const menuItem = await menuItemRepository.create(payload);

  return toPublicMenuItem(menuItem);
};

export const updateMenuItem = async (
  menuItemId: string,
  payload: MenuItemPayload,
) => {
  const menuItem = await menuItemRepository.updateById(menuItemId, payload);

  if (!menuItem) {
    throw new ServiceError('Menu item not found', 404);
  }

  return toPublicMenuItem(menuItem);
};

export const deleteMenuItem = async (menuItemId: string) => {
  const menuItem = await menuItemRepository.deleteById(menuItemId);

  if (!menuItem) {
    throw new ServiceError('Menu item not found', 404);
  }

  return toPublicMenuItem(menuItem);
};
