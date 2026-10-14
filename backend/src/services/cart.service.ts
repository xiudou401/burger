import { getMenuVersion } from './menu.service';
import { ServiceError } from '../errors/ServiceError';
import { menuItemRepository } from '../repositories/menu-item.repository';
import type { CartPayload } from '../validation/cart.schema';
import type { MenuItemCategory } from '../models/menu-item.model';

export type CartStoredItem = CartPayload['items'][number];

export interface ValidatedCartMenuItem {
  id: string;
  name: string;
  image?: string;
  priceCents: number;
  category: MenuItemCategory;
  isAvailable: boolean;
  quantity: number;
  subtotalCents: number;
}

export interface ValidateCartResult {
  items: ValidatedCartMenuItem[];
  totalCents: number;
  menuVersion: number;
}

type InvalidCartItem =
  | {
      itemId: string;
      reason: 'removed';
    }
  | {
      itemId: string;
      reason: 'sold_out';
      name: string;
    };

export const validateCart = async (
  items: CartStoredItem[],
  menuVersion: CartPayload['menuVersion'],
): Promise<ValidateCartResult> => {
  const currentVersion = await getMenuVersion();

  if (menuVersion !== currentVersion) {
    throw new ServiceError('Menu updated', 409);
  }

  const ids = items.map((item) => item.id);

  const menuItems = await menuItemRepository.findByIds(ids);

  const menuItemMap = new Map(
    menuItems.map((menuItem) => [menuItem._id.toString(), menuItem]),
  );

  let totalCents = 0;
  const invalidItems: InvalidCartItem[] = [];
  const result: ValidatedCartMenuItem[] = [];

  items.forEach((item) => {
    const menuItem = menuItemMap.get(item.id);

    if (!menuItem) {
      invalidItems.push({
        itemId: item.id,
        reason: 'removed',
      });
      return;
    }

    if (menuItem.isAvailable === false) {
      invalidItems.push({
        itemId: item.id,
        reason: 'sold_out',
        name: menuItem.name,
      });
      return;
    }

    const subtotalCents = menuItem.priceCents * item.quantity;
    totalCents += subtotalCents;

    result.push({
      id: menuItem._id.toString(),
      name: menuItem.name,
      image: menuItem.image,
      priceCents: menuItem.priceCents,
      category: menuItem.category ?? 'burger',
      isAvailable: menuItem.isAvailable ?? true,
      quantity: item.quantity,
      subtotalCents,
    });
  });

  if (invalidItems.length > 0) {
    throw new ServiceError('Some cart items are no longer available', 400, {
      code: 'CART_ITEMS_INVALID',
      items: invalidItems,
    });
  }

  return {
    items: result,
    totalCents,
    menuVersion: currentVersion,
  };
};
