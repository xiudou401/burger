import { CartMenuItem } from '../../../types/cart';

export const calculateTotals = (menuItems: CartMenuItem[]) => {
  const totalQuantity = menuItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCents = menuItems.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  return { totalQuantity, totalCents };
};
