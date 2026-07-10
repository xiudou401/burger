import { AppError } from '../errors/AppError';
import { ServiceError } from '../errors/ServiceError';

import type { SortOrder } from 'mongoose';
import { bumpMenuVersion, getMenuVersion } from './menu.service';
import { menuItemRepository } from '../repositories/menu-item.repository';
import type { MenuItemPayload } from '../validation/menu-item.schema';
import type { AuthenticatedUser } from '../types/auth';
import { recordAuditLog } from './audit-log.service';

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

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
      const safeKeyword = escapeRegex(keyword);

      mongoQuery.$or = [
        { name: { $regex: safeKeyword, $options: 'i' } },
        { description: { $regex: safeKeyword, $options: 'i' } },
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
      items: items.map(toPublicMenuItem),
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

type AuditActor = Pick<AuthenticatedUser, 'id' | 'role'>;

export const createMenuItem = async (
  payload: MenuItemPayload,
  actor?: AuditActor,
) => {
  const menuItem = await menuItemRepository.create(payload);
  const publicMenuItem = toPublicMenuItem(menuItem);

  await bumpMenuVersion();

  if (actor) {
    await recordAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'menu_item.created',
      entityType: 'menu_item',
      entityId: publicMenuItem.id,
      after: publicMenuItem,
    });
  }

  return publicMenuItem;
};

export const updateMenuItem = async (
  menuItemId: string,
  payload: MenuItemPayload,
  actor?: AuditActor,
) => {
  const previousMenuItem = await menuItemRepository.findById(menuItemId);
  const menuItem = await menuItemRepository.updateById(menuItemId, payload);

  if (!menuItem) {
    throw new ServiceError('Menu item not found', 404);
  }

  const publicMenuItem = toPublicMenuItem(menuItem);

  await bumpMenuVersion();

  if (actor) {
    await recordAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'menu_item.updated',
      entityType: 'menu_item',
      entityId: publicMenuItem.id,
      before: previousMenuItem ? toPublicMenuItem(previousMenuItem) : undefined,
      after: publicMenuItem,
    });
  }

  return publicMenuItem;
};

export const deleteMenuItem = async (
  menuItemId: string,
  actor?: AuditActor,
) => {
  const menuItem = await menuItemRepository.deleteById(menuItemId);

  if (!menuItem) {
    throw new ServiceError('Menu item not found', 404);
  }

  const publicMenuItem = toPublicMenuItem(menuItem);

  await bumpMenuVersion();

  if (actor) {
    await recordAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'menu_item.deleted',
      entityType: 'menu_item',
      entityId: publicMenuItem.id,
      before: publicMenuItem,
    });
  }

  return publicMenuItem;
};
