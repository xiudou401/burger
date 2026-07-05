import { getMenuVersion } from './menu.service';
import { ServiceError } from '../errors/ServiceError';
import { menuItemRepository } from '../repositories/menu-item.repository';
import { CartPayloadSchema } from '../validation/cart.schema';

export interface CartStoredItem {
  id: string;
  quantity: number;
}

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
  menuVersion: number,
): Promise<ValidateCartResult> => {
  const parsedCart = CartPayloadSchema.safeParse({ items, menuVersion });

  if (!parsedCart.success) {
    throw new ServiceError('Invalid cart payload', 400);
  }

  const validItems = parsedCart.data.items;
  const validMenuVersion = parsedCart.data.menuVersion;
  const currentVersion = await getMenuVersion();

  if (validMenuVersion !== currentVersion) {
    throw new ServiceError('Menu updated', 409);
  }

  const ids = validItems.map((item) => item.id);

  const menuItems = await menuItemRepository.findByIds(ids);

  const menuItemMap = new Map(
    menuItems.map((menuItem) => [menuItem._id.toString(), menuItem]),
  );

  let totalCents = 0;

  const result: ValidatedCartMenuItem[] = validItems.map((item) => {
    const menuItem = menuItemMap.get(item.id);

    if (!menuItem) {
      throw new ServiceError('Menu item removed', 400);
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
