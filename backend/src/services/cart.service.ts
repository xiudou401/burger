import { getMenuVersion } from './menu.service';
import { ServiceError } from '../errors/ServiceError';
import { menuItemRepository } from '../repositories/menu-item.repository';
import type { CartPayload } from '../validation/cart.schema';

export type CartStoredItem = CartPayload['items'][number];

export interface ValidatedCartMenuItem {
  id: string;
  name: string;
  image?: string;
  priceCents: number;
  category: string;
  isAvailable: boolean;
  quantity: number;
  subtotalCents: number;
}

export interface ValidateCartResult {
  items: ValidatedCartMenuItem[];
  totalCents: number;
  menuVersion: number;
}

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

  const result: ValidatedCartMenuItem[] = items.map((item) => {
    const menuItem = menuItemMap.get(item.id);

    if (!menuItem) {
      throw new ServiceError('Item is no longer available', 400, {
        code: 'MENU_ITEM_REMOVED',
        itemId: item.id,
      });
    }

    if (menuItem.isAvailable === false) {
      throw new ServiceError(`${menuItem.name} is currently sold out`, 400);
    }

    const subtotalCents = menuItem.priceCents * item.quantity;
    totalCents += subtotalCents;

    return {
      id: menuItem._id.toString(),
      name: menuItem.name,
      image: menuItem.image,
      priceCents: menuItem.priceCents,
      category: menuItem.category ?? 'burger',
      isAvailable: menuItem.isAvailable ?? true,
      quantity: item.quantity,
      subtotalCents,
    };
  });

  return {
    items: result,
    totalCents,
    menuVersion: currentVersion,
  };
};
