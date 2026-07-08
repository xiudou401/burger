import type { MenuItemPayload } from '../../api/menu-items';

export type AdminMenuForm = Omit<MenuItemPayload, 'priceCents'> & {
  price: string;
};

export const emptyMenuForm: AdminMenuForm = {
  name: '',
  description: '',
  price: '',
  image: '',
  category: 'burger',
  isAvailable: true,
  isFeatured: false,
};

export const menuItemToForm = (menuItem: {
  name: string;
  description?: string;
  priceCents: number;
  image?: string;
  category: MenuItemPayload['category'];
  isAvailable: boolean;
  isFeatured: boolean;
}): AdminMenuForm => ({
  name: menuItem.name,
  description: menuItem.description ?? '',
  price: (menuItem.priceCents / 100).toFixed(2),
  image: menuItem.image ?? '',
  category: menuItem.category,
  isAvailable: menuItem.isAvailable,
  isFeatured: menuItem.isFeatured,
});

export const buildMenuItemPayload = (form: AdminMenuForm): MenuItemPayload => {
  const name = form.name.trim();

  if (!name) {
    throw new Error('Name is required');
  }

  const price = Number(form.price);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Price must be greater than 0');
  }

  return {
    name,
    description: form.description.trim(),
    priceCents: Math.round(price * 100),
    image: form.image.trim(),
    category: form.category,
    isAvailable: form.isAvailable,
    isFeatured: form.isFeatured,
  };
};
